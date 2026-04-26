/**
 * Deep CVSO probe — for each county:
 *  1. Try a list of homepage candidates
 *  2. Harvest all internal links matching /veteran/i
 *  3. Probe each harvested link (in domain) and return the first 200-OK page that
 *     contains the word "veteran" in the body
 *  4. Extract phone + ZIP from that page
 *
 * Goal: independently discover the canonical CVSO page URL for each TX county
 * without guessing slug patterns.
 */

const UA = "Mozilla/5.0 (compatible; veteran-care-rollout-probe/1.0)";

const COUNTIES: Array<{ county: string; seat: string; homepages: string[] }> = [
  // The 39 counties that MISS'd in the first probe (priority order)
  { county: "Harris",    seat: "Houston",        homepages: ["https://www.harriscountytx.gov/", "https://veteran.harriscountytx.gov/"] },
  { county: "Dallas",    seat: "Dallas",         homepages: ["https://www.dallascounty.org/"] },
  { county: "Tarrant",   seat: "Fort Worth",     homepages: ["https://www.tarrantcountytx.gov/", "https://www.tarrantcounty.com/"] },
  { county: "El Paso",   seat: "El Paso",        homepages: ["https://www.epcounty.com/"] },
  { county: "Collin",    seat: "McKinney",       homepages: ["https://www.collincountytx.gov/"] },
  { county: "Denton",    seat: "Denton",         homepages: ["https://www.dentoncounty.gov/"] },
  { county: "Fort Bend", seat: "Richmond",       homepages: ["https://www.fortbendcountytx.gov/"] },
  { county: "Montgomery",seat: "Conroe",         homepages: ["https://www.mctx.org/"] },
  { county: "Bell",      seat: "Belton",         homepages: ["https://www.bellcountytx.com/"] },
  { county: "Nueces",    seat: "Corpus Christi", homepages: ["https://www.nuecesco.com/"] },
  { county: "Cameron",   seat: "Brownsville",    homepages: ["https://www.cameroncountytx.gov/", "https://www.cameroncounty.us/"] },
  { county: "Brazoria",  seat: "Angleton",       homepages: ["https://www.brazoriacountytx.gov/"] },
  { county: "Smith",     seat: "Tyler",          homepages: ["https://www.smith-county.com/"] },
  { county: "Hays",      seat: "San Marcos",     homepages: ["https://hayscountytx.com/", "https://www.hayscountytx.com/"] },
  { county: "Webb",      seat: "Laredo",         homepages: ["https://www.webbcountytx.gov/"] },
  { county: "Johnson",   seat: "Cleburne",       homepages: ["https://www.johnsoncountytx.org/"] },
  { county: "Guadalupe", seat: "Seguin",         homepages: ["https://www.guadalupe.tx.us/", "https://www.co.guadalupe.tx.us/"] },
  { county: "Kaufman",   seat: "Kaufman",        homepages: ["https://www.kaufmancounty.net/"] },
  { county: "Rockwall",  seat: "Rockwall",       homepages: ["https://www.rockwallcountytexas.com/"] },
  { county: "Midland",   seat: "Midland",        homepages: ["https://www.co.midland.tx.us/"] },
  { county: "Ector",     seat: "Odessa",         homepages: ["https://www.co.ector.tx.us/"] },
  { county: "Jefferson", seat: "Beaumont",       homepages: ["https://co.jefferson.tx.us/"] },
  { county: "Taylor",    seat: "Abilene",        homepages: ["https://www.taylorcountytexas.org/"] },
  { county: "Tom Green", seat: "San Angelo",     homepages: ["https://www.co.tom-green.tx.us/"] },
  { county: "Potter",    seat: "Amarillo",       homepages: ["https://www.co.potter.tx.us/"] },
  { county: "Randall",   seat: "Canyon",         homepages: ["https://www.randallcounty.org/"] },
  { county: "Wichita",   seat: "Wichita Falls",  homepages: ["https://www.co.wichita.tx.us/"] },
  { county: "Grayson",   seat: "Sherman",        homepages: ["https://www.co.grayson.tx.us/"] },
  { county: "Hunt",      seat: "Greenville",     homepages: ["https://www.huntcounty.net/"] },
  { county: "Henderson", seat: "Athens",         homepages: ["https://www.henderson-county.com/"] },
  { county: "Gregg",     seat: "Longview",       homepages: ["https://www.co.gregg.tx.us/"] },
  { county: "Bowie",     seat: "New Boston",     homepages: ["https://www.co.bowie.tx.us/"] },
  { county: "Walker",    seat: "Huntsville",     homepages: ["https://www.co.walker.tx.us/"] },
  { county: "Liberty",   seat: "Liberty",        homepages: ["https://www.co.liberty.tx.us/"] },
  { county: "Hardin",    seat: "Kountze",        homepages: ["https://co.hardin.tx.us/"] },
  { county: "Orange",    seat: "Orange",         homepages: ["https://co.orange.tx.us/"] },
  { county: "Hood",      seat: "Granbury",       homepages: ["https://www.co.hood.tx.us/"] },
  { county: "Wise",      seat: "Decatur",        homepages: ["https://www.co.wise.tx.us/"] },
  { county: "Victoria",  seat: "Victoria",       homepages: ["https://www.victoriacountytx.org/"] },
];

