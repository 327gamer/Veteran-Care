import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "fs";

const sb = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: dbSubs } = await sb.from("subcategories").select("slug");
const dbSlugSet = new Set((dbSubs || []).map(s => s.slug));
console.log("Total DB subs:", dbSlugSet.size);

const files = readdirSync("client/src/lib").filter(n => n.endsWith("-subcategories.ts"));
const allCanonical = [];
for (const fname of files) {
  const f = `client/src/lib/${fname}`;
  const content = readFileSync(f, "utf8");
  const matches = [...content.matchAll(/slug:\s*"([a-z0-9-]+)"/g)];
  for (const m of matches) allCanonical.push({ file: f.split("/").pop(), slug: m[1] });
}

console.log("\n=== Canonical chip subs NOT in DB (broken — clicking chip returns 0) ===");
const broken = allCanonical.filter(x => !dbSlugSet.has(x.slug));
for (const b of broken) console.log(" -", b.file, "→", b.slug);
console.log("\nTotal broken:", broken.length, "of", allCanonical.length);

console.log("\n=== DB subs that LOOK like a chip sub (potential rename target) ===");
for (const b of broken) {
  const candidates = [...dbSlugSet].filter(s => s.includes(b.slug) || b.slug.includes(s.replace(/-/g," ").split(" ")[0]));
  if (candidates.length) console.log(" -", b.slug, "→ candidates:", candidates);
}
