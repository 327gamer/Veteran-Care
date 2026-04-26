const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

async function fetchText(url: string, timeoutMs = 20000) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html,*/*", "Accept-Language": "en-US,en;q=0.9" }, redirect: "follow", signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return { ok: false, status: r.status, finalUrl: r.url };
    return { ok: true, status: r.status, body: await r.text(), finalUrl: r.url };
  } catch (e: any) { return { ok: false, status: 0, finalUrl: url, err: String(e?.message ?? e) }; }
}

// Direct retry of Harris with a Chrome-like UA to defeat any UA-based filtering
async function harris() {
  for (const u of [
    "https://veteran.harriscountytx.gov/",
    "https://veteran.harriscountytx.gov/Pages/default.aspx",
    "https://www.harriscountytx.gov/Departments/Veterans",
    "https://veterans.harriscountytx.gov/",
  ]) {
    const r = await fetchText(u);
    console.log(`Harris try: ${u} → ${r.status}${r.ok ? `  body=${(r.body!.length/1024).toFixed(1)}KB  vetWord=${/veteran/i.test(r.body!)}` : ""}${(r as any).err ? ` ERR=${(r as any).err}` : ""}`);
    if (r.ok && r.body && /veteran/i.test(r.body)) {
      // peek at a chunk
      const idx = r.body.toLowerCase().indexOf("veteran");
      console.log(r.body.slice(Math.max(0, idx - 200), idx + 400).replace(/\s+/g, " "));
    }
  }
}

async function bingSearch(query: string): Promise<string[]> {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
  const r = await fetchText(url);
  if (!r.ok || !r.body) return [];
  const out: string[] = [];
  // bing result hrefs are wrapped in <a href="REAL_URL"> inside <h2>
  const re = /<h2><a[^>]+href="([^"]+)"[^>]*>/gi;
  for (const m of r.body.matchAll(re)) {
    if (/^https?:\/\//.test(m[1])) out.push(m[1]);
    if (out.length >= 8) break;
  }
  return out;
}

const txAreaCodes = new Set(["210","214","254","281","325","346","361","409","430","432","469","512","682","713","726","737","806","817","830","832","903","915","936","940","945","956","972","979"]);
function extractPhone(html: string): string | undefined {
  const re = /\(?(\d{3})\)?[\s.\-]?(\d{3})[\s.\-]?(\d{4})/g;
  for (const m of html.matchAll(re)) if (txAreaCodes.has(m[1])) return `${m[1]}-${m[2]}-${m[3]}`;
  return undefined;
}

const STILL_MISS = [
  { county: "Harris", seat: "Houston", domain: "harriscountytx.gov" },
  { county: "El Paso", seat: "El Paso", domain: "epcounty.com" },
  { county: "Smith", seat: "Tyler", domain: "smith-county.com" },
  { county: "Jefferson", seat: "Beaumont", domain: "co.jefferson.tx.us" },
  { county: "Midland", seat: "Midland", domain: "co.midland.tx.us" },
  { county: "Taylor", seat: "Abilene", domain: "taylorcountytexas.org" },
  { county: "Tom Green", seat: "San Angelo", domain: "co.tom-green.tx.us" },
  { county: "Victoria", seat: "Victoria", domain: "victoriacountytx.org" },
  { county: "Walker", seat: "Huntsville", domain: "co.walker.tx.us" },
  { county: "Wichita", seat: "Wichita Falls", domain: "co.wichita.tx.us" },
  { county: "Wise", seat: "Decatur", domain: "co.wise.tx.us" },
  { county: "Guadalupe", seat: "Seguin", domain: "co.guadalupe.tx.us" },
  { county: "Hood", seat: "Granbury", domain: "co.hood.tx.us" },
  { county: "Orange", seat: "Orange", domain: "co.orange.tx.us" },
  { county: "Randall", seat: "Canyon", domain: "randallcounty.org" },
  { county: "Brazoria", seat: "Angleton", domain: "brazoriacountytx.gov" },
  { county: "Nueces", seat: "Corpus Christi", domain: "nuecesco.com" },
  { county: "Potter", seat: "Amarillo", domain: "co.potter.tx.us" },
  { county: "Rockwall", seat: "Rockwall", domain: "rockwallcountytexas.com" },
];

async function main() {
  await harris();
  console.log("\n=== Bing fallback for STILL_MISS ===\n");
  let hits = 0;
  for (const { county, seat, domain } of STILL_MISS) {
    const queries = [
      `"${county} County" Texas "veterans service office"`,
      `"${county} County" Texas "veterans services office"`,
      `${county} County Texas veterans service officer`,
    ];
    let found: { url: string; phone?: string } | null = null;
    for (const q of queries) {
      const links = await bingSearch(q);
      for (const link of links) {
        try {
          const u = new URL(link);
          if (!u.hostname.endsWith(domain)) continue;
        } catch { continue; }
        if (/treatment court|veterans court|newsflash|news\/detail|search\?|\.pdf$|tacvso|tvc\.texas/i.test(link)) continue;
        const r = await fetchText(link);
        if (!r.ok || !r.body) continue;
        if (!/veteran/i.test(r.body)) continue;
        const phone = extractPhone(r.body);
        found = { url: r.finalUrl, phone };
        break;
      }
      if (found) break;
    }
    if (found) {
      console.log(`OK   ${county.padEnd(13)} ${seat.padEnd(18)} ${found.url}  phone=${found.phone ?? "-"}`);
      hits++;
    } else {
      console.log(`MISS ${county.padEnd(13)} ${seat.padEnd(18)}`);
    }
    await new Promise(r => setTimeout(r, 800));   // rate-limit Bing
  }
  console.log(`\n=== ${hits}/${STILL_MISS.length} new via Bing ===`);
}
main();
