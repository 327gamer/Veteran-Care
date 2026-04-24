import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: cats } = await sb.from("categories").select("id, slug, name").order("slug");
const { data: rows } = await sb.from("resources")
  .select("id, category_id")
  .eq("state", "SC").eq("status", "approved")
  .range(0, 9999);

const counts = {};
for (const r of rows) counts[r.category_id] = (counts[r.category_id] || 0) + 1;

console.log(`SC approved total: ${rows.length}\n`);
console.log("=== CATEGORIES (by direct category_id) ===");
const arr = cats.map(c => ({ slug: c.slug, name: c.name, n: counts[c.id] || 0 }));
arr.sort((a, b) => b.n - a.n);
arr.forEach(c => console.log(`${String(c.n).padStart(4)}  ${c.slug.padEnd(24)} (${c.name})`));
