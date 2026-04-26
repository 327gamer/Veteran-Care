const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

async function getText(url: string, timeoutMs = 20000) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "*/*" }, redirect: "follow", signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return { ok: false, status: r.status, finalUrl: r.url };
    return { ok: true, status: r.status, finalUrl: r.url, body: await r.text() };
  } catch (e: any) { return { ok: false, status: 0, finalUrl: url, err: String(e?.message ?? e) }; }
}
function getTitle(html: string): string {
  const m = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return m ? m[1].trim().replace(/&amp;/g, "&").replace(/\s+/g, " ") : "";
}
function isVet(title: string, body: string): boolean {
  const t = title.toLowerCase();
  if (/(road|bridge|sanitation|employment|elections?|juvenile|tax|sheriff|jail|library|treasurer|child welfare|sales tax|404|not found|page not found)/i.test(t) && !/veteran|vso/i.test(t)) return false;
  if (/veteran|vso\b/i.test(t)) return true;
  const b = body.toLowerCase().slice(0, 80000);
  return (b.match(/veteran/g) || []).length >= 6 && /va\s+disability|dd[-\s]?214|service\s+officer|county\s+vso/i.test(b);
}

const TARGETS = [
  { county: "Bexar",      bases: ["https://www.bexar.org"] },
  { county: "Brazos",     bases: ["https://www.brazoscountytx.gov", "https://brazoscountytx.gov"] },
  { county: "Comal",      bases: ["https://www.comalcounty.gov", "https://www.co.comal.tx.us"] },
  { county: "Hidalgo",    bases: ["https://www.hidalgocounty.us"] },
  { county: "Lubbock",    bases: ["https://www.lubbockcounty.gov", "https://www.co.lubbock.tx.us"] },
  { county: "McLennan",   bases: ["https://www.mclennan.gov", "https://www.co.mclennan.tx.us"] },
  { county: "Parker",     bases: ["https://www.parkercountytx.gov", "https://www.parkercountytx.com"] },
  { county: "Travis",     bases: ["https://www.traviscountytx.gov"] },
  { county: "Williamson", bases: ["https://www.wilcotx.gov", "https://www.wilco.org"] },
];

async function main() {
  console.log("\n=== B3 sitemap-driven recovery ===\n");
  for (const { county, bases } of TARGETS) {
    let found: { url: string; title: string } | null = null;
    let candidatesTested = 0;
    for (const base of bases) {
      // try common sitemap locations
      for (const sm of [`${base}/sitemap.xml`, `${base}/sitemap_index.xml`, `${base}/wp-sitemap.xml`, `${base}/sitemap.aspx`]) {
        const r = await getText(sm);
        if (!r.ok || !r.body) continue;
        // Extract URLs containing "veteran" (case-insensitive)
        const urls = Array.from(r.body.matchAll(/<loc>([^<]+)<\/loc>/gi))
          .map(m => m[1].trim())
          .filter(u => /veteran|vso/i.test(u));
        for (const u of urls) {
          candidatesTested++;
          const pr = await getText(u);
          if (!pr.ok || !pr.body) continue;
          const title = getTitle(pr.body);
          if (isVet(title, pr.body)) { found = { url: pr.finalUrl, title }; break; }
        }
        if (found) break;
        // Sub-sitemaps in sitemap_index
        if (/sitemap/i.test(r.body) && /\.xml/.test(r.body)) {
          const subSitemaps = Array.from(r.body.matchAll(/<loc>([^<]+\.xml)<\/loc>/gi)).map(m => m[1]).slice(0, 8);
          for (const sub of subSitemaps) {
            const sr = await getText(sub);
            if (!sr.ok || !sr.body) continue;
            const subUrls = Array.from(sr.body.matchAll(/<loc>([^<]+)<\/loc>/gi))
              .map(m => m[1].trim())
              .filter(u => /veteran|vso/i.test(u));
            for (const u of subUrls) {
              candidatesTested++;
              const pr = await getText(u);
              if (!pr.ok || !pr.body) continue;
              const title = getTitle(pr.body);
              if (isVet(title, pr.body)) { found = { url: pr.finalUrl, title }; break; }
            }
            if (found) break;
          }
        }
        if (found) break;
      }
      if (found) break;
      // Last try: directly hit /Departments page and look for anchors there
      const dep = await getText(`${base}/Departments-A-Z`);
      if (dep.ok && dep.body) {
        const anchors = Array.from(dep.body.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi))
          .map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, " ").trim() }))
          .filter(a => /veteran|vso/i.test(a.href + " " + a.text));
        for (const a of anchors) {
          candidatesTested++;
          let abs: string;
          try { abs = new URL(a.href, dep.finalUrl).toString(); } catch { continue; }
          const pr = await getText(abs);
          if (!pr.ok || !pr.body) continue;
          const title = getTitle(pr.body);
          if (isVet(title, pr.body)) { found = { url: pr.finalUrl, title }; break; }
        }
      }
      if (found) break;
    }
    if (found) {
      console.log(`OK   ${county.padEnd(13)} → ${found.url}`);
      console.log(`     title="${found.title}"  (tested ${candidatesTested})`);
    } else {
      console.log(`MISS ${county.padEnd(13)} (tested ${candidatesTested})`);
    }
  }
}
main();
