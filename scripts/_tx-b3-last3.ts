const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0";
async function get(u: string, extraHeaders: Record<string,string> = {}) {
  try {
    const ctrl = new AbortController(); const t = setTimeout(()=>ctrl.abort(), 25000);
    const r = await fetch(u, { headers: { "User-Agent": UA, "Accept": "text/html,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.9", ...extraHeaders }, redirect: "follow", signal: ctrl.signal });
    clearTimeout(t);
    return { ok: r.ok, status: r.status, finalUrl: r.url, body: r.ok ? await r.text() : "" };
  } catch (e:any) { return { ok: false, status: 0, finalUrl: u, body: "" }; }
}
const T = (h:string)=> { const m=/<title[^>]*>([^<]+)<\/title>/i.exec(h); return m?m[1].trim().replace(/&amp;/g,"&").replace(/\s+/g," "):""; };
function isVet(t: string, b: string) {
  const tl = t.toLowerCase();
  if (/(road|bridge|sanitation|employment|elections?|juvenile|tax|sheriff|jail|library|treasurer|child welfare|sales tax|404|not found|page not found|home)/i.test(tl) && !/veteran|vso/i.test(tl)) return false;
  if (/veteran|vso\b/i.test(tl)) return true;
  const bl = b.toLowerCase().slice(0,80000);
  return (bl.match(/veteran/g)||[]).length >= 6 && /va\s+disability|dd[-\s]?214|service\s+officer|county\s+vso/i.test(bl);
}

const TRY = [
  // Lubbock
  { c:"Lubbock", url:"https://www.lubbockcounty.gov/egov/apps/services/index.egov?view=item&id=232" },
  { c:"Lubbock", url:"https://www.lubbockcounty.gov/egov/apps/services/index.egov?view=item&id=180" },
  { c:"Lubbock", url:"https://www.lubbockcounty.gov/departments/veteran-services" },
  { c:"Lubbock", url:"https://www.lubbockcounty.gov/departments/veterans-services" },
  { c:"Lubbock", url:"https://www.lubbockcounty.gov/elected-officials/county-judge" },
  { c:"Lubbock", url:"https://www.co.lubbock.tx.us/departments/veterans-services" },
  // Lubbock svcs index
  { c:"Lubbock-IDX", url:"https://www.lubbockcounty.gov/egov/apps/services/index.egov" },
  // McLennan — google cache & archive
  { c:"McLennan", url:"https://webcache.googleusercontent.com/search?q=cache:mclennan.gov/261/Veteran-Services" },
  { c:"McLennan-WB", url:"https://web.archive.org/web/2024/https://www.co.mclennan.tx.us/261/Veteran-Services" },
  { c:"McLennan-WB", url:"https://web.archive.org/web/2024/https://www.mclennan.gov/261/Veteran-Services" },
  // Williamson — wilco.org direct
  { c:"Williamson", url:"https://www.wilco.org/Departments/Veteran-Services-Office" },
  { c:"Williamson", url:"https://wilco.org/veterans-services" },
  { c:"Williamson", url:"https://www.wilco.org/Veterans-Services" },
  { c:"Williamson-WB", url:"https://web.archive.org/web/2024/https://www.wilco.org/" },
  // TVC state directory via different paths
  { c:"TVC", url:"https://www.tvc.texas.gov/claims-representation/county-service-officers/" },
  { c:"TVC", url:"https://www.tvc.texas.gov/find-cvso/" },
];

async function main() {
  for (const { c, url } of TRY) {
    const r = await get(url);
    const title = r.ok ? T(r.body) : "";
    const vet = r.ok && isVet(title, r.body);
    const tag = vet ? "OK  " : (r.ok ? "?   " : "FAIL");
    console.log(`${tag} ${c.padEnd(15)} status=${r.status}  title="${title.slice(0,80)}"  ${r.finalUrl !== url ? `→${r.finalUrl}`:""}`);
    // For TVC, look for table content
    if (c === "TVC" && r.ok && /lubbock|mclennan|williamson/i.test(r.body)) {
      console.log(`     [contains Lubbock/McLennan/Williamson references]`);
    }
    // For Lubbock-IDX, list veteran anchors
    if (c.includes("IDX") && r.ok) {
      const anchors = Array.from(r.body.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi))
        .map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g," ").trim() }))
        .filter(a => /veteran|vso/i.test(a.href + " " + a.text));
      anchors.forEach(a => console.log(`     anchor: text="${a.text.slice(0,40)}" href=${a.href.slice(0,80)}`));
    }
  }
}
main();
