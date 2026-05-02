import express, { type Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "5mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

app.set("trust proxy", 1);

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  skip: (req) => !req.path.startsWith("/api"),
});
app.use(globalLimiter);

const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions, please try again later." },
});
app.use("/api/navigator-request", publicFormLimiter);
app.use("/api/partner-apply", publicFormLimiter);
app.use("/api/vob/submit", publicFormLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later." },
});
app.use("/api/admin/login", authLimiter);
app.use("/api/auth", authLimiter);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

async function cleanupTestRecords() {
  // Idempotent boot-time cleanup of obvious QA / smoke-test data so it
  // never appears in public directory or admin Trusted Partner Applications
  // / Partner Prospects views.
  //
  // Founder spec 2026-05-02: full pattern set covers all named test rows
  // (ABC Test, ACB - 7, ABC - 6/5/4/3/2, Test Company ABC, ABC Company,
  // Second Chance Job Center, [TEST], VC - Test, Smoke / Regression Test,
  // LIVE PAYMENT TEST). Runs on every boot; cheap when nothing matches.
  //
  // SAFETY:
  //   - trusted_services       → set is_active=false + name='[ARCHIVED] …'
  //                              (hides from public; reversible by hand).
  //   - partner_applications   → set status='archived' + admin_notes flag
  //                              ONLY a column update — Stripe / billing
  //                              are NEVER touched. If a row has a live
  //                              Stripe subscription (e.g. founder's $1
  //                              live test), the sub keeps running until
  //                              founder cancels it manually in the Stripe
  //                              dashboard. We just hide the row from the
  //                              admin tabs.
  //   - navigator_requests     → set status='resolved' + admin_notes flag
  //                              (preserved for forensic audit, not deleted).
  //
  // No pricing, no routing, no schema, no AI Guide changes.
  const TS_TEST_FILTER = `(
    name ~* '^\\s*A[BC]C[ -]+\\d+\\s*$'
    OR name ~* '^\\s*A[BC]C[ -]*Test\\s*$'
    OR name ILIKE '%[TEST]%'
    OR name ILIKE 'ABC Test%'
    OR name ILIKE '%ABC Company%'
    OR name ILIKE 'Test Company ABC%'
    OR name ILIKE 'TEST %'
    OR name ILIKE '%test partner%'
    OR name ILIKE '%test record%'
    OR name ILIKE '%placeholder%'
    OR name ILIKE '%LIVE PAYMENT TEST%'
    OR name ILIKE '%Smoke Test%'
    OR name ILIKE '%Regression Test%'
    OR name ILIKE '%VC - Test%'
    OR name ILIKE '%VC-Test%'
    OR name ILIKE '%Second Chance Job Center%'
    OR name ILIKE 'Veteran Care'
    OR name ILIKE 'Veteran Care %'
  )`;
  const PA_TEST_FILTER = `(
    company_name ~* '^\\s*A[BC]C[ -]+\\d+\\s*$'
    OR company_name ~* '^\\s*A[BC]C[ -]*Test\\s*$'
    OR company_name ILIKE '%[TEST]%'
    OR company_name ILIKE 'ABC Test%'
    OR company_name ILIKE '%ABC Company%'
    OR company_name ILIKE 'Test Company ABC%'
    OR company_name ILIKE 'TEST %'
    OR company_name ILIKE '%test partner%'
    OR company_name ILIKE '%test record%'
    OR company_name ILIKE '%placeholder%'
    OR company_name ILIKE '%LIVE PAYMENT TEST%'
    OR company_name ILIKE '%Smoke Test%'
    OR company_name ILIKE '%Regression Test%'
    OR company_name ILIKE '%VC - Test%'
    OR company_name ILIKE '%VC-Test%'
    OR company_name ILIKE '%Second Chance Job Center%'
    OR email ILIKE '%@test.%'
    OR email ILIKE '%@example.%'
    OR email ILIKE '%@example.com'
    OR email ILIKE 'founder-test%'
    OR email ILIKE '%@d1regression-test%'
    OR email ILIKE '%@regressiontest-stage%'
  )`;
  try {
    const { query: pgQuery } = await import("./pg-client");

    // (a) trusted_services — hide from public directory.
    const archivedTs = await pgQuery(
      `UPDATE trusted_services
         SET is_active = false,
             verification_status = 'rejected',
             name = '[ARCHIVED] ' || name
       WHERE name NOT ILIKE '[ARCHIVED]%'
         AND ${TS_TEST_FILTER}
       RETURNING id, name`,
    );
    if (archivedTs.length > 0) {
      console.log(
        `[boot-cleanup] archived ${archivedTs.length} trusted_services test row(s):`,
        archivedTs.map((r: any) => r.name).join(", "),
      );
    }

    // (b) partner_applications — hide from admin Trusted Partner Applications
    // / Partner Prospects tabs. Only updates `status` + `admin_notes`.
    // Stripe subscription_id / customer_id columns are intentionally untouched;
    // we never cancel or refund a live subscription from boot code.
    const archivedPa = await pgQuery(
      `UPDATE partner_applications
         SET status = 'archived',
             admin_notes = COALESCE(admin_notes, '') ||
               E'\\n[2026-05-02 boot-cleanup] Auto-archived as test record. ' ||
               'Stripe subscription (if any) is intentionally NOT cancelled — ' ||
               'cancel manually in Stripe dashboard if desired.',
             updated_at = NOW()
       WHERE status != 'archived'
         AND ${PA_TEST_FILTER}
       RETURNING id, company_name, status`,
    );
    if (archivedPa.length > 0) {
      console.log(
        `[boot-cleanup] archived ${archivedPa.length} partner_applications test row(s):`,
        archivedPa.map((r: any) => r.company_name).join(", "),
      );
    }
  } catch (err: any) {
    console.warn(`[boot-cleanup] skipped (${err?.message || err})`);
  }

  // (c) navigator_requests (Supabase) — resolve obvious test leads so they
  // disappear from the active inbox. Audit row preserved.
  try {
    const { supabaseQuery } = await import("./supabase-pg-client");
    const resolved = await supabaseQuery<{ id: string; veteran_name: string }>(
      `UPDATE navigator_requests
         SET status = 'resolved',
             admin_notes = COALESCE(admin_notes, '') ||
               E'\\n[2026-05-02 boot-cleanup] Auto-resolved as test lead. ' ||
               'Preserved for forensic audit; not deleted.',
             resolved_at = COALESCE(resolved_at, NOW())
       WHERE status != 'resolved'
         AND (
           veteran_name ILIKE '%test%'
           OR veteran_name ILIKE 'gate test%'
           OR veteran_name ILIKE 'smoke test%'
           OR veteran_name ILIKE '%regression%'
           OR veteran_name ILIKE 'Colin'
           OR veteran_name ILIKE 'Colin %'
           OR veteran_email ILIKE '%@test.%'
           OR veteran_email ILIKE '%@example.%'
           OR veteran_email ILIKE 'founder-test%'
           OR veteran_email ILIKE 'gate-test%'
           OR veteran_email ILIKE 'colinmslaven@%'
           OR veteran_email ILIKE 'colin@veterancare.com'
         )
       RETURNING id, veteran_name`,
    );
    if (resolved.length > 0) {
      console.log(
        `[boot-cleanup] resolved ${resolved.length} navigator_requests test lead(s)`,
      );
    }
  } catch (err: any) {
    console.warn(`[boot-cleanup] navigator_requests skipped (${err?.message || err})`);
  }
}

