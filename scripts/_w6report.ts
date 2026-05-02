import { supabaseAdmin } from "../server/supabase";
(async () => {
try {
let from=0; const all:any[]=[];
while(true){
  const r = await supabaseAdmin.from("resources").select("city,category_slug,subcategory_slug").eq("state","MA").range(from,from+999);
  if(r.error){console.error("ERR",r.error);process.exit(1);}
  const rows=(r.data||[]) as any[]; all.push(...rows);
  if(rows.length<1000)break; from+=1000;
}
console.log("MA TOTAL:", all.length);
const cats=new Map<string,number>(), subs=new Map<string,number>(), cities=new Set<string>();
for(const r of all){
  cats.set(r.category_slug,(cats.get(r.category_slug)||0)+1);
  subs.set(`${r.category_slug}::${r.subcategory_slug}`,(subs.get(`${r.category_slug}::${r.subcategory_slug}`)||0)+1);
  if(r.city) cities.add(r.city);
}
console.log("CITIES:", cities.size, "| CATS:", cats.size, "| SUBS:", subs.size);
console.log("\nCATS:");
for(const [c,n] of [...cats.entries()].sort((a,b)=>b[1]-a[1])) console.log(`  ${c.padEnd(22)} ${n}`);
} catch(e:any){console.error("CAUGHT",e?.message||e);process.exit(1);}
process.exit(0);
})();
