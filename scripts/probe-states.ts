import { supabaseAdmin } from "../server/supabase";
(async () => {
  const { data, error } = await supabaseAdmin.from("states").select("*").order("code");
  if (error) { console.error("states query error:", error); process.exit(1); }
  console.log(`=== states table — ${(data || []).length} rows ===`);
  if (data && data[0]) console.log("Columns:", Object.keys(data[0]).join(", "));
  for (const s of data || []) {
    const r: any = s;
    console.log(`  ${r.code}  ${r.name || r.slug || ""}  ${r.is_active === false ? "(inactive)" : ""}`);
  }
  // Specifically check for VA / Virginia variants
  const { data: vaCheck } = await supabaseAdmin.from("states").select("*").or("code.eq.VA,name.ilike.%virginia%,slug.eq.virginia");
  console.log(`\n=== VA-named row check: ${(vaCheck || []).length} match(es) ===`);
  console.log(JSON.stringify(vaCheck, null, 2));
})().then(() => process.exit(0));
