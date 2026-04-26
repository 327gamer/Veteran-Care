import { supabaseAdmin } from "../server/supabase";
async function main() {
  const patterns = [
    "DeBakey", "Audie", "Dallas Veterans", "Amarillo Veterans",
    "George H. O", "El Paso Veterans", "Kerrville Veterans", "Texas Valley Coastal Bend",
    "Charles Wilson", "Greenville", "Killeen Heights VA Clinic",
    "Frank M. Tejeda", "North Central Federal", "Polk Outpatient",
    "Victoria VA", "Stamford", "El Paso East Side", "Harlingen VA Outpatient",
    "South Texas Health Care for Homeless", "Childress",
    "Bonham VA Domiciliary", "Waco VA Domiciliary", "Big Spring VA Domiciliary", "Temple VA Domiciliary"
  ];
  for (const p of patterns) {
    const { data } = await supabaseAdmin.from("resources").select("title").eq("state", "TX").ilike("title", `%${p}%`);
    console.log(`\n${p}:`);
    (data || []).forEach((r: any) => console.log(`  - "${r.title}"`));
  }
}
main();