async function ensureSubcategoryTags() {
  // Idempotent boot-time tag enforcement. Production DB drifts from dev DB
  // because direct dev-side SQL doesn't propagate. This guarantees a known
  // set of partners carries the subcategory_slugs they need to surface in
  // sub pages on Trusted Services. UPDATE-only — never inserts. Cheap when
  // already correct.
  const tagPlan: Array<{ namePattern: string; subs: string[] }> = [
    { namePattern: "BootPrint", subs: ["emergency-housing", "homeless-veteran-services", "transitional-housing"] },
    { namePattern: "Tri-County Veterans Support Network", subs: ["emergency-housing", "homeless-veteran-services"] },
    { namePattern: "Navy Mutual Aid Association", subs: ["life-insurance"] },
    { namePattern: "AAFMAA", subs: ["life-insurance"] },
    { namePattern: "VA Life Insurance (VALife)", subs: ["life-insurance"] },
    { namePattern: "VALife", subs: ["life-insurance"] },
    // Founder spec T001 2026-04-30: explicit auto/home/health insurance
    // backfill so subcategory_slugs are present even on legacy seeded rows.
    { namePattern: "USAA Insurance", subs: ["auto-insurance", "home-insurance", "life-insurance"] },
    { namePattern: "GEICO Military", subs: ["auto-insurance"] },
    { namePattern: "TRICARE", subs: ["health-insurance"] },
    // Founder spec T002 2026-04-30: explicit Legal Services backfill so
    // each Legal subcategory drilldown has provider coverage. `va-claims`
    // intentionally NOT listed here — it stays as a backwards-compat
    // alias slug on the rows (set in the Seed.subs array below) for any
    // pre-existing deep-link URLs but is no longer used in new taxonomy.
    { namePattern: "ABA Veterans Claims Assistance Network", subs: ["disability-claims-assistance", "pro-bono-legal-services", "va-benefits-appeals"] },
    { namePattern: "Stateside Legal", subs: ["legal-aid-services", "disability-claims-assistance", "va-benefits-appeals"] },
    { namePattern: "Veterans Consortium Pro Bono", subs: ["pro-bono-legal-services", "disability-claims-assistance", "va-benefits-appeals"] },
    // Founder spec T003 2026-04-30: explicit Employment / Training
    // backfill for canonical 8-subcategory taxonomy (matches new
    // emp-subcategories.ts UI list). Three new providers seeded below
    // also carry these via their own Seed.subs arrays.
    { namePattern: "VA VR&E", subs: ["vocational-rehabilitation"] },
    { namePattern: "Helmets to Hardhats", subs: ["apprenticeships-skilled-trades"] },
    { namePattern: "SBA Office of Veterans Business Development", subs: ["entrepreneurship-small-business-support"] },
  ];
  try {
    const { query: pgQuery } = await import("./pg-client");
    for (const t of tagPlan) {
      const updated = await pgQuery(
        `UPDATE trusted_services
            SET subcategory_slugs = (
              SELECT ARRAY(SELECT DISTINCT unnest(COALESCE(subcategory_slugs, '{}'::text[]) || $2::text[]))
            )
          WHERE name ILIKE $1
            AND NOT (COALESCE(subcategory_slugs, '{}'::text[]) @> $2::text[])
          RETURNING id, name, subcategory_slugs`,
        [`%${t.namePattern}%`, t.subs],
      );
      if (updated.length > 0) {
        console.log(`[boot-tags] tagged ${updated.length} for "${t.namePattern}":`,
          updated.map((r: any) => `${r.name} -> ${JSON.stringify(r.subcategory_slugs)}`).join("; "));
      }
    }
  } catch (err: any) {
    console.warn(`[boot-tags] skipped (${err?.message || err})`);
  }
}

