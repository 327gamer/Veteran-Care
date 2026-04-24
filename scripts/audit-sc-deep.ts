/**
 * SC deep audit — pulls full SC row data for cleanup planning.
 * Usage: tsx scripts/audit-sc-deep.ts
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

(async () => {
  const { data: rows, error } = await sb
    .from("resources")
    .select(
      "id, title, city, address, latitude, longitude, website_url, phone, status, created_at, source_type, source_name",
    )
    .eq("state", "SC")
    .order("created_at", { ascending: true });
  if (error) {
    console.error(error);
    process.exit(1);
  }

  console.log(`TOTAL SC ROWS: ${rows!.length}\n`);

  console.log(`STATUS BREAKDOWN:`);
  const byStatus: Record<string, number> = {};
  rows!.forEach((r) => {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  });
  Object.entries(byStatus).forEach(([s, n]) => console.log(`  ${s}: ${n}`));

  console.log(`\nROWS WITH NO CITY (${rows!.filter((r) => !r.city).length} total):`);
  rows!.filter((r) => !r.city).forEach((r) => console.log(`  - ${r.title}`));

  console.log(`\nMISSING URL (${rows!.filter((r) => !r.website_url).length} total):`);
  rows!
    .filter((r) => !r.website_url)
    .forEach((r) =>
      console.log(`  - [${r.city || "STATEWIDE"}] ${r.title} (status=${r.status})`),
    );

  console.log(`\nMISSING PHONE (${rows!.filter((r) => !r.phone).length} total):`);
  rows!
    .filter((r) => !r.phone)
    .forEach((r) =>
      console.log(`  - [${r.city || "STATEWIDE"}] ${r.title} (status=${r.status})`),
    );

  console.log(`\nMISSING ADDRESS (city-anchored, ${rows!.filter((r) => r.city && !r.address).length} total):`);
  rows!
    .filter((r) => r.city && !r.address)
    .forEach((r) =>
      console.log(`  - [${r.city}] ${r.title} (status=${r.status})`),
    );

  console.log(`\nMISSING LAT/LNG (city-anchored, ${rows!.filter((r) => r.city && (!r.latitude || !r.longitude)).length} total):`);
  rows!
    .filter((r) => r.city && (!r.latitude || !r.longitude))
    .forEach((r) => console.log(`  - [${r.city}] ${r.title}`));

  // Title spelling variants — group by collapsing all dash/em-dash into one
  console.log(`\nTITLE-VARIANT GROUPS (different dash char or trailing whitespace, same root):`);
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[\u2013\u2014\u2212-]+/g, "-") // collapse all dashes to -
      .replace(/\s+/g, " ")
      .trim();
  const groups: Record<string, typeof rows> = {};
  rows!.forEach((r) => {
    const k = norm(r.title);
    (groups[k] ||= [] as any).push(r);
  });
  const dupGroups = Object.values(groups).filter((g) => g!.length > 1);
  console.log(`  ${dupGroups.length} groups with dash-variant collisions`);
  dupGroups.forEach((g) => {
    console.log(`  -- group ${norm(g![0].title)}`);
    g!.forEach((r) =>
      console.log(`     ${r.id} | ${r.title} | city=${r.city} | created=${r.created_at?.slice(0, 10)}`),
    );
  });
})();
