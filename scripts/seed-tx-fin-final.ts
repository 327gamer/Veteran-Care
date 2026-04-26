/**
 * TX Benchmark Final — push financial 28 → ≥30 (need +2, queuing 4 to absorb near-dups).
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";
const COMMIT = process.argv.includes("--commit");
const ALLOW_BROKEN_URLS = process.argv.includes("--allow-broken-urls");

const ROWS: SeedRow[] = [
  { section: "FIN", title: "Marine Corps League — Texas Department", cat: "financial", sub: "Veteran Relief Funds", city: "San Antonio", website_url: "https://mcltexas.org/", source_name: "Marine Corps League Department of Texas", source_type: "nonprofit", phone: "210-621-7575", desc: "Marine Corps League Department of Texas — chartered veterans service org with 80+ Texas detachments. Detachment-administered emergency-financial-assistance grants for active-duty / veteran Marines and Navy Corpsmen and their families; Toys for Tots Texas distribution; Marine Corps Birthday Ball logistics; National Convention representation; coordinates with NMCRS Texas." },
  { section: "FIN", title: "Fleet Reserve Association — Texas Branches", cat: "financial", sub: "Veteran Relief Funds", city: "Corpus Christi", website_url: "https://www.fra.org/branches/Texas", source_name: "Fleet Reserve Association", source_type: "nonprofit", phone: "703-683-1400", desc: "Fleet Reserve Association — chartered veterans service org for enlisted Navy, Marine Corps, and Coast Guard. 20+ Texas branches (Corpus Christi, Kingsville, San Antonio, Dallas, Houston, San Diego adjacent). Branch-administered emergency-financial-assistance, scholarship program ($150K+/year), legislative advocacy, and reunion logistics; coordinates with NMCRS Texas." },
  { section: "FIN", title: "Catholic War Veterans of the USA — Texas Posts", cat: "financial", sub: "Veteran Relief Funds", city: "San Antonio", website_url: "https://cwv.org/", source_name: "Catholic War Veterans of the USA", source_type: "nonprofit", phone: "703-549-3622", desc: "Catholic War Veterans of the USA — chartered veterans service org with 12+ Texas posts (San Antonio, Houston, El Paso, Dallas, Corpus Christi, Killeen). Post-administered emergency-financial-assistance, Catholic chaplaincy support, scholarships, and Memorial Mass and burial-honor coordination at Texas national/state veterans cemeteries." },
  { section: "FIN", title: "Vietnam Veterans of America — Texas State Council", cat: "financial", sub: "Veteran Relief Funds", city: "Austin", website_url: "https://www.vva.org/state-council/texas/", source_name: "Vietnam Veterans of America", source_type: "nonprofit", phone: "301-585-4000", desc: "Vietnam Veterans of America Texas State Council — chartered veterans service org with 30+ Texas chapters. Chapter-administered emergency-financial-assistance, Agent Orange and toxic-exposure benefits-claims service via VVA-trained Service Officers, and Veterans Initiative for POW/MIA accounting. Coordinates with VA Houston, Dallas, San Antonio Regional Offices for claim filings." },
];

console.log(`[seed-tx-fin-final] ${ROWS.length} rows queued (${COMMIT ? "COMMIT" : "DRY-RUN"})`);
runSeed(ROWS, {
  state: "TX", commit: COMMIT, scriptName: "TX Benchmark Final — push financial to ≥30",
  batchTag: "tx-fin-final", allowBrokenUrls: ALLOW_BROKEN_URLS,
  sectionLabels: { FIN: "Financial" },
}).catch((e) => { console.error(e); process.exit(1); });
