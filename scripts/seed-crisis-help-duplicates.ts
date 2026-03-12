import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const CRISIS_RESOURCE_TITLES = [
  "Veterans Crisis Line",
  "Vet Center Call Center (After Hours)",
  "SC Mobile Crisis Line",
  "WJB Dorn VAMC – PTSD Clinical Team",
  "Charleston VA PTSD Clinical Team",
  "SC Department of Mental Health – Veterans Services",
  "Wm. Jennings Bryan Dorn VA Medical Center — Mental Health",
  "Ralph H. Johnson VA Medical Center — Mental Health",
];

async function main() {
  console.log("=== Crisis Help Category — Cross-Category Duplicates ===\n");

  const { data: crisisCat, error: catErr } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", "crisis-help")
    .single();

  if (catErr || !crisisCat) {
    throw new Error("crisis-help category not found. Run seed-va-sc-resources.ts first.");
  }

  const crisisHelpId = crisisCat.id;
  console.log("crisis-help category ID:", crisisHelpId);

  const { data: existing } = await supabase
    .from("resources")
    .select("title")
    .eq("category_id", crisisHelpId)
    .eq("status", "approved");

  const existingTitles = new Set((existing || []).map(r => r.title));
  const titlesToAdd = CRISIS_RESOURCE_TITLES.filter(t => !existingTitles.has(t));

  if (titlesToAdd.length === 0) {
    console.log("\nAll crisis-help duplicates already exist. Nothing to insert.");
    return;
  }

  console.log(`\n${titlesToAdd.length} resources to duplicate into crisis-help:`);
  titlesToAdd.forEach(t => console.log(`  - ${t}`));

  const { data: sources, error: srcErr } = await supabase
    .from("resources")
    .select(
      "title, short_description, website_url, phone, email, address, city, state, zip, " +
      "eligibility, source_name, source_type, status, sponsored, latitude, longitude, " +
      "geo_source, service_priority"
    )
    .eq("status", "approved")
    .in("title", titlesToAdd);

  if (srcErr) throw new Error(`Source query failed: ${srcErr.message}`);

  const seen = new Set<string>();
  const uniqueSources = [];
  for (const r of sources || []) {
    if (!seen.has(r.title)) {
      seen.add(r.title);
      uniqueSources.push(r);
    }
  }

  const newRecords = uniqueSources.map(r => ({
    ...r,
    category_id: crisisHelpId,
  }));

  const { data: inserted, error: insErr } = await supabase
    .from("resources")
    .insert(newRecords)
    .select("id, title, city, state");

  if (insErr) throw new Error(`Insert failed: ${insErr.message}`);

  console.log(`\nInserted ${inserted.length} new crisis-help records:`);
  for (const r of inserted) {
    console.log(`  ✓ ${r.title} (${r.city || "statewide"}) — ${r.id}`);
  }

  const { count } = await supabase
    .from("resources")
    .select("id", { count: "exact", head: true })
    .eq("category_id", crisisHelpId)
    .eq("status", "approved");

  console.log(`\nTotal resources now in crisis-help: ${count}`);
}

main().catch(console.error);
