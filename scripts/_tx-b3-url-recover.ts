/**
 * B3 hotfix recovery — for each of the 16 BAD URLs, harvest the county's
 * homepage / departments-list / A-Z index for ANY URL whose anchor text or
 * surrounding context contains "veteran" — then verify the candidate URL
 * actually serves veteran content (title or body density check).
 *
 * For sites that 403 the verify-step UA, retry with browser-Chrome UA and
 * Accept-Language to defeat naive UA blacklists.
 */

const UA_CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

const HEADERS_BROWSER = {
  "User-Agent": UA_CHROME,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Upgrade-Insecure-Requests": "1",
};

async function getText(url: string, timeoutMs = 20000) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(url, { headers: HEADERS_BROWSER, redirect: "follow", signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return { ok: false, status: r.status, finalUrl: r.url };
    return { ok: true, status: r.status, finalUrl: r.url, body: await r.text() };
  } catch (e: any) { return { ok: false, status: 0, finalUrl: url, err: String(e?.message ?? e) }; }
}

function getTitle(html: string): string {
  const m = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return m ? m[1].trim().replace(/&amp;/g, "&").replace(/\s+/g, " ") : "";
}

function isVeteranPage(title: string, body: string): boolean {
  const t = title.toLowerCase();
  // Reject obvious non-VSO departments
  if (/(road|bridge|sanitation|employment|elections?|juvenile|tax|sheriff|jail|library|treasurer|child welfare|sales tax|404|not found|page not found)/i.test(t) && !/veteran|vso/i.test(t)) return false;
  if (/veteran|vso\b/i.test(t)) return true;
  const b = body.toLowerCase().slice(0, 80000);
  const vetWords = (b.match(/veteran/g) || []).length;
  const vsoSignals = /va\s+disability|dd[-\s]?214|claims?\s+(filing|assistance)|service\s+officer|county\s+vso|county\s+veteran/i.test(b);
  return vetWords >= 6 && vsoSignals;
}

// ALL anchors on a page that mention "veteran" in href or text
function harvestVeteranAnchors(body: string, baseUrl: string): { url: string; text: string }[] {
  const out = new Map<string, string>();
  const re = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const m of body.matchAll(re)) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!/veteran|vso/i.test(href + " " + text)) continue;
    let abs: string;
    try { abs = new URL(href, baseUrl).toString(); } catch { continue; }
    if (!out.has(abs)) out.set(abs, text);
  }
  return [...out.entries()].map(([url, text]) => ({ url, text }));
}

const BAD: Array<{ county: string; oldUrl: string; homepages: string[]; deptIndexes?: string[] }> = [
  { county: "Bell", oldUrl: "https://www.bellcountytx.com/departments/veteran_services/index.php",
    homepages: ["https://www.bellcountytx.com/", "https://www.bellcountytx.com/departments/index.php"] },
  { county: "Bexar", oldUrl: "https://www.bexar.org/989/Military-Veterans-Services",
    homepages: ["https://www.bexar.org/", "https://www.bexar.org/Departments-A-Z"] },
  { county: "Brazos", oldUrl: "https://www.brazoscountytx.gov/206/Veterans-Services",
    homepages: ["https://www.brazoscountytx.gov/", "https://www.brazoscountytx.gov/Departments-A-Z"] },
  { county: "Collin", oldUrl: "https://www.collincountytx.gov/Services/Veteran-Services/benefits",
    homepages: ["https://www.collincountytx.gov/", "https://www.collincountytx.gov/services"] },
  { county: "Comal", oldUrl: "https://www.co.comal.tx.us/VSO.htm",
    homepages: ["https://www.co.comal.tx.us/", "https://www.co.comal.tx.us/Departments.htm", "https://www.comalcounty.gov/", "https://www.comalcounty.gov/departments"] },
  { county: "Ellis", oldUrl: "https://www.co.ellis.tx.us/164/Veteran-Services",
    homepages: ["https://www.co.ellis.tx.us/", "https://www.co.ellis.tx.us/Departments-A-Z"] },
  { county: "Galveston", oldUrl: "https://www.galvestoncountytx.gov/vs",
    homepages: ["https://www.galvestoncountytx.gov/", "https://www.galvestoncountytx.gov/government/departments"] },
  { county: "Henderson", oldUrl: "https://www.henderson-county.com/departments/veterans-services",
    homepages: ["https://www.henderson-county.com/", "https://www.henderson-county.com/departments"] },
  { county: "Hidalgo", oldUrl: "https://www.hidalgocounty.us/2057/Veterans-Service-Office",
    homepages: ["https://www.hidalgocounty.us/", "https://www.hidalgocounty.us/Departments-A-Z"] },
  { county: "Johnson", oldUrl: "https://www.johnsoncountytx.org/departments/veteran-s-services",
    homepages: ["https://www.johnsoncountytx.org/", "https://www.johnsoncountytx.org/departments"] },
  { county: "Liberty", oldUrl: "https://www.co.liberty.tx.us/page/liberty.Veterans",
    homepages: ["https://www.co.liberty.tx.us/", "https://www.co.liberty.tx.us/page/liberty.Departments"] },
  { county: "Lubbock", oldUrl: "https://www.lubbockcounty.gov/department/?fDD=23-0",
    homepages: ["https://www.lubbockcounty.gov/", "https://www.lubbockcounty.gov/index", "https://www.co.lubbock.tx.us/"] },
  { county: "McLennan", oldUrl: "https://www.co.mclennan.tx.us/261/Veteran-Services",
    homepages: ["https://www.co.mclennan.tx.us/", "https://www.co.mclennan.tx.us/Departments-A-Z", "https://www.mclennan.gov/", "https://www.mclennan.gov/Departments-A-Z"] },
  { county: "Parker", oldUrl: "https://www.parkercountytx.com/195/Veterans-Service-Office",
    homepages: ["https://www.parkercountytx.com/", "https://www.parkercountytx.com/Departments-A-Z", "https://www.parkercountytx.gov/", "https://www.parkercountytx.gov/Departments-A-Z"] },
  { county: "Travis", oldUrl: "https://www.traviscountytx.gov/health-human-services/cwa-veterans-services",
    homepages: ["https://www.traviscountytx.gov/", "https://www.traviscountytx.gov/health-human-services"] },
  { county: "Williamson", oldUrl: "https://www.wilco.org/Departments/Veterans-Services",
    homepages: ["https://www.wilco.org/", "https://www.wilcotx.gov/", "https://www.wilcotx.gov/Departments-A-Z"] },
  // Webb additional check: architect says webbcountytx.gov/VeteranServices/ exists as separate page from WCRVTP
  { county: "Webb-CHECK", oldUrl: "https://www.webbcountytx.gov/WCRVTP/",
    homepages: ["https://www.webbcountytx.gov/", "https://www.webbcountytx.gov/VeteranServices/"] },
];