const txAreaCodes = ["210","214","254","281","325","346","361","409","430","432","469","512","682","713","726","737","806","817","830","832","903","915","936","940","945","956","972","979"];

function extractPhone(html: string): string | undefined {
  const re = /\(?(\d{3})\)?[\s.\-]?(\d{3})[\s.\-]?(\d{4})/g;
  for (const m of html.matchAll(re)) {
    if (txAreaCodes.includes(m[1])) return `${m[1]}-${m[2]}-${m[3]}`;
  }
  return undefined;
}

function extractZip(html: string, seat: string): string | undefined {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const re = new RegExp(`${seat.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}[\\s,]+TX[\\s,]+(\\d{5})`, "i");
  const m = re.exec(text);
  return m ? m[1] : undefined;
}

async function probe(url: string, timeoutMs = 12000) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(url, {
      headers: { "User-Agent": UA, "Accept": "text/html,*/*" },
      redirect: "follow", signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!r.ok) return { ok: false, status: r.status, finalUrl: r.url };
    const body = await r.text();
    return { ok: true, status: r.status, finalUrl: r.url, body };
  } catch { return { ok: false, status: 0, finalUrl: url }; }
}

function harvestVeteranLinks(homepageBody: string, baseUrl: string): string[] {
  const out = new Set<string>();
  const linkRe = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const m of homepageBody.matchAll(linkRe)) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, " ").trim();
    const combined = (href + " " + text).toLowerCase();
    if (!/veteran|vso/i.test(combined)) continue;
    let abs: string;
    try {
      abs = new URL(href, baseUrl).toString();
    } catch { continue; }
    // same-host or close-relative only
    try {
      const u = new URL(abs);
      const b = new URL(baseUrl);
      // accept same root domain only
      const rootA = u.hostname.split(".").slice(-2).join(".");
      const rootB = b.hostname.split(".").slice(-2).join(".");
      if (rootA !== rootB) continue;
    } catch { continue; }
    out.add(abs);
  }
  return Array.from(out).slice(0, 12);
}

async function main() {
  type Result = { county: string; seat: string; url?: string; phone?: string; zip?: string; bodyExcerpt?: string };
  const results: Result[] = [];
  await Promise.all(
    COUNTIES.map(async ({ county, seat, homepages }) => {
      let foundHome: { body: string; finalUrl: string } | null = null;
      for (const h of homepages) {
        const r = await probe(h);
        if (r.ok) { foundHome = { body: r.body!, finalUrl: r.finalUrl }; break; }
      }
      if (!foundHome) { results.push({ county, seat }); return; }
      const links = harvestVeteranLinks(foundHome.body, foundHome.finalUrl);
      for (const link of links) {
        const r = await probe(link);
        if (!r.ok || !r.body) continue;
        // require body contains "veteran" word, to avoid stub or 404 page that returned 200
        if (!/veteran/i.test(r.body)) continue;
        const phone = extractPhone(r.body);
        const zip = extractZip(r.body, seat);
        results.push({ county, seat, url: r.finalUrl, phone, zip });
        return;
      }
      results.push({ county, seat });
    })
  );
  results.sort((a, b) => a.county.localeCompare(b.county));
  console.log("\n=== TX CVSO deep probe ===\n");
  for (const r of results) {
    if (!r.url) {
      console.log(`MISS ${r.county.padEnd(13)} ${r.seat.padEnd(18)} — no veteran link discovered on homepage`);
    } else {
      console.log(`OK   ${r.county.padEnd(13)} ${r.seat.padEnd(18)} ${r.url}  phone=${r.phone ?? "-"}  zip=${r.zip ?? "-"}`);
    }
  }
  const hits = results.filter(r => r.url).length;
  console.log(`\n=== ${hits}/${results.length} CVSO URLs independently discovered ===`);
}

main();