async function ensureSeededNationalProviders() {
  // Idempotent boot-time seed for national-provider directory inventory.
  // Production drifts from dev because direct dev SQL doesn't propagate.
  // INSERT-only via NOT EXISTS — never touches existing rows, never
  // deactivates, never overwrites founder admin edits. Cheap when already
  // present (single existence check per row).
  type Seed = {
    name: string;
    categorySlug: string;
    shortDescription: string;
    websiteUrl: string;
    phone: string | null;
    subs: string[];
  };
  const seeds: Seed[] = [
    // Housing & Home Services (2 — VA mortgage lenders moved to financial-credit
    // and cross-listed back to housing-home via crossListSpecs below)
    { name: "PCSgrades", categorySlug: "housing-home", shortDescription: "Trusted veteran/military-run review platform for movers, real estate agents, and PCS-related services nationwide.", websiteUrl: "https://www.pcsgrades.com", phone: null, subs: ["moving-relocation"] },
    { name: "Military OneSource — Moving / PCS", categorySlug: "housing-home", shortDescription: "DoD-backed PCS planning, moving entitlements, and housing resource hub for service members and families.", websiteUrl: "https://www.militaryonesource.mil/moving-housing/moving/", phone: "800-342-9647", subs: ["moving-relocation"] },
    // VA Mortgage lenders — primary in Financial & Credit (canonical va-loans
    // subcategory after taxonomy consolidation), cross-listed to housing-home.
    { name: "USAA Mortgage", categorySlug: "financial-credit", shortDescription: "VA loans and mortgage products exclusively for military members, veterans, and their families.", websiteUrl: "https://www.usaa.com", phone: "800-531-0341", subs: ["va-loans"] },
    { name: "Veterans United Home Loans", categorySlug: "financial-credit", shortDescription: "#1 VA mortgage lender. VA loans, refinancing, and home buying education for veterans nationwide.", websiteUrl: "https://www.veteransunited.com", phone: "800-884-5560", subs: ["va-loans"] },
    { name: "Navy Federal Credit Union — Mortgage", categorySlug: "financial-credit", shortDescription: "VA loans, conventional mortgages, and HomeBuyers Choice loans for military and veterans.", websiteUrl: "https://www.navyfederal.org", phone: "888-842-6328", subs: ["va-loans"] },
    // Financial & Credit Services (4)
    { name: "National Foundation for Credit Counseling (NFCC)", categorySlug: "financial-credit", shortDescription: "Largest nonprofit credit counseling network in the U.S. with veteran-focused programs.", websiteUrl: "https://www.nfcc.org", phone: "800-388-2227", subs: ["credit-repair", "budgeting-financial-coaching"] },
    { name: "Operation Homefront — Financial Assistance", categorySlug: "financial-credit", shortDescription: "Long-standing emergency financial relief and assistance for military and veteran families.", websiteUrl: "https://www.operationhomefront.org", phone: "210-659-7756", subs: ["budgeting-financial-coaching"] },
    { name: "Veterans Benefits Banking Program (VBBP)", categorySlug: "financial-credit", shortDescription: "VA-endorsed program connecting veterans to participating banks and credit unions for safe direct deposit.", websiteUrl: "https://www.veteransbenefitsbanking.org", phone: null, subs: ["banking-lending-support"] },
    { name: "Freedom Debt Relief", categorySlug: "financial-credit", shortDescription: "National debt resolution provider offering structured debt relief programs.", websiteUrl: "https://www.freedomdebtrelief.com", phone: "800-655-6303", subs: ["debt-relief", "debt-management"] },
    // Insurance Services (3) — subcategory_slugs backfilled
    { name: "AAFMAA (American Armed Forces Mutual Aid Association)", categorySlug: "insurance", shortDescription: "Oldest nonprofit financial-services and insurance org for the U.S. military community.", websiteUrl: "https://www.aafmaa.com", phone: "877-398-2263", subs: ["life-insurance"] },
    { name: "Navy Mutual Aid Association", categorySlug: "insurance", shortDescription: "Trusted nonprofit life insurance provider for sea-service members, veterans, and families since 1879.", websiteUrl: "https://www.navymutual.org", phone: "800-628-6011", subs: ["life-insurance"] },
    // Insurance Services (3 NEW — founder spec T001 2026-04-30: explicit
    // auto / home / health insurance providers per category cleanup so each
    // insurance subcategory has at least one canonical national listing).
    { name: "USAA Insurance", categorySlug: "insurance", shortDescription: "Auto, home, and life insurance with deep military and veteran roots — bundles, military discounts, and PCS-friendly coverage nationwide.", websiteUrl: "https://www.usaa.com/insurance", phone: "800-531-8722", subs: ["auto-insurance", "home-insurance", "life-insurance"] },
    { name: "GEICO Military Discount", categorySlug: "insurance", shortDescription: "Auto insurance with a long-standing military discount program for active duty, retired, and National Guard / Reserve members.", websiteUrl: "https://www.geico.com/military/", phone: "800-861-8380", subs: ["auto-insurance"] },
    { name: "TRICARE", categorySlug: "insurance", shortDescription: "DoD-managed health care program for uniformed service members, retirees, and their families across all 50 states and overseas.", websiteUrl: "https://www.tricare.mil", phone: "877-874-2273", subs: ["health-insurance"] },
    { name: "VA Life Insurance (VALife)", categorySlug: "insurance", shortDescription: "Official VA life insurance program for service-connected veterans.", websiteUrl: "https://www.va.gov/life-insurance", phone: "800-669-8477", subs: ["life-insurance"] },
    // Legal Services (3) — founder spec T002 2026-04-30: subs expanded so
    // each provider surfaces under its correct canonical legal subcategory
    // (Pro Bono / Legal Aid / VA Benefits Appeals / Disability Claims).
    // `va-claims` kept as backwards-compat alias slug for any deep-link
    // URLs but is no longer part of the canonical 12-subcategory taxonomy.
    { name: "ABA Veterans Claims Assistance Network (VCAN)", categorySlug: "legal-services", shortDescription: "American Bar Association program offering pro bono claims assistance to veterans nationwide.", websiteUrl: "https://www.americanbar.org/groups/legal_services/milvets/", phone: null, subs: ["va-claims", "disability-claims-assistance", "pro-bono-legal-services", "va-benefits-appeals"] },
    { name: "Stateside Legal", categorySlug: "legal-services", shortDescription: "Free legal information hub for veterans/military, run in partnership with Legal Services Corporation.", websiteUrl: "https://www.statesidelegal.org", phone: null, subs: ["va-claims", "legal-aid-services", "disability-claims-assistance", "va-benefits-appeals"] },
    { name: "Veterans Consortium Pro Bono Program", categorySlug: "legal-services", shortDescription: "Court-affiliated pro bono representation at the U.S. Court of Appeals for Veterans Claims.", websiteUrl: "https://www.vetsprobono.org", phone: "202-628-8164", subs: ["va-claims", "disability-claims-assistance", "pro-bono-legal-services", "va-benefits-appeals"] },
    // Education & Training (3)
    { name: "Hire Heroes USA", categorySlug: "education-training", shortDescription: "Free career coaching, job-search assistance, and training for veterans, transitioning service members, and military spouses.", websiteUrl: "https://www.hireheroes.org", phone: "844-634-1520", subs: ["certifications-licensing"] },
    { name: "Onward to Opportunity (IVMF Syracuse)", categorySlug: "education-training", shortDescription: "No-cost career training and certifications for transitioning service members, veterans, and military spouses, by the Institute for Veterans and Military Families.", websiteUrl: "https://ivmf.syracuse.edu/programs/career-training/onward-to-opportunity/", phone: "315-443-0141", subs: ["certifications-licensing"] },
    { name: "VA Education Benefits (GI Bill)", categorySlug: "education-training", shortDescription: "Official authoritative source for GI Bill, VR&E, and VET TEC education benefits.", websiteUrl: "https://www.va.gov/education", phone: "888-442-4551", subs: ["gi-bill-assistance"] },
    // Employment Support (2 net-new; Hire Heroes USA stays primary in Education and is cross-listed below)
    { name: "RecruitMilitary (Bradley-Morris)", categorySlug: "employment-support", shortDescription: "National veteran job board with monthly virtual and in-person hiring fairs connecting veterans to employers nationwide.", websiteUrl: "https://recruitmilitary.com", phone: "513-683-5020", subs: ["job-placement-programs", "veteran-friendly-employers"] },
    { name: "DOL VETS / American Job Centers (CareerOneStop)", categorySlug: "employment-support", shortDescription: "U.S. Department of Labor Veterans' Employment & Training Service. Locate American Job Centers and access DVOP/LVER priority-of-service nationwide.", websiteUrl: "https://www.careeronestop.org/Veterans/default.aspx", phone: "877-872-5627", subs: ["dvop-workforce-programs", "federal-employment"] },
    // Employment Support (3 NEW — founder spec T003 2026-04-30: fill
    // currently-empty Vocational Rehab / Apprenticeships / Entrepreneurship
    // subcategories per canonical 8-subcategory taxonomy).
    { name: "VA VR&E (Veteran Readiness and Employment)", categorySlug: "employment-support", shortDescription: "Official VA Vocational Rehabilitation & Employment program (Chapter 31). Career counseling, training, and employment services for service-disabled veterans nationwide.", websiteUrl: "https://www.va.gov/careers-employment/vocational-rehabilitation/", phone: "800-827-1000", subs: ["vocational-rehabilitation"] },
    { name: "Helmets to Hardhats", categorySlug: "employment-support", shortDescription: "National non-profit pipeline connecting transitioning service members and veterans to federally-approved apprenticeship and skilled-trades careers in the building and construction industry.", websiteUrl: "https://helmetstohardhats.org", phone: "866-741-6210", subs: ["apprenticeships-skilled-trades"] },
    { name: "SBA Office of Veterans Business Development (OVBD)", categorySlug: "employment-support", shortDescription: "Small Business Administration Veterans Business Outreach Centers (VBOCs) — free counseling, training, and capital-access guidance for veteran-owned and aspiring veteran-entrepreneur businesses nationwide.", websiteUrl: "https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses", phone: "202-205-6773", subs: ["entrepreneurship-small-business-support"] },
  ];

  try {
    const { query: pgQuery } = await import("./pg-client");
    let inserted = 0;
    let alreadyPresent = 0;
    const insertedNames: string[] = [];
    for (const s of seeds) {
      const result = await pgQuery(
        `INSERT INTO trusted_services
           (category_id, name, short_description, website_url, phone,
            is_active, is_national, verification_status, verification_label,
            listing_type, subcategory_slugs, notes_internal)
         SELECT c.id, $2, $3, $4, $5,
                true, true, 'national-provider', 'National Provider',
                'directory', $6::text[], 'seed: bootstrap national-provider inventory'
         FROM trusted_service_categories c
         WHERE c.slug = $1
           AND NOT EXISTS (
             SELECT 1 FROM trusted_services ts WHERE ts.name ILIKE $2
           )
         RETURNING id, name`,
        [s.categorySlug, s.name, s.shortDescription, s.websiteUrl, s.phone, s.subs],
      );
      if (result.length > 0) {
        inserted++;
        insertedNames.push(s.name);
      } else {
        alreadyPresent++;
      }
    }

    // Subcategory backfill pass — guarantees subcategory_slugs are present
    // even if the row was inserted previously without them. UPDATE-only,
    // array-union, no-op when already correct (mirror of ensureSubcategoryTags).
    let subBackfills = 0;
    for (const s of seeds) {
      if (s.subs.length === 0) continue;
      const updated = await pgQuery(
        `UPDATE trusted_services
            SET subcategory_slugs = (
              SELECT ARRAY(SELECT DISTINCT unnest(COALESCE(subcategory_slugs, '{}'::text[]) || $2::text[]))
            )
          WHERE name ILIKE $1
            AND NOT (COALESCE(subcategory_slugs, '{}'::text[]) @> $2::text[])
          RETURNING id`,
        [s.name, s.subs],
      );
      subBackfills += updated.length;
    }

    console.log(`[seed-sync] inserted=${inserted} already_present=${alreadyPresent} subcat_backfilled=${subBackfills}`);
    if (insertedNames.length > 0) {
      console.log(`[seed-sync] new partners: ${insertedNames.join(", ")}`);
    }

    // Cross-list pass — Hire Heroes USA stays primary in Education & Training and is
    // additionally surfaced under Employment Support via cross_list_category_slugs.
    // Idempotent: array-union both columns, no-op when already correct.
    let crossListed = 0;
    const crossListSpecs: Array<{ name: string; addCrossLists: string[]; addSubs: string[] }> = [
      { name: "Hire Heroes USA", addCrossLists: ["employment-support"], addSubs: ["job-placement-programs", "resume-career-coaching"] },
      // VA mortgage lenders: primary in financial-credit, surfaced under housing-home too
      { name: "USAA Mortgage", addCrossLists: ["housing-home"], addSubs: [] },
      { name: "Veterans United Home Loans", addCrossLists: ["housing-home"], addSubs: [] },
      { name: "Navy Federal Credit Union — Mortgage", addCrossLists: ["housing-home"], addSubs: [] },
    ];
    for (const c of crossListSpecs) {
      const updated = await pgQuery(
        `UPDATE trusted_services
            SET cross_list_category_slugs = (
                  SELECT ARRAY(SELECT DISTINCT unnest(COALESCE(cross_list_category_slugs, '{}'::text[]) || $2::text[]))
                ),
                subcategory_slugs = (
                  SELECT ARRAY(SELECT DISTINCT unnest(COALESCE(subcategory_slugs, '{}'::text[]) || $3::text[]))
                )
          WHERE name ILIKE $1
            AND (
              NOT (COALESCE(cross_list_category_slugs, '{}'::text[]) @> $2::text[])
              OR NOT (COALESCE(subcategory_slugs, '{}'::text[]) @> $3::text[])
            )
          RETURNING id`,
        [c.name, c.addCrossLists, c.addSubs],
      );
      crossListed += updated.length;
    }
    console.log(`[seed-sync] cross_listed=${crossListed}`);
  } catch (err: any) {
    console.warn(`[seed-sync] skipped (${err?.message || err})`);
  }
}

