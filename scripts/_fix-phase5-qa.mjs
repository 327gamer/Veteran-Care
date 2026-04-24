import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const sb = createClient(url, key);

const FIXES = [
  {
    oldTitle: "Liveable Buckhead — North Cobb Senior Transit",
    newTitle: "CobbLinc Senior Reservation Transit Marietta",
    desc: "CobbLinc Senior Reservation Service — door-to-door demand-response transportation for Cobb County residents 65+ and ADA-eligible riders. Reservation-based; medical, grocery, and senior-center trips. Veteran riders use same fare structure.",
  },
  {
    oldTitle: "Phoenix Center Behavioral Health Services — Lawrenceville",
    newTitle: "Phoenix Center Behavioral Health Services Tucker Crescent Campus",
  },
  {
    oldTitle: "Newnan-Coweta Habitat Food + Housing Pantry",
    newTitle: "Communities In Schools Newnan-Coweta Family Food Pantry",
    desc: "Communities In Schools of Newnan-Coweta operates a school-based family food pantry. Weekly grocery distribution and weekend backpack program for school-aged children, including kids of veteran families across Coweta County.",
  },
];

for (const f of FIXES) {
  const update = { title: f.newTitle };
  if (f.desc) update.short_description = f.desc;
  const { data, error } = await sb
    .from("resources")
    .update(update)
    .eq("title", f.oldTitle)
    .select("id, title");
  if (error) console.error("ERR", f.oldTitle, error.message);
  else console.log("OK", f.oldTitle, "→", f.newTitle, `(${data?.length || 0} row)`);
}
