/**
 * DuckDuckGo HTML-search fallback for TX counties whose homepages didn't expose
 * a discoverable veteran-services link.
 */
const UA = "Mozilla/5.0 (compatible; veteran-care-rollout-probe/1.0)";

const MISS_COUNTIES = [
  { county: "Collin",    seat: "McKinney",      domain: "collincountytx.gov" },
  { county: "Denton",    seat: "Denton",        domain: "dentoncounty.gov" },
  { county: "Ector",     seat: "Odessa",        domain: "co.ector.tx.us" },
  { county: "El Paso",   seat: "El Paso",       domain: "epcounty.com" },
  { county: "Guadalupe", seat: "Seguin",        domain: "co.guadalupe.tx.us" },
  { county: "Hardin",    seat: "Kountze",       domain: "co.hardin.tx.us" },
  { county: "Harris",    seat: "Houston",       domain: "harriscountytx.gov" },
  { county: "Hays",      seat: "San Marcos",    domain: "hayscountytx.com" },
  { county: "Hood",      seat: "Granbury",      domain: "co.hood.tx.us" },
  { county: "Jefferson", seat: "Beaumont",      domain: "co.jefferson.tx.us" },
  { county: "Midland",   seat: "Midland",       domain: "co.midland.tx.us" },
  { county: "Orange",    seat: "Orange",        domain: "co.orange.tx.us" },
  { county: "Randall",   seat: "Canyon",        domain: "randallcounty.org" },
  { county: "Smith",     seat: "Tyler",         domain: "smith-county.com" },
  { county: "Taylor",    seat: "Abilene",       domain: "taylorcountytexas.org" },
  { county: "Tom Green", seat: "San Angelo",    domain: "co.tom-green.tx.us" },
  { county: "Victoria",  seat: "Victoria",      domain: "victoriacountytx.org" },
  { county: "Walker",    seat: "Huntsville",    domain: "co.walker.tx.us" },
  { county: "Wichita",   seat: "Wichita Falls", domain: "co.wichita.tx.us" },
  { county: "Wise",      seat: "Decatur",       domain: "co.wise.tx.us" },
];

const txAreaCodes = new Set(["210","214","254","281","325","346","361","409","430","432","469","512","682","713","726","737","806","817","830","832","903","915","936","940","945","956","972","979"]);

function extractPhone(html: string): string | undefined {
  const re = /\(?(\d{3})\)?[\s.\-]?(\d{3})[\s.\-]?(\d{4})/g;
  for (const m of html.matchAll(re)) if (txAreaCodes.has(m[1])) return `${m[1]}-${m[2]}-${m[3]}`;
  return undefined;
}

async function fetchText(url: string, timeoutMs = 12000) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html,*/*" }, redirect: "follow", signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return { ok: false, status: r.status, finalUrl: r.url };
    return { ok: true, status: r.status, body: await r.text(), finalUrl: r.url };
  } catch { return { ok: false, status: 0, finalUrl: url }; }
}

async function ddgSearch(query: string, restrictToDomain?: string): Promise<string[]> {
  const q = restrictToDomain ? `${query} site:${restrictToDomain}` : query;
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
  const r = await fetchText(url);
  if (!r.ok || !r.body) return [];
  // DDG result links are inside <a class="result__a" href="REDIRECT?uddg=ENCODED_URL">
  const out: string[] = [];
  const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"/gi;
  for (const m of r.body.matchAll(re)) {
    let href = m[1];
    // DDG may wrap in /l/?uddg=
    const uddgMatch = /uddg=([^&]+)/.exec(href);
    if (uddgMatch) {
      try { href = decodeURIComponent(uddgMatch[1]); } catch {}
    }
    if (/^https?:\/\//.test(href)) out.push(href);
    if (out.length >= 8) break;
  }
  return out;
}

async function main() {
  console.log("\n=== TX CVSO DDG fallback ===\n");
  const results: any[] = [];
  for (const { county, seat, domain } of MISS_COUNTIES) {
    const queries = [
      `"${county} County" Texas veterans service office`,
      `"${county} County" Texas veterans services`,
      `${county} County TX veterans`,
    ];
    let found: { url: string; phone?: string } | null = null;
    for (const q of queries) {
      const links = await ddgSearch(q, domain);
      for (const link of links) {
        // Verify it's same-domain and contains "veteran" in body
        try {
          const u = new URL(link);
          if (!u.hostname.endsWith(domain)) continue;
        } catch { continue; }
        const r = await fetchText(link);
        if (!r.ok || !r.body) continue;
        if (!/veteran/i.test(r.body)) continue;
        // Reject obvious non-CVSO pages: court / treatment / news
        if (/treatment court|veterans court|veterans treatment|newsflash|news\/detail/i.test(link)) continue;
        const phone = extractPhone(r.body);
        found = { url: r.finalUrl, phone };
        break;
      }
      if (found) break;
      // Also try non-restricted DDG (some county VSOs are on third-party hosts)
      if (!found) {
        const links2 = await ddgSearch(q);
        for (const link of links2) {
          if (!new RegExp(`\\b${county.replace(/\s+/g, ".?")}\\b`, "i").test(link)) continue;
          if (/treatment court|veterans court|veterans treatment|newsflash|news\/detail|wikipedia|facebook|linkedin|tacvso|tvc\.texas/i.test(link)) continue;
          const r = await fetchText(link);
          if (!r.ok || !r.body) continue;
          if (!/veteran/i.test(r.body)) continue;
          if (!new RegExp(`${county}`, "i").test(r.body)) continue;
          const phone = extractPhone(r.body);
          found = { url: r.finalUrl, phone };
          break;
        }
      }
      if (found) break;
    }
    if (found) {
      console.log(`OK   ${county.padEnd(13)} ${seat.padEnd(18)} ${found.url}  phone=${found.phone ?? "-"}`);
      results.push({ county, seat, ...found });
    } else {
      console.log(`MISS ${county.padEnd(13)} ${seat.padEnd(18)} — no DDG hit`);
      results.push({ county, seat });
    }
  }
  const hits = results.filter(r => r.url).length;
  console.log(`\n=== ${hits}/${results.length} additional CVSO URLs found via DDG ===`);
}
main();
