const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0";
async function get(u: string) {
  try {
    const ctrl = new AbortController(); const t = setTimeout(()=>ctrl.abort(), 25000);
    const r = await fetch(u, { headers: { "User-Agent": UA, "Accept": "text/html,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.9" }, redirect: "follow", signal: ctrl.signal });
    clearTimeout(t);
    return { ok: r.ok, status: r.status, finalUrl: r.url, body: r.ok ? await r.text() : "" };
  } catch (e:any) { return { ok: false, status: 0, finalUrl: u, body: "" }; }
}
const T = (h:string)=> { const m=/<title[^>]*>([^<]+)<\/title>/i.exec(h); return m?m[1].trim().replace(/&amp;/g,"&").replace(/\s+/g," "):""; };
function isVet(t: string, b: string) {
  const tl = t.toLowerCase();
  if (/(road|bridge|sanitation|employment|elections?|juvenile|tax|sheriff|jail|library|treasurer|child welfare|sales tax|404|not found|page not found)/i.test(tl) && !/veteran|vso/i.test(tl)) return false;
  if (/veteran|vso\b/i.test(tl)) return true;
  const bl = b.toLowerCase().slice(0,80000);
  return (bl.match(/veteran/g)||[]).length >= 5 && /va\s+|dd[-\s]?214|service\s+officer|county\s+vso/i.test(bl);
}

const TRY = [
  { c:"Lubbock-83", url:"https://www.lubbockcounty.gov/egov/apps/services/index.egov?view=item&id=83" },
  // Try wayback for McLennan & Williamson with full-snapshot URLs
  { c:"McLennan-WB-261", url:"https://web.archive.org/web/2024*/co.mclennan.tx.us/261*" },
  { c:"McLennan-WB-iface", url:"https://web.archive.org/web/2024if_/https://www.co.mclennan.tx.us/261/Veteran-Services" },
  { c:"McLennan-WB-mclennan", url:"https://web.archive.org/web/2024if_/https://www.mclennan.gov/261/Veteran-Services" },
  { c:"Williamson-WB-DepIdx", url:"https://web.archive.org/web/2024if_/https://www.wilco.org/Departments/Veteran-Services" },
  { c:"Williamson-WB-Direct", url:"https://web.archive.org/web/2025if_/https://www.wilco.org/Departments/Veteran-Services" },
  // Different headers for the bot-blocked sites - try Googlebot
];

async function main() {
  for (const { c, url } of TRY) {
    const r = await get(url);
    const title = r.ok ? T(r.body) : "";
    const vet = r.ok && isVet(title, r.body);
    const tag = vet ? "OK  " : (r.ok ? "?   " : "FAIL");
    console.log(`${tag} ${c.padEnd(20)} status=${r.status}  title="${title.slice(0,80)}"  bodyLen=${r.body.length}`);
    if (r.ok && r.body.length > 1000) {
      // Look for veteran content snippet
      const idx = r.body.toLowerCase().indexOf("veteran");
      if (idx > 0) console.log(`     vet-snippet: "${r.body.slice(idx, idx+200).replace(/\s+/g," ")}"`);
    }
  }
}
main();
