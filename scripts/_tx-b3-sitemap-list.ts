const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0";
async function getText(u: string) {
  try {
    const ctrl = new AbortController(); const t = setTimeout(()=>ctrl.abort(), 20000);
    const r = await fetch(u, { headers: { "User-Agent": UA }, redirect: "follow", signal: ctrl.signal });
    clearTimeout(t); if (!r.ok) return null; return await r.text();
  } catch { return null; }
}

const TARGETS = [
  { county: "Bexar",      sitemaps: ["https://www.bexar.org/sitemap.xml"] },
  { county: "Hidalgo",    sitemaps: ["https://www.hidalgocounty.us/sitemap.xml"] },
  { county: "Lubbock",    sitemaps: ["https://www.lubbockcounty.gov/sitemap.xml", "https://www.lubbockcounty.gov/wp-sitemap.xml"] },
  { county: "McLennan",   sitemaps: ["https://www.mclennan.gov/sitemap.xml", "https://www.co.mclennan.tx.us/sitemap.xml"] },
  { county: "Williamson", sitemaps: ["https://www.wilcotx.gov/sitemap.xml", "https://www.wilco.org/sitemap.xml"] },
];

async function main() {
  for (const { county, sitemaps } of TARGETS) {
    console.log(`\n=== ${county} ===`);
    let foundAny = false;
    for (const sm of sitemaps) {
      const body = await getText(sm);
      if (!body) { console.log(`  ${sm} → fetch fail`); continue; }
      const urls = Array.from(body.matchAll(/<loc>([^<]+)<\/loc>/gi)).map(m => m[1]);
      const vetUrls = urls.filter(u => /veteran|vso/i.test(u));
      if (vetUrls.length) {
        console.log(`  ${sm} → ${urls.length} URLs, ${vetUrls.length} veteran-keyword:`);
        vetUrls.slice(0, 30).forEach(u => console.log(`    ${u}`));
        foundAny = true;
      } else {
        // sub-sitemap?
        const subSitemaps = urls.filter(u => /sitemap.*\.xml$/i.test(u)).slice(0, 5);
        for (const sub of subSitemaps) {
          const sb = await getText(sub);
          if (!sb) continue;
          const subUrls = Array.from(sb.matchAll(/<loc>([^<]+)<\/loc>/gi)).map(m => m[1]);
          const subVet = subUrls.filter(u => /veteran|vso/i.test(u));
          if (subVet.length) {
            console.log(`  ${sub} → ${subUrls.length} URLs, ${subVet.length} veteran-keyword:`);
            subVet.slice(0, 30).forEach(u => console.log(`    ${u}`));
            foundAny = true;
          }
        }
        if (!foundAny) console.log(`  ${sm} → ${urls.length} URLs, 0 veteran-keyword (top: ${urls.slice(0,3).join(", ")})`);
      }
    }
  }
}
main();
