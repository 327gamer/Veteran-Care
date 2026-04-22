/**
 * Backfill the 22 NC R3 subcategory junctions that missed at insert time.
 * R3 used wrong sub names for substance-recovery and financial categories.
 * This script maps each row to the correct existing sub.
 */
import { supabaseAdmin } from "../server/supabase";

const FIXES: { title: string; categorySlug: string; subName: string }[] = [
  { title: "Salisbury VA Substance Use Disorder Program", categorySlug: "substance-recovery", subName: "Veteran Recovery Programs" },
  { title: "Durham VA Substance Use Disorder Program", categorySlug: "substance-recovery", subName: "Veteran Recovery Programs" },
  { title: "Asheville VA Substance Use Disorder Program", categorySlug: "substance-recovery", subName: "Veteran Recovery Programs" },
  { title: "Fayetteville VA Substance Use Disorder Program", categorySlug: "substance-recovery", subName: "Veteran Recovery Programs" },
  { title: "TROSA — Long-Term Residential Recovery (Durham)", categorySlug: "substance-recovery", subName: "Recovery Support Services" },
  { title: "Healing Transitions (Raleigh)", categorySlug: "substance-recovery", subName: "Recovery Support Services" },
  { title: "McLeod Addictive Disease Center (Charlotte)", categorySlug: "substance-recovery", subName: "Outpatient Recovery" },
  { title: "Pavillon Treatment Center (Mill Spring)", categorySlug: "substance-recovery", subName: "Detox Programs" },
  { title: "Insight Human Services (Winston-Salem)", categorySlug: "substance-recovery", subName: "Outpatient Recovery" },
  { title: "Walter B. Jones ADATC (Greenville)", categorySlug: "substance-recovery", subName: "Detox Programs" },
  { title: "RHA Health Services — Veteran SUD Programs (NC)", categorySlug: "substance-recovery", subName: "Outpatient Recovery" },
  { title: "Carolina Outreach (Durham/Triangle)", categorySlug: "substance-recovery", subName: "Outpatient Recovery" },
  { title: "Veterans Bridge Home — Financial Coaching (Charlotte)", categorySlug: "financial", subName: "Budgeting & Financial Coaching" },
  { title: "Self-Help Credit Union — Veteran Financial Services (NC)", categorySlug: "financial", subName: "Banking / Lending Support" },
  { title: "Latino Community Credit Union — Financial Coaching (NC)", categorySlug: "financial", subName: "Banking / Lending Support" },
  { title: "Consumer Credit Counseling Service of Forsyth County", categorySlug: "financial", subName: "Debt Counseling" },
  { title: "OnTrack Financial Education & Counseling (Asheville)", categorySlug: "financial", subName: "Debt Counseling" },
  { title: "NCDMVA Financial Hardship Assistance", categorySlug: "financial", subName: "Emergency Financial Assistance" },
  { title: "Coalition Mortgage Group — VA Loan Specialists (Triangle)", categorySlug: "financial", subName: "VA Loans" },
  { title: "Truliant Federal Credit Union — Veteran Programs (NC)", categorySlug: "financial", subName: "Banking / Lending Support" },
  { title: "Sandhills Community Action Program — Financial Help", categorySlug: "financial", subName: "Utility Bill Assistance" },
  { title: "NC State Treasurer Retirement Systems — Military Service Credit", categorySlug: "financial", subName: "Pension Assistance" },
];

async function main() {
  // Build sub map
  const { data: cats } = await supabaseAdmin.from("categories").select("id, slug");
  const slugToCatId = new Map<string, string>((cats || []).map((c: any) => [c.slug, c.id]));
  const { data: subs } = await supabaseAdmin.from("subcategories").select("id, name, category_id");
  const subKey = (catSlug: string, name: string) => `${catSlug}|${name.toLowerCase()}`;
  const subMap = new Map<string, string>();
  (subs || []).forEach((s: any) => {
    const slug = [...slugToCatId.entries()].find(([, id]) => id === s.category_id)?.[0];
    if (slug) subMap.set(subKey(slug, s.name), s.id);
  });

  let fixed = 0, missing = 0, errors: string[] = [];

  for (const f of FIXES) {
    const subId = subMap.get(subKey(f.categorySlug, f.subName));
    if (!subId) { missing++; errors.push(`Sub not found: ${f.categorySlug}|${f.subName}`); continue; }

    const { data: row } = await supabaseAdmin
      .from("resources")
      .select("id")
      .eq("state", "NC")
      .eq("title", f.title)
      .limit(1);
    if (!row || !row.length) { missing++; errors.push(`NC row not found: ${f.title}`); continue; }

    const { error } = await supabaseAdmin
      .from("resource_subcategories")
      .upsert({ resource_id: row[0].id, subcategory_id: subId }, { onConflict: "resource_id,subcategory_id" });
    if (error) { errors.push(`Upsert failed for ${f.title}: ${error.message}`); continue; }

    // Also update the resources.subcategory text column to the corrected name
    await supabaseAdmin.from("resources").update({ subcategory: f.subName }).eq("id", row[0].id);
    fixed++;
  }

  console.log(`fixed=${fixed}  missing=${missing}  errors=${errors.length}`);
  errors.forEach(e => console.log(`  - ${e}`));
}

main().catch(e => { console.error(e); process.exit(1); });
