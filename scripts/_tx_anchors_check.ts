import { supabaseAdmin } from "../server/supabase";
async function main() {
  const probes = [
    "VFW","American Legion","AMVETS","Marine Corps League","Vietnam Veterans","Travis Manion","Team Rubicon",
    "Team RWB","Mission Continues","Folds of Honor","Combined Arms","Feeding Texas","Disability Rights",
    "TexasLawHelp","TexVet","Military Veteran Peer Network","MVPN","Texas State Cemetery","Texas Veterans Land Board",
    "Veterans Land Board","Suicide Prevention Council","Veterans Treatment Court","Texas Hospital Association",
    "Hopeline","Texas Homeless Network","Habitat for Humanity Texas","Texas Comptroller","TLTV","Lawyers for Texas Veterans",
    "MOAA","IAVA","Texas Department of Public Safety","Texas DMV","Texas Veterans Portal","ACE Veterans","TVFA",
    "Texas Veterans + Family Alliance","Pro Bono Veterans","Texas Access to Justice","Texas State Bar","TYLA"
  ];
  for (const p of probes) {
    const { data } = await supabaseAdmin.from("resources").select("name").eq("state","TX").ilike("name", `%${p}%`).limit(3);
    if (data && data.length) {
      console.log(`HIT ${p}:`, data.map((r:any)=>r.name).join(" | "));
    }
  }
}
main().catch(e=>{console.error(e);process.exit(1);});