async function ensureSubcategoryAliases() {
  // Idempotent migration of legacy partner_subcategories rows + trusted_services.subcategory_slugs
  // arrays to the canonical client-side slugs that LEGAL_SUBCATEGORIES / EDU_SUBCATEGORIES use.
  // Founder taxonomy: "Disability Claims Assistance" (legal), "GI Bill Assistance" (education).
  const aliases: Array<{ catSlug: string; oldSlug: string; newSlug: string; newName: string }> = [
    { catSlug: "legal-services", oldSlug: "disability-va-appeals", newSlug: "disability-claims-assistance", newName: "Disability Claims Assistance" },
    { catSlug: "legal-services", oldSlug: "disability-appeals", newSlug: "disability-claims-assistance", newName: "Disability Claims Assistance" },
    { catSlug: "education-training", oldSlug: "gi-bill-tuition", newSlug: "gi-bill-assistance", newName: "GI Bill Assistance" },
  ];
  // Legacy duplicate Legal rows that should be deactivated entirely (no replacement).
  const dedupSlugs: Array<{ catSlug: string; slug: string }> = [
    { catSlug: "legal-services", slug: "estate-planning" }, // duplicate of estate-planning-legal
  ];
  let renamedRows = 0, dedupedRows = 0, arraysMigrated = 0;
  try {
    const { query: pgQuery } = await import("./pg-client");
    for (const a of aliases) {
      // Resolve category id from trusted_service_categories
      const cat = await pgQuery(`SELECT id FROM trusted_service_categories WHERE slug=$1`, [a.catSlug]);
      const catId = cat[0]?.id;
      if (!catId) continue;
      // If new slug row already exists, just deactivate the old slug row (collision-safe).
      const newExists = await pgQuery(
        `SELECT id FROM partner_subcategories WHERE category_id=$1 AND slug=$2`,
        [catId, a.newSlug]
      );
      if (newExists.length > 0) {
        const r = await pgQuery(
          `UPDATE partner_subcategories SET is_active=false WHERE category_id=$1 AND slug=$2 AND is_active=true RETURNING id`,
          [catId, a.oldSlug]
        );
        dedupedRows += (r as any).length || 0;
      } else {
        // Rename the old row in place: update slug + name. Idempotent — no-op if slug already migrated.
        const r = await pgQuery(
          `UPDATE partner_subcategories SET slug=$1, name=$2, is_active=true WHERE category_id=$3 AND slug=$4 RETURNING id`,
          [a.newSlug, a.newName, catId, a.oldSlug]
        );
        renamedRows += (r as any).length || 0;
      }
      // Migrate any trusted_services rows whose subcategory_slugs array contains the old slug.
      const arr = await pgQuery(
        `UPDATE trusted_services
           SET subcategory_slugs = array_replace(subcategory_slugs, $1, $2)
         WHERE $1 = ANY(subcategory_slugs)
         RETURNING id`,
        [a.oldSlug, a.newSlug]
      );
      arraysMigrated += (arr as any).length || 0;
    }
    for (const d of dedupSlugs) {
      const cat = await pgQuery(`SELECT id FROM trusted_service_categories WHERE slug=$1`, [d.catSlug]);
      const catId = cat[0]?.id;
      if (!catId) continue;
      const r = await pgQuery(
        `UPDATE partner_subcategories SET is_active=false WHERE category_id=$1 AND slug=$2 AND is_active=true RETURNING id`,
        [catId, d.slug]
      );
      dedupedRows += (r as any).length || 0;
    }
    // Final pass: dedupe trusted_services.subcategory_slugs arrays (the seed-sync union
    // can leave duplicates after an alias rewrite). Idempotent — no-op when already unique.
    const dedupArr = await pgQuery(
      `UPDATE trusted_services
         SET subcategory_slugs = ARRAY(SELECT DISTINCT unnest(subcategory_slugs))
       WHERE cardinality(subcategory_slugs) <> cardinality(ARRAY(SELECT DISTINCT unnest(subcategory_slugs)))
       RETURNING id`
    );
    const arrDeduped = (dedupArr as any).length || 0;
    console.log(`[subcategory-aliases] renamed=${renamedRows} deduped=${dedupedRows} array_rows_migrated=${arraysMigrated} arrays_deduped=${arrDeduped}`);
  } catch (err: any) {
    console.warn(`[subcategory-aliases] skipped (${err?.message || err})`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOT SEQUENCE — port opens IMMEDIATELY so Replit Autoscale's 60-second
// port-open deadline is met. All schema checks / seeds / migrations / route
// registration run in the BACKGROUND after listen(). Until they finish,
// non-health requests get a 503 with Retry-After. Zero behavior change to
// any existing schema / seed / migration work — only WHEN it runs.
// ─────────────────────────────────────────────────────────────────────────────

let bootComplete = false;
let bootError: string | null = null;

// Health endpoint — always available, always responds (status reflects boot state).
// /healthz is kept for dev-only diagnostic use. On prod, Replit's upstream Google
// Cloud Load Balancer intercepts /healthz and returns its own 404 before the
// request reaches Express (Kubernetes-convention reserved path). Use /api/health
// for prod monitoring — see FOUNDER LOCK IN rule #4 in replit.md.
app.get("/healthz", (_req, res) => {
  res.status(200).json({
    status: bootComplete ? "ready" : "booting",
    bootError,
  });
});

// Official production health endpoint — registered EARLY so it stays 200 even
// during the ~30s background boot window. Mirrors the response shape of the
// /api/health route registered later in registerRoutes (Express uses
// first-registered-wins, so this early handler short-circuits before the
// boot-status middleware below). FOUNDER LOCK IN rule #4 — DO NOT change shape.
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Boot-status middleware — short-circuits non-health requests with 503
// until background initialization completes. Once bootComplete=true this
// is a single boolean check per request and falls through to the real routes.
app.use((req, res, next) => {
  if (bootComplete) return next();
  if (req.path === "/healthz" || req.path === "/health") return next();
  res
    .status(503)
    .set("Retry-After", "5")
    .type("text/plain")
    .send("App is initializing — please retry in a few seconds.");
});

// Open the port IMMEDIATELY (must happen within Replit's 60-second deadline).
// ALWAYS serve the app on the port specified in the environment variable PORT.
// Other ports are firewalled. Default to 5000 if not specified.
// this serves both the API and the client.
// It is the only port that is not firewalled.
const port = parseInt(process.env.PORT || "5000", 10);
httpServer.listen(
  {
    port,
    host: "0.0.0.0",
    reusePort: true,
  },
  () => {
    log(`serving on port ${port}`);
  },
);

// Background initialization — runs after port is open.
// Errors are logged but never crash the process; /healthz stays up so
// Replit doesn't kill the container, and the failure surfaces in logs
// + /healthz response for diagnosis.
(async () => {
  try {
    log("[boot] starting background initialization (schema checks, seeds, routes)");

    await cleanupTestRecords();
    await ensureSubcategoryTags();
    await ensureSubcategoryAliases();
    await ensureSeededNationalProviders();
    // Founder QA 2026-05-01 (Item #2): idempotent ALTER on navigator_requests
    // to add lead_expires_at + expired_at columns. Runs via direct supabase
    // pg connection (SUPABASE_DB_PASSWORD). Safe no-op if columns exist.
    try {
      const { ensureLeadExpirationColumns } = await import("./lead-expiration");
      await ensureLeadExpirationColumns();
    } catch (err: any) {
      log(`[boot] ensureLeadExpirationColumns skipped: ${err?.message}`);
    }
    await registerRoutes(httpServer, app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    bootComplete = true;
    log("[boot] ✅ background initialization complete — all routes ready");
  } catch (err: any) {
    bootError = err?.message || String(err);
    log(`[boot] ❌ background initialization failed: ${bootError}`);
    log(`[boot] /healthz remains available; container stays alive for diagnosis`);
  }
})();