async function main() {
  console.log("\n=== B3 URL recovery ===\n");
  for (const { county, oldUrl, homepages } of BAD) {
    let found: { url: string; text: string; title: string } | null = null;
    const tried: string[] = [];

    // Step 1: try direct VeteranServices/ pattern + dual-domain/.gov variants of oldUrl
    const variants = [
      // Replace /<num>/Other-Slug → try /Veterans-Service-Office literal
      oldUrl.replace(/\/\d+\/.*$/, "/Veterans-Service-Office"),
      oldUrl.replace(/\/\d+\/.*$/, "/Veteran-Services"),
      oldUrl.replace(/\/\d+\/.*$/, "/Departments/Veterans-Services"),
      // Replace .com/.us with .gov for sites that migrated CMS
      oldUrl.replace("co.comal.tx.us", "comalcounty.gov"),
      oldUrl.replace("co.mclennan.tx.us", "mclennan.gov"),
      oldUrl.replace("parkercountytx.com", "parkercountytx.gov"),
      oldUrl.replace("wilco.org", "wilcotx.gov"),
    ];
    for (const v of variants) {
      if (v === oldUrl) continue;
      tried.push(v);
      const r = await getText(v);
      if (!r.ok) continue;
      const title = getTitle(r.body!);
      if (isVeteranPage(title, r.body!)) {
        found = { url: r.finalUrl, text: "(direct variant)", title };
        break;
      }
    }

    // Step 2: harvest homepage anchors
    if (!found) {
      for (const home of homepages) {
        const hr = await getText(home);
        if (!hr.ok || !hr.body) continue;
        const candidates = harvestVeteranAnchors(hr.body, hr.finalUrl);
        for (const c of candidates) {
          // Only same-root domain
          try {
            const u = new URL(c.url);
            const h = new URL(hr.finalUrl);
            const rootU = u.hostname.split(".").slice(-3).join(".");
            const rootH = h.hostname.split(".").slice(-3).join(".");
            if (!rootU.endsWith(h.hostname.split(".").slice(-2).join("."))) continue;
          } catch { continue; }
          tried.push(c.url);
          const r = await getText(c.url);
          if (!r.ok || !r.body) continue;
          const title = getTitle(r.body);
          if (isVeteranPage(title, r.body)) {
            found = { url: r.finalUrl, text: c.text, title };
            break;
          }
        }
        if (found) break;
      }
    }

    if (found) {
      console.log(`OK   ${county.padEnd(13)} → ${found.url}`);
      console.log(`     anchor=\"${found.text}\"  title=\"${found.title}\"`);
    } else {
      console.log(`MISS ${county.padEnd(13)} (tried ${tried.length} candidates)`);
    }
  }
}
main();
