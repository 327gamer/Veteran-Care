/**
 * Founder Report Generator — produces the markdown report block for any state.
 *
 * Usage:
 *   tsx scripts/founder-report.ts --state=GA
 *   tsx scripts/founder-report.ts --state=FL --baseline=190
 *   tsx scripts/founder-report.ts --state=GA --priority="Augusta,Savannah,Macon,Columbus"
 *
 * Always run this AFTER:
 *   1. The seed script committed cleanly
 *   2. qa-state.ts reported PASS
 *   3. Workflow restarted so the live API matches the DB
 */
import { supabaseAdmin } from "../server/supabase";

const arg = (k: string) =>
  process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=").slice(1).join("=") ?? "";

const STATE = arg("state").toUpperCase();
const BASELINE = parseInt(arg("baseline") || "0", 10);
const PRIORITY = arg("priority")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (!/^[A-Z]{2}$/.test(STATE)) {
  console.error('Usage: tsx scripts/founder-report.ts --state=XX [--baseline=N] [--priority="City,City,..."]');
  process.exit(1);
}

async function main() {
  const [{ data: rows }, { data: cats }] = await Promise.all([
    supabaseAdmin
      .from("resources")
      .select("title,city,category_id")
      .eq("state", STATE)
      .eq("status", "approved")
      .limit(5000),
    supabaseAdmin.from("categories").select("id,name"),
  ]);
  const nameById = new Map((cats || []).map((c: any) => [c.id, c.name]));

  const cityCounts: Record<string, number> = {};
  (rows || []).forEach((r: any) => {
    const c = r.city || "(statewide)";
    cityCounts[c] = (cityCounts[c] || 0) + 1;
  });

  const catCounts: Record<string, number> = {};
  (rows || []).forEach((r: any) => {
    const n = nameById.get(r.category_id) || "?";
    catCounts[n] = (catCounts[n] || 0) + 1;
  });

  const total = rows?.length || 0;
  const delta = BASELINE > 0 ? total - BASELINE : null;

  // --------------------------------------------------------------- output
  const out: string[] = [];
  out.push(`# ${STATE} — Founder Report`);
  out.push("");

  out.push(`## 1. Rows`);
  if (delta != null) {
    out.push(`- ${BASELINE} → **${total}** rows  (${delta >= 0 ? "+" : ""}${delta})`);
  } else {
    out.push(`- New ${STATE} total: **${total}** rows`);
  }
  out.push("");

  out.push(`## 2. Categories  (${Object.keys(catCounts).length}/${(cats || []).length} active)`);
  out.push("");
  out.push("| Category | Rows |");
  out.push("|---|---|");
  Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([c, n]) => out.push(`| ${c} | ${n} |`));
  out.push("");

  out.push(`## 3. Cities  (${Object.keys(cityCounts).filter((c) => c !== "(statewide)").length} total)`);
  out.push("");
  out.push("| City | Rows |");
  out.push("|---|---|");
  Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([c, n]) => out.push(`| ${c} | ${n} |`));
  out.push("");

  out.push(`## 4. Top 12 metros`);
  Object.entries(cityCounts)
    .filter(([c]) => c !== "(statewide)")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .forEach(([c, n], i) => out.push(`${i + 1}. **${c}** — ${n}`));
  out.push("");

  if (PRIORITY.length) {
    out.push(`## 5. Priority cities`);
    out.push("");
    out.push("| City | Rows |");
    out.push("|---|---|");
    PRIORITY.forEach((c) => out.push(`| ${c} | ${cityCounts[c] || 0} |`));
    out.push("");
  }

  const weakCats = Object.entries(catCounts).filter(([, n]) => n < 8);
  const dormant = (cats || []).map((c: any) => c.name).filter((n: string) => !catCounts[n]);
  out.push(`## ${PRIORITY.length ? "6" : "5"}. Weak spots`);
  if (weakCats.length) {
    out.push(`- Categories under 8 rows:`);
    weakCats.sort((a, b) => a[1] - b[1]).forEach(([c, n]) => out.push(`  - ${c}: ${n}`));
  }
  if (dormant.length) {
    out.push(`- Dormant categories (0 rows): ${dormant.join(", ")}`);
  }
  if (!weakCats.length && !dormant.length) {
    out.push(`- None.`);
  }

  console.log(out.join("\n"));
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
