/**
 * Hotfix verification — re-fetch every URL shipped in B3 with GET, extract the
 * actual page <title>, and check whether the body content is genuinely about
 * Veterans Services vs (Road & Bridges / Employment / Elections / etc).
 *
 * CivicPlus county sites accept any /<numericID>/<slug> URL and ignore the slug
 * — they serve whatever page is at the numeric ID. So a 200 status doesn't
 * prove the slug-claimed content is what's served.
 */

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

type Row = { county: string; url: string };
const ROWS: Row[] = [
  { county: "Bell",       url: "https://www.bellcountytx.com/departments/veteran_services/index.php" },
  { county: "Bexar",      url: "https://www.bexar.org/989/Military-Veterans-Services" },
  { county: "Bowie",      url: "https://www.co.bowie.tx.us/page/bowie.Veterans" },
  { county: "Brazos",     url: "https://www.brazoscountytx.gov/206/Veterans-Services" },
  { county: "Cameron",    url: "https://www.cameroncountytx.gov/veterans-department/" },
  { county: "Collin",     url: "https://www.collincountytx.gov/Services/Veteran-Services/benefits" },
  { county: "Comal",      url: "https://www.co.comal.tx.us/VSO.htm" },
  { county: "Dallas",     url: "https://www.dallascounty.org/departments/veteran-services/" },
  { county: "Denton",     url: "https://www.dentoncounty.gov/859/Veterans-Service" },
  { county: "Ector",      url: "https://www.co.ector.tx.us/page/ector.Veterans" },
  { county: "Ellis",      url: "https://www.co.ellis.tx.us/164/Veteran-Services" },
  { county: "Fort Bend",  url: "https://www.fortbendcountytx.gov/government/departments/commissioners-court/county-judge/veteran-service-office" },
  { county: "Galveston",  url: "https://www.galvestoncountytx.gov/vs" },
  { county: "Grayson",    url: "https://www.co.grayson.tx.us/page/va.home" },
  { county: "Gregg",      url: "https://greggcounty.texas.gov/services/veterans-services" },
  { county: "Hardin",     url: "https://www.co.hardin.tx.us/page/hardin.Veterans" },
  { county: "Hays",       url: "https://www.hayscountytx.gov/veterans-services" },
  { county: "Henderson",  url: "https://www.henderson-county.com/departments/veterans-services" },
  { county: "Hidalgo",    url: "https://www.hidalgocounty.us/2057/Veterans-Service-Office" },
  { county: "Hunt",       url: "https://www.huntcounty.net/page/hunt.veteransservices" },
  { county: "Johnson",    url: "https://www.johnsoncountytx.org/departments/veteran-s-services" },
  { county: "Kaufman",    url: "https://www.kaufmancounty.net/290/Veterans-Services" },
  { county: "Liberty",    url: "https://www.co.liberty.tx.us/page/liberty.Veterans" },
  { county: "Lubbock",    url: "https://www.lubbockcounty.gov/department/?fDD=23-0" },
  { county: "McLennan",   url: "https://www.co.mclennan.tx.us/261/Veteran-Services" },
  { county: "Montgomery", url: "https://www.mctx.org/departments/departments_q_-_z/veterans_services/index.php" },
  { county: "Parker",     url: "https://www.parkercountytx.com/195/Veterans-Service-Office" },
  { county: "Tarrant",    url: "https://www.tarrantcountytx.gov/en/veteran-services.html" },
  { county: "Travis",     url: "https://www.traviscountytx.gov/health-human-services/cwa-veterans-services" },
  { county: "Webb",       url: "https://www.webbcountytx.gov/WCRVTP/" },
  { county: "Williamson", url: "https://www.wilco.org/Departments/Veterans-Services" },
];

async function getText(url: string, timeoutMs = 20000) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html" }, redirect: "follow", signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return { ok: false, status: r.status, finalUrl: r.url };
    return { ok: true, status: r.status, finalUrl: r.url, body: await r.text() };
  } catch (e: any) { return { ok: false, status: 0, finalUrl: url, err: String(e?.message ?? e) }; }
}

function getTitle(html: string): string {
  const m = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return m ? m[1].trim().replace(/\s+/g, " ") : "(no <title>)";
}

function isVeteranContent(title: string, body: string): boolean {
  const t = title.toLowerCase();
  const b = body.toLowerCase().slice(0, 50000);
  // Heuristic: title or H1 has "veteran" AND body mentions VA / DD-214 / disability claim / VSO / service officer
  const titleHasVet = /veteran|vso/i.test(t);
  // Reject if title is clearly a different department
  const wrongDept = /(road|bridge|employment|elections|juvenile|tax|sheriff|jail|library|treasurer|election)/i.test(t)
    && !titleHasVet;
  if (wrongDept) return false;
  if (titleHasVet) return true;
  // Title might be generic site name; check body density
  const vetWords = (b.match(/veteran/g) || []).length;
  const vsoSignals = /va\s+disability|dd[-\s]?214|claims?\s+(filing|assistance)|service\s+officer|vso\b/i.test(b);
  return vetWords >= 5 && vsoSignals;
}

async function main() {
  console.log("\n=== B3 hotfix content verification ===\n");
  const results = await Promise.all(ROWS.map(async ({ county, url }) => {
    const r = await getText(url);
    if (!r.ok) return { county, url, status: r.status, title: "", veteran: false, finalUrl: r.finalUrl, err: (r as any).err };
    const title = getTitle(r.body!);
    const veteran = isVeteranContent(title, r.body!);
    return { county, url, status: r.status, finalUrl: r.finalUrl, title, veteran, bodyLen: r.body!.length };
  }));
  // Sort: bad first
  results.sort((a, b) => Number(a.veteran) - Number(b.veteran) || a.county.localeCompare(b.county));
  for (const r of results) {
    const tag = r.veteran ? "OK  " : "BAD ";
    const finalRedirect = r.finalUrl !== r.url ? `  →${r.finalUrl}` : "";
    console.log(`${tag} ${r.county.padEnd(13)} status=${r.status}  title="${r.title.slice(0, 80)}"${finalRedirect}`);
  }
  const bad = results.filter(r => !r.veteran);
  console.log(`\n=== ${results.length - bad.length} OK / ${bad.length} BAD ===`);
  if (bad.length) {
    console.log("\nBAD COUNTIES NEEDING REPLACEMENT URL:");
    for (const r of bad) console.log(`  - ${r.county}: was ${r.url} → served "${r.title}"`);
  }
}
main();
