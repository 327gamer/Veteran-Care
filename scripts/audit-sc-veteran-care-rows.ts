/**
 * Investigate the "Veteran Care —" rows in SC.
 * These look suspicious (use the brand name) — confirm whether they're
 * real partner content or internal promo cards we should archive.
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

(async () => {
  const { data, error } = await sb
    .from("resources")
    .select("*")
    .eq("state", "SC")
    .ilike("title", "Veteran Care%")
    .order("created_at", { ascending: true });
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`Found ${data!.length} "Veteran Care —" rows in SC:\n`);
  data!.forEach((r) => {
    console.log("─".repeat(60));
    console.log(`id: ${r.id}`);
    console.log(`title: ${r.title}`);
    console.log(`city: ${r.city} | address: ${r.address}`);
    console.log(`url: ${r.website_url}`);
    console.log(`phone: ${r.phone}`);
    console.log(`source_name: ${r.source_name}`);
    console.log(`source_type: ${r.source_type}`);
    console.log(`created: ${r.created_at}`);
    console.log(`description: ${(r.description || "").slice(0, 200)}`);
  });
})();
