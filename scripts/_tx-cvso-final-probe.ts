const UA = "Mozilla/5.0 (compatible; veteran-care-rollout-probe/1.0)";

async function fetchText(url: string, timeoutMs = 15000) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html,*/*" }, redirect: "follow", signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return { ok: false, status: r.status, finalUrl: r.url };
    return { ok: true, status: r.status, body: await r.text(), finalUrl: r.url };
  } catch (e: any) { return { ok: false, status: 0, finalUrl: url, err: String(e?.message ?? e) }; }
}

const txAreaCodes = new Set(["210","214","254","281","325","346","361","409","430","432","469","512","682","713","726","737","806","817","830","832","903","915","936","940","945","956","972","979"]);
function extractPhone(html: string): string | undefined {
  const re = /\(?(\d{3})\)?[\s.\-]?(\d{3})[\s.\-]?(\d{4})/g;
  for (const m of html.matchAll(re)) if (txAreaCodes.has(m[1])) return `${m[1]}-${m[2]}-${m[3]}`;
  return undefined;
}

// Comprehensive URL guesses for the remaining MISS counties
const TARGETS: Array<{ county: string; seat: string; tries: string[] }> = [
  { county: "Harris", seat: "Houston", tries: [
    "https://veteran.harriscountytx.gov/",
    "https://veteran.harriscountytx.gov/Pages/default.aspx",
    "https://veteran.harriscountytx.gov/Pages/About.aspx",
    "https://www.harriscountytx.gov/Departments/CSD/Veteran-Services",
  ]},
  { county: "El Paso", seat: "El Paso", tries: [
    "https://www.epcounty.com/veterans/default.htm",
    "https://www.epcounty.com/veterans/about.htm",
    "https://www.epcounty.com/Veterans/",
    "https://www.epcounty.com/CountyJudge/Veterans/",
  ]},
  { county: "Hays", seat: "San Marcos", tries: [
    "https://hayscountytx.gov/veterans-services/",
    "https://hayscountytx.gov/veterans-services-office/",
    "https://hayscountytx.com/our-county/county-departments/veterans-services/",
    "https://hayscountytx.com/our-departments/veterans-services/",
    "https://hayscountytx.com/veterans-services-office/",
  ]},
  { county: "Smith", seat: "Tyler", tries: [
    "https://www.smith-county.com/government/departments/veterans-services-office",
    "https://www.smith-county.com/government/departments/veteran-services-office",
    "https://www.smith-county.com/Government/Departments/VeteransServicesOffice",
    "https://www.smith-county.com/government/veterans-services",
  ]},
  { county: "Jefferson", seat: "Beaumont", tries: [
    "https://co.jefferson.tx.us/veteran/index.htm",
    "https://co.jefferson.tx.us/vsa/index.htm",
    "https://co.jefferson.tx.us/cvso/index.htm",
    "https://co.jefferson.tx.us/depts/veteran/",
    "https://www.jeffersoncountytx.gov/veteran-services",
    "https://www.co.jefferson.tx.us/veterans/",
  ]},
  { county: "Midland", seat: "Midland", tries: [
    "https://www.midlandcountytx.gov/170/Veterans-Services-Office",
    "https://www.midlandcountytx.gov/Veterans-Services-Office",
    "https://www.co.midland.tx.us/page/midland.Veterans",
    "https://midlandcountytx.gov/170/Veterans-Services-Office",
  ]},
  { county: "Taylor", seat: "Abilene", tries: [
    "https://www.taylorcountytexas.org/177/Veterans-Service-Office",
    "https://www.taylorcountytexas.org/Veterans-Service-Office",
    "https://www.taylorcountytexas.org/197/Veterans-Service-Office",
    "https://www.taylorcountytexas.org/government/departments/veterans-service-office",
  ]},
  { county: "Tom Green", seat: "San Angelo", tries: [
    "https://www.co.tom-green.tx.us/page/tomgreen.veteran",
    "https://www.co.tom-green.tx.us/page/tomgreen.Veterans",
    "https://www.co.tom-green.tx.us/page/tomgreen.VeteransServices",
    "https://www.co.tom-green.tx.us/page/tomgreen.veteranservices",
  ]},
  { county: "Victoria", seat: "Victoria", tries: [
    "https://www.victoriacountytx.org/197/Veteran-Services",
    "https://www.victoriacountytx.org/195/Veteran-Services",
    "https://victoriacountytx.org/191/Veterans-Services-Office",
    "https://victoriacountytx.org/government/departments/veterans-services-office",
  ]},
  { county: "Walker", seat: "Huntsville", tries: [
    "https://www.co.walker.tx.us/page/walker.veterans",
    "https://www.co.walker.tx.us/page/walker.veteran",
    "https://www.co.walker.tx.us/page/walker.Veterans.Services",
  ]},
  { county: "Wichita", seat: "Wichita Falls", tries: [
    "https://www.co.wichita.tx.us/170/Veteran-Service-Office",
    "https://www.co.wichita.tx.us/Veteran-Service-Office",
    "https://www.co.wichita.tx.us/195/Veteran-Service-Office",
    "https://www.co.wichita.tx.us/page/wichita.Veterans",
  ]},
  { county: "Wise", seat: "Decatur", tries: [
    "https://www.co.wise.tx.us/page/wise.Veterans.Services",
    "https://www.co.wise.tx.us/page/wise.veterans",
    "https://www.co.wise.tx.us/page/wise.Veteran",
  ]},
  { county: "Guadalupe", seat: "Seguin", tries: [
    "https://www.guadalupe.tx.us/253/Veterans-Service-Office",
    "https://www.co.guadalupe.tx.us/253/Veterans-Service-Office",
    "https://www.guadalupe.tx.us/Veterans-Service-Office",
    "https://www.guadalupe.tx.us/page/guadalupe.Veterans",
  ]},
  { county: "Hardin", seat: "Kountze", tries: [
    "https://co.hardin.tx.us/page/hardin.Veterans",
    "https://co.hardin.tx.us/page/hardin.County.Veterans.Service.Office",
    "https://www.co.hardin.tx.us/page/hardin.Veterans",
  ]},
  { county: "Hood", seat: "Granbury", tries: [
    "https://www.co.hood.tx.us/page/hood.Veterans",
    "https://www.co.hood.tx.us/page/hood.veteran.services",
    "https://www.co.hood.tx.us/Veterans-Service-Office",
  ]},
  { county: "Orange", seat: "Orange", tries: [
    "https://co.orange.tx.us/page/orange.Veterans",
    "https://www.co.orange.tx.us/page/orange.Veterans",
    "https://co.orange.tx.us/page/orange.County.Veterans.Service.Office",
  ]},
  { county: "Randall", seat: "Canyon", tries: [
    "https://www.randallcounty.org/government/county-departments/veterans-service-office",
    "https://www.randallcounty.org/veterans-service-office",
    "https://www.randallcounty.com/government/county-departments/veterans-service-office",
  ]},
  // 4 that previously hit Veterans Court — try real CVSO URLs
  { county: "Brazoria", seat: "Angleton", tries: [
    "https://www.brazoriacountytx.gov/departments/veterans-services-office",
    "https://www.brazoriacountytx.gov/departments/veterans-services",
    "https://www.brazoriacountytx.gov/departments/veteran-services",
    "https://www.brazoriacountytx.gov/government/county-departments/veterans-services-office",
  ]},
  { county: "Nueces", seat: "Corpus Christi", tries: [
    "https://www.nuecesco.com/county-services/veterans-services",
    "https://www.nuecesco.com/departments/veterans-services-office",
    "https://www.nuecesco.com/county-services/veteran-services",
    "https://www.nuecesco.com/community/veteran-services",
  ]},
  { county: "Potter", seat: "Amarillo", tries: [
    "https://www.co.potter.tx.us/page/potter.Veterans",
    "https://www.co.potter.tx.us/page/potter.veteran.services",
    "https://www.co.potter.tx.us/page/potter.Veterans.Service.Office",
  ]},
  { county: "Rockwall", seat: "Rockwall", tries: [
    "https://www.rockwallcountytexas.com/362/Veteran-Service-Office",
    "https://www.rockwallcountytexas.com/Veteran-Service-Office",
    "https://www.rockwallcountytexas.com/195/Veteran-Service-Office",
    "https://www.rockwallcountytexas.com/government/departments/veteran-service-office",
  ]},
];

async function main() {
  console.log("\n=== TX CVSO final-pass probe ===\n");
  let hits = 0;
  await Promise.all(TARGETS.map(async ({ county, seat, tries }) => {
    for (const url of tries) {
      const r = await fetchText(url);
      if (!r.ok || !r.body) continue;
      // Reject Anubis or login walls
      if (/Checking your browser before redirecting/i.test(r.body)) continue;
      // Require "veteran" word in body
      if (!/veteran/i.test(r.body)) continue;
      // Avoid Veterans Court misfires
      if (/veterans? (treatment )?court/i.test(r.body) && !/veterans? service/i.test(r.body)) continue;
      const phone = extractPhone(r.body);
      console.log(`OK   ${county.padEnd(13)} ${seat.padEnd(18)} ${r.finalUrl}  phone=${phone ?? "-"}`);
      hits++;
      return;
    }
    console.log(`MISS ${county.padEnd(13)} ${seat.padEnd(18)}`);
  }));
  console.log(`\n=== ${hits}/${TARGETS.length} additional via patterned guess ===`);
}
main();
