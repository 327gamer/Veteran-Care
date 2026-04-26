import { supabaseAdmin } from "../server/supabase";
async function main(){
  const { data: rows } = await supabaseAdmin.from("resources").select("title,city,category_id,subcategory").eq("state","CA").limit(2000);
  const all = rows||[];
  console.log(`CA total=${all.length}`);
  const byCity: Record<string,number> = {};
  const bySub: Record<string,number> = {};
  all.forEach((r:any)=>{
    if(r.city) byCity[r.city]=(byCity[r.city]||0)+1;
    if(r.subcategory) bySub[r.subcategory]=(bySub[r.subcategory]||0)+1;
  });
  console.log("Cities:", Object.entries(byCity).sort((a,b)=>b[1]-a[1]).map(([c,n])=>`${c}:${n}`).join(", "));
  const { data: cats } = await supabaseAdmin.from("categories").select("id,slug,name");
  const slugById = new Map((cats||[]).map((c:any)=>[c.id,c.slug]));
  const bySlug: Record<string,number> = {};
  all.forEach((r:any)=>{ const s = slugById.get(r.category_id); if(s) bySlug[s]=(bySlug[s]||0)+1; });
  console.log("By cat:", Object.entries(bySlug).sort((a,b)=>b[1]-a[1]).map(([c,n])=>`${c}:${n}`).join(", "));
}
main();
