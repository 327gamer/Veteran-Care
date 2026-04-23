import { createClient } from "@supabase/supabase-js";
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, key, { auth: { persistSession: false } });

const { data: cats, error: ce } = await sb.from("categories").select("id,slug,name").order("name");
if (ce) { console.error("cats err", ce); process.exit(1); }

const STATES = ["SC", "NC"];
const FOCUS = new Set(["food","food-assistance","housing","housing-assistance","benefits","va-benefits","insurance","jobs","employment","healthcare","health-care","mental-health","mental-health-services"]);

const results = {};
for (const st of STATES) results[st] = {};

for (const cat of cats) {
  for (const st of STATES) {
    const { data, error, count } = await sb
      .from("resources")
      .select("id, resource_categories!inner(category_id)", { count: "exact", head: true })
      .eq("status", "approved")
      .eq("state", st)
      .eq("resource_categories.category_id", cat.id);
    if (error) { results[st][cat.slug] = "ERR"; continue; }
    results[st][cat.slug] = count ?? 0;
  }
}

const rows = cats.map(c => ({
  slug: c.slug,
  name: c.name,
  SC: results.SC[c.slug],
  NC: results.NC[c.slug],
  focus: FOCUS.has(c.slug) ? "*" : ""
}));
rows.sort((a,b) => (b.SC + b.NC) - (a.SC + a.NC));

console.log("\nFOCUS = founder's priority categories\n");
console.log("FOCUS  SLUG".padEnd(38) + "NAME".padEnd(34) + "SC".padStart(5) + "NC".padStart(5));
console.log("-".repeat(82));
for (const r of rows) {
  const flag = r.focus ? " *  " : "    ";
  const warn = (r.focus && (r.SC === 0 || r.NC === 0)) ? "  ← GAP" : "";
  console.log(flag + " " + r.slug.padEnd(32) + r.name.padEnd(34) + String(r.SC).padStart(5) + String(r.NC).padStart(5) + warn);
}

const scTotal = rows.reduce((s,r) => s + (typeof r.SC === "number" ? r.SC : 0), 0);
const ncTotal = rows.reduce((s,r) => s + (typeof r.NC === "number" ? r.NC : 0), 0);
console.log("-".repeat(82));
console.log("TOTAL category-tag rows (rows can be in multiple categories): SC=" + scTotal + " NC=" + ncTotal);

console.log("\nFOCUS GAPS (founder priorities with 0 rows in a state):");
const gaps = rows.filter(r => r.focus && (r.SC === 0 || r.NC === 0));
if (gaps.length === 0) console.log("  (none)");
for (const r of gaps) {
  console.log("  " + r.slug.padEnd(28) + " SC=" + r.SC + " NC=" + r.NC);
}
