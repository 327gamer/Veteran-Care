import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const fixes = [
  { match: "VA Insurance (SGLI/VGLI/Servicemembers' & Veterans' Group Life)",
    set: { address: "Administered nationally by VA Insurance Center (Philadelphia, PA); 24/7 inquiries via 800-419-1473; SGLI/VGLI conversion within 1 year of separation." } },
  { match: "Humana Military — TRICARE East (Ohio)",
    set: { city: "Cincinnati", zip: "45236", address: "TRICARE East Region contractor headquartered in Louisville, KY; serves Ohio TRICARE beneficiaries network-wide via Humana Military provider network." } },
  { match: "AmeriHealth Caritas Ohio (Medicaid)",
    set: { city: "Seven Hills", address: "5800 Lombardo Center, Seven Hills, OH 44131", zip: "44131" } },
  { match: "Veterans Florists Foundation Ohio (American Corporate Partners Mentoring)",
    set: { title: "American Corporate Partners (ACP) — Ohio Mentees" } },
];
(async () => {
  for (const f of fixes) {
    const { data, error } = await sb.from("resources").update(f.set).ilike("title", f.match).select("id, title");
    console.log(error ? `ERR ${f.match}: ${error.message}` : `OK ${data?.length||0} row → ${data?.[0]?.title || ""}`);
  }
})();
