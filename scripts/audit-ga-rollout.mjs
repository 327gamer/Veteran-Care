import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const STATE = "GA";

const { data: all } = await sb.from("resources").select("id, title, city, status").eq("state", STATE);
const approved = (all || []).filter(r => r.status === "approved");

console.log(`\n=== GA ROLLOUT AUDIT ===`);
console.log(`Total GA rows: ${all?.length || 0} (approved: ${approved.length})`);

const byCity = {};
approved.forEach(r => { const c = r.city || "(no city)"; byCity[c] = (byCity[c] || 0) + 1; });
console.log(`\nApproved rows by city (${Object.keys(byCity).length} cities):`);
Object.entries(byCity).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`  ${String(n).padStart(3)}  ${c}`));

const { data: cats } = await sb.from("categories").select("id, slug, name");
console.log(`\nApproved rows by category:`);
const focusCats = ["food-assistance", "housing", "va-benefits", "healthcare", "mental-health", "employment", "disabled-veterans", "crisis-help", "legal", "education", "transportation", "family-support", "community-support"];
const byCat = [];
for (const slug of focusCats) {
  const c = cats.find(x => x.slug === slug);
  if (!c) { byCat.push({ slug, name: "(missing)", count: "ERR" }); continue; }
  const { count } = await sb.from("resources").select("id, resource_categories!inner(category_id)", { count: "exact", head: true })
    .eq("status", "approved").eq("state", STATE).eq("resource_categories.category_id", c.id);
  byCat.push({ slug, name: c.name, count: count ?? 0 });
}
byCat.sort((a, b) => (b.count || 0) - (a.count || 0));
byCat.forEach(r => {
  const flag = (r.count === 0) ? "  ← GAP" : "";
  console.log(`  ${String(r.count).padStart(3)}  ${r.slug.padEnd(22)} ${r.name}${flag}`);
});

const priority = ["Atlanta", "Augusta", "Savannah", "Columbus", "Macon", "Athens", "Marietta", "Warner Robins", "Albany", "Gainesville", "Valdosta", "Roswell", "Sandy Springs", "Johns Creek"];
console.log(`\nPriority city coverage:`);
priority.forEach(c => {
  const n = byCity[c] || 0;
  const flag = n === 0 ? "  ← GAP" : "";
  console.log(`  ${String(n).padStart(3)}  ${c}${flag}`);
});
