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
  // Idempotent boot-time cleanup. Production has historical seed/test
  // records (ABC - 2, ABC 4, ABC - 6, LIVE PAYMENT TEST, etc.) that the
  // founder needs archived from public-facing surfaces. Runs every boot;
  // cheap when nothing matches. Uses pg pool already wired in pg-client.
  try {
    const { query: pgQuery } = await import("./pg-client");
    const archived = await pgQuery(
      `UPDATE trusted_services
         SET is_active = false,
             verification_status = 'rejected',
             name = '[ARCHIVED] ' || name
       WHERE name NOT ILIKE '[ARCHIVED]%'
         AND (
           name ~* '^\\s*A[BC]C[ -]*\\d+\\s*$'
           OR name ~* '^\\s*ACB[ -]*\\d+\\s*$'
           OR name ILIKE '%LIVE PAYMENT TEST%'
           OR name ILIKE '%test record%'
           OR name ILIKE '%test partner%'
           OR name ILIKE '%placeholder%'
           OR name ILIKE 'TEST %'
           OR name ILIKE 'Veteran Care'
           OR name ILIKE 'Veteran Care %'
         )
       RETURNING id, name`,
    );
    if (archived.length > 0) {
      console.log(`[boot-cleanup] archived ${archived.length} test records:`,
        archived.map((r: any) => r.name).join(", "));
    }
  } catch (err: any) {
    console.warn(`[boot-cleanup] skipped (${err?.message || err})`);
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
            AND NOT (subcategory_slugs @> $2::text[])
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
    // Housing & Home Services (5)
    { name: "USAA Mortgage", categorySlug: "housing-home", shortDescription: "VA loans and mortgage products exclusively for military members, veterans, and their families.", websiteUrl: "https://www.usaa.com", phone: "800-531-0341", subs: ["va-home-loans", "home-ownership"] },
    { name: "Veterans United Home Loans", categorySlug: "housing-home", shortDescription: "#1 VA mortgage lender. VA loans, refinancing, and home buying education for veterans nationwide.", websiteUrl: "https://www.veteransunited.com", phone: "800-884-5560", subs: ["va-home-loans", "home-ownership"] },
    { name: "Navy Federal Credit Union — Mortgage", categorySlug: "housing-home", shortDescription: "VA loans, conventional mortgages, and HomeBuyers Choice loans for military and veterans.", websiteUrl: "https://www.navyfederal.org", phone: "888-842-6328", subs: ["va-home-loans", "home-ownership"] },
    { name: "PCSgrades", categorySlug: "housing-home", shortDescription: "Trusted veteran/military-run review platform for movers, real estate agents, and PCS-related services nationwide.", websiteUrl: "https://www.pcsgrades.com", phone: null, subs: ["moving-relocation"] },
    { name: "Military OneSource — Moving / PCS", categorySlug: "housing-home", shortDescription: "DoD-backed PCS planning, moving entitlements, and housing resource hub for service members and families.", websiteUrl: "https://www.militaryonesource.mil/moving-housing/moving/", phone: "800-342-9647", subs: ["moving-relocation"] },
    // Financial & Credit Services (4)
    { name: "National Foundation for Credit Counseling (NFCC)", categorySlug: "financial-credit", shortDescription: "Largest nonprofit credit counseling network in the U.S. with veteran-focused programs.", websiteUrl: "https://www.nfcc.org", phone: "800-388-2227", subs: ["credit-repair", "budgeting-financial-coaching"] },
    { name: "Operation Homefront — Financial Assistance", categorySlug: "financial-credit", shortDescription: "Long-standing emergency financial relief and assistance for military and veteran families.", websiteUrl: "https://www.operationhomefront.org", phone: "210-659-7756", subs: ["budgeting-financial-coaching"] },
    { name: "Veterans Benefits Banking Program (VBBP)", categorySlug: "financial-credit", shortDescription: "VA-endorsed program connecting veterans to participating banks and credit unions for safe direct deposit.", websiteUrl: "https://www.veteransbenefitsbanking.org", phone: null, subs: ["banking-lending-support"] },
    { name: "Freedom Debt Relief", categorySlug: "financial-credit", shortDescription: "National debt resolution provider offering structured debt relief programs.", websiteUrl: "https://www.freedomdebtrelief.com", phone: "800-655-6303", subs: ["debt-relief", "debt-management"] },
    // Insurance Services (3) — subcategory_slugs backfilled
    { name: "AAFMAA (American Armed Forces Mutual Aid Association)", categorySlug: "insurance", shortDescription: "Oldest nonprofit financial-services and insurance org for the U.S. military community.", websiteUrl: "https://www.aafmaa.com", phone: "877-398-2263", subs: ["life-insurance"] },
    { name: "Navy Mutual Aid Association", categorySlug: "insurance", shortDescription: "Trusted nonprofit life insurance provider for sea-service members, veterans, and families since 1879.", websiteUrl: "https://www.navymutual.org", phone: "800-628-6011", subs: ["life-insurance"] },
    { name: "VA Life Insurance (VALife)", categorySlug: "insurance", shortDescription: "Official VA life insurance program for service-connected veterans.", websiteUrl: "https://www.va.gov/life-insurance", phone: "800-669-8477", subs: ["life-insurance"] },
    // Legal Services (3)
    { name: "ABA Veterans Claims Assistance Network (VCAN)", categorySlug: "legal-services", shortDescription: "American Bar Association program offering pro bono claims assistance to veterans nationwide.", websiteUrl: "https://www.americanbar.org/groups/legal_services/milvets/", phone: null, subs: ["va-claims", "disability-claims-assistance"] },
    { name: "Stateside Legal", categorySlug: "legal-services", shortDescription: "Free legal information hub for veterans/military, run in partnership with Legal Services Corporation.", websiteUrl: "https://www.statesidelegal.org", phone: null, subs: ["va-claims"] },
    { name: "Veterans Consortium Pro Bono Program", categorySlug: "legal-services", shortDescription: "Court-affiliated pro bono representation at the U.S. Court of Appeals for Veterans Claims.", websiteUrl: "https://www.vetsprobono.org", phone: "202-628-8164", subs: ["va-claims", "disability-claims-assistance"] },
    // Education & Training (3)
    { name: "Hire Heroes USA", categorySlug: "education-training", shortDescription: "Free career coaching, job-search assistance, and training for veterans, transitioning service members, and military spouses.", websiteUrl: "https://www.hireheroes.org", phone: "844-634-1520", subs: ["certifications-licensing"] },
    { name: "Onward to Opportunity (IVMF Syracuse)", categorySlug: "education-training", shortDescription: "No-cost career training and certifications for transitioning service members, veterans, and military spouses, by the Institute for Veterans and Military Families.", websiteUrl: "https://ivmf.syracuse.edu/programs/career-training/onward-to-opportunity/", phone: "315-443-0141", subs: ["certifications-licensing"] },
    { name: "VA Education Benefits (GI Bill)", categorySlug: "education-training", shortDescription: "Official authoritative source for GI Bill, VR&E, and VET TEC education benefits.", websiteUrl: "https://www.va.gov/education", phone: "888-442-4551", subs: ["gi-bill-assistance"] },
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
            AND NOT (subcategory_slugs @> $2::text[])
          RETURNING id`,
        [s.name, s.subs],
      );
      subBackfills += updated.length;
    }

    console.log(`[seed-sync] inserted=${inserted} already_present=${alreadyPresent} subcat_backfilled=${subBackfills}`);
    if (insertedNames.length > 0) {
      console.log(`[seed-sync] new partners: ${insertedNames.join(", ")}`);
    }
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

(async () => {
  await cleanupTestRecords();
  await ensureSubcategoryTags();
  await ensureSubcategoryAliases();
  await ensureSeededNationalProviders();
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

  // ALWAYS serve the app on the port specified in the environment variable PORT
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
})();
