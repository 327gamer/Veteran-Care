const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0";
const HEADERS = { "User-Agent": UA, "Accept": "text/html,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.9" };
async function get(u: string) {
  try {
    const ctrl = new AbortController(); const t = setTimeout(()=>ctrl.abort(), 25000);
    const r = await fetch(u, { headers: HEADERS, redirect: "follow", signal: ctrl.signal });
    clearTimeout(t);
    return { ok: r.ok, status: r.status, finalUrl: r.url, body: r.ok ? await r.text() : "" };
  } catch (e:any) { return { ok: false, status: 0, finalUrl: u, body: "", err: String(e?.message||e) }; }
}
const T = (h:string)=> { const m=/<title[^>]*>([^<]+)<\/title>/i.exec(h); return m?m[1].trim().replace(/&amp;/g,"&").replace(/\s+/g," "):""; };

const TRY = [
  // Bexar — proper department page (vs Foundation)
  { county: "Bexar A",  url: "https://www.bexar.org/509/Department-of-Military-and-Veterans-Serv" },
  { county: "Bexar B",  url: "https://www.bexar.org/510/Veterans-Claims-and-Benefits" },
  // Hidalgo — better front-door
  { county: "Hidalgo A", url: "https://www.hidalgocounty.us/73/Veterans-Services" },
  { county: "Hidalgo B", url: "https://www.hidalgocounty.us/2843/Veterans-Services" },
  // Lubbock — common patterns
  { county: "Lubbock A", url: "https://www.lubbockcounty.gov/elected-officials/judge/veterans-services" },
  { county: "Lubbock B", url: "https://www.lubbockcounty.gov/department/division.php?structureid=145" },
  { county: "Lubbock C", url: "https://www.co.lubbock.tx.us/elected-officials/judge/veterans-services" },
  { county: "Lubbock D", url: "https://www.lubbockcounty.gov/elected-officials/county-judge/veterans-services" },
  // McLennan — try alternate
  { county: "McLennan A", url: "https://www.co.mclennan.tx.us/departments/veterans/" },
  { county: "McLennan B", url: "https://www.mclennan.gov/department/?fDD=23-0" },
  { county: "McLennan C", url: "https://www.co.mclennan.tx.us/department/?fDD=23-0" },
  { county: "McLennan D", url: "https://www.co.mclennan.tx.us/department/index.php?structureid=33" },
  // Williamson — try wilcotx variants
  { county: "Williamson A", url: "https://www.wilco.org/Departments/General-Services/Veteran-Services" },
  { county: "Williamson B", url: "https://www.wilcotx.gov/Departments/General-Services/Veteran-Services" },
  { county: "Williamson C", url: "https://www.wilco.org/veteranservices" },
  { county: "Williamson D", url: "https://www.wilco.org/veterans" },
  { county: "Williamson E", url: "https://www.wilco.org/Departments/Veteran-Services-Office" },
  // Williamson — fetch homepage and look for vet anchors
  { county: "Williamson HOME", url: "https://www.wilco.org/" },
  { county: "Williamson HOME2", url: "https://www.wilcotx.gov/" },
  { county: "Lubbock HOME", url: "https://www.lubbockcounty.gov/" },
  { county: "McLennan HOME", url: "https://www.mclennan.gov/" },
];

async function main() {
  for (const { county, url } of TRY) {
    const r = await get(url);
    const title = r.ok ? T(r.body) : "";
    const tag = r.ok && /veteran|vso/i.test(title) ? "OK  " : (r.ok ? "?   " : "FAIL");
    console.log(`${tag} ${county.padEnd(15)} status=${r.status}  title="${title.slice(0,80)}"  final=${r.finalUrl}`);
    // For HOME pages, list veteran anchors
    if (county.includes("HOME") && r.ok) {
      const anchors = Array.from(r.body.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi))
        .map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim() }))
        .filter(a => /veteran|vso/i.test(a.href + " " + a.text))
        .slice(0, 8);
      anchors.forEach(a => console.log(`     anchor: text="${a.text.slice(0,40)}" href=${a.href.slice(0,80)}`));
    }
  }
}
main();
