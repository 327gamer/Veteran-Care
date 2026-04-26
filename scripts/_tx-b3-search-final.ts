const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0";
async function get(u: string) {
  try {
    const ctrl = new AbortController(); const t = setTimeout(()=>ctrl.abort(), 25000);
    const r = await fetch(u, { headers: { "User-Agent": UA, "Accept": "text/html,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.9" }, redirect: "follow", signal: ctrl.signal });
    clearTimeout(t);
    return { ok: r.ok, status: r.status, finalUrl: r.url, body: r.ok ? await r.text() : "" };
  } catch (e:any) { return { ok: false, status: 0, finalUrl: u, body: "" }; }
}

const QUERIES = [
  { county: "Lubbock",    q: "Lubbock County Texas Veterans Service Office site:lubbockcounty.gov" },
  { county: "Lubbock",    q: "site:co.lubbock.tx.us Veterans Service Office" },
  { county: "McLennan",   q: "McLennan County Texas Veterans Services site:mclennan.gov" },
  { county: "McLennan",   q: "McLennan County Texas Veteran Services site:co.mclennan.tx.us" },
  { county: "Williamson", q: "Williamson County Texas Veteran Services site:wilco.org" },
  { county: "Williamson", q: "Williamson County Texas Veteran Services site:wilcotx.gov" },
];

async function main() {
  for (const { county, q } of QUERIES) {
    console.log(`\n=== ${county}: "${q}" ===`);
    // DDG HTML
    const ddg = await get(`https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`);
    if (ddg.ok) {
      const links = Array.from(ddg.body.matchAll(/<a[^>]+class="result__a"[^>]+href="([^"]+)"/gi))
        .map(m => m[1])
        .map(u => { try { const p = new URL(u); const r = p.searchParams.get("uddg"); return r ? decodeURIComponent(r) : u; } catch { return u; } })
        .slice(0, 5);
      links.forEach(l => console.log(`  DDG: ${l}`));
    } else console.log(`  DDG fetch failed`);
    // Bing
    const bing = await get(`https://www.bing.com/search?q=${encodeURIComponent(q)}`);
    if (bing.ok) {
      const links = Array.from(bing.body.matchAll(/<h2><a [^>]*href="([^"]+)"/gi))
        .map(m => m[1])
        .filter(u => /^https?:/.test(u))
        .slice(0, 5);
      links.forEach(l => console.log(`  Bing: ${l}`));
    } else console.log(`  Bing fetch failed`);
  }
}
main();
