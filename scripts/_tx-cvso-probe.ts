/**
 * TX County VSO probe — fetches each county's CVSO page candidate(s),
 * picks the first 200-OK URL, and extracts phone + street address heuristically
 * so we have facts for the B3 seed instead of fabrications.
 */

const COUNTIES: Array<{ county: string; seat: string; candidates: string[] }> = [
  // Priority 20 (founder-named)
  { county: "Harris", seat: "Houston", candidates: [
    "https://veteran.harriscountytx.gov/",
    "https://veteran.harriscountytx.gov",
    "https://www.harriscountytx.gov/Departments/Veterans",
  ]},
  { county: "Dallas", seat: "Dallas", candidates: [
    "https://www.dallascounty.org/departments/health-human-services/veteran-services.php",
    "https://www.dallascounty.org/departments/dchhs/veterans-services.php",
  ]},
  { county: "Tarrant", seat: "Fort Worth", candidates: [
    "https://www.tarrantcountytx.gov/en/veterans-services.html",
    "https://www.tarrantcountytx.gov/en/veterans-services-office.html",
    "https://www.tarrantcounty.com/en/veterans-services-office.html",
  ]},
  { county: "Bexar", seat: "San Antonio", candidates: [
    "https://www.bexar.org/2961/Veterans-Services-Office",
    "https://www.bexar.org/4170/Veterans-Service-Office",
    "https://www.bexar.org/989/Military-Veterans-Services",
  ]},
  { county: "Travis", seat: "Austin", candidates: [
    "https://www.traviscountytx.gov/health-human-services/cwa-veterans-services",
    "https://www.traviscountytx.gov/veterans",
  ]},
  { county: "El Paso", seat: "El Paso", candidates: [
    "https://www.epcounty.com/veterans/",
    "https://www.epcounty.com/veterans",
  ]},
  { county: "Collin", seat: "McKinney", candidates: [
    "https://www.collincountytx.gov/veteran_services/Pages/default.aspx",
    "https://www.collincountytx.gov/veteran_services",
    "https://www.collincountytx.gov/community_outreach/Pages/veterans_services.aspx",
  ]},
  { county: "Denton", seat: "Denton", candidates: [
    "https://www.dentoncounty.gov/Departments/Veterans-Services",
    "https://www.dentoncounty.gov/2113/Veteran-Services",
  ]},
  { county: "Fort Bend", seat: "Richmond", candidates: [
    "https://www.fortbendcountytx.gov/government/departments/veterans-services",
    "https://www.fortbendcountytx.gov/Government/Departments/Veterans-Services",
  ]},
  { county: "Hidalgo", seat: "Edinburg", candidates: [
    "https://www.hidalgocounty.us/278/Veterans-Service-Office",
    "https://www.hidalgocounty.us/2057/Veterans-Service-Office",
    "https://www.hidalgocounty.us/Veterans",
  ]},
  { county: "Williamson", seat: "Georgetown", candidates: [
    "https://www.wilcotx.gov/veterans",
    "https://www.wilco.org/Departments/Veterans-Services",
  ]},
  { county: "Montgomery", seat: "Conroe", candidates: [
    "https://www.mctx.org/departments/departments_q-z/veterans_services_office.php",
    "https://www.mctx.org/departments/veterans_services_office.php",
  ]},
  { county: "Bell", seat: "Belton", candidates: [
    "https://www.bellcountytx.com/departments/veterans-service-office",
    "https://www.bellcountytx.com/departments/veterans_service_office.php",
    "https://www.bellcountytx.com/departments/veterans_service_office",
  ]},
  { county: "Nueces", seat: "Corpus Christi", candidates: [
    "https://www.nuecesco.com/county-services/veteran-services",
    "https://www.nuecesco.com/departments/veteran-services",
  ]},
  { county: "Cameron", seat: "Brownsville", candidates: [
    "https://www.cameroncountytx.gov/veterans-service-office/",
    "https://www.cameroncountytx.gov/veterans-service-office",
    "https://www.cameroncounty.us/veterans-service-office/",
  ]},
  { county: "Brazoria", seat: "Angleton", candidates: [
    "https://www.brazoriacountytx.gov/departments/veterans-services",
    "https://www.brazoriacountytx.gov/departments/veterans-service-office",
  ]},
  { county: "Galveston", seat: "Galveston", candidates: [
    "https://www.galvestoncountytx.gov/government/department-listings/veterans-services",
    "https://www.galvestoncountytx.gov/vs",
    "https://www.galvestoncountytx.gov/veteran-services",
  ]},
  { county: "Lubbock", seat: "Lubbock", candidates: [
    "https://www.lubbockcounty.gov/department/?fDD=23-0",
    "https://www.lubbockcounty.gov/department/division.php?structureid=23",
    "https://www.co.lubbock.tx.us/departments/veterans-services-office",
  ]},
  { county: "McLennan", seat: "Waco", candidates: [
    "https://www.co.mclennan.tx.us/261/Veteran-Services",
    "https://www.co.mclennan.tx.us/256/Veteran-Services",
    "https://www.co.mclennan.tx.us/Veteran-Services",
  ]},
  { county: "Smith", seat: "Tyler", candidates: [
    "https://www.smith-county.com/government/departments/veteran-services-office",
    "https://www.smith-county.com/government/departments/veteran-services",
  ]},

  // Continue outward — counties 21-50 by population
  { county: "Hays", seat: "San Marcos", candidates: [
    "https://hayscountytx.com/departments/veterans-services/",
    "https://hayscountytx.com/departments/veterans-service-office/",
  ]},
  { county: "Webb", seat: "Laredo", candidates: [
    "https://www.webbcountytx.gov/Veterans/",
    "https://www.webbcountytx.gov/CountyJudge/veterans.html",
  ]},
  { county: "Ellis", seat: "Waxahachie", candidates: [
    "https://www.co.ellis.tx.us/164/Veteran-Services",
    "https://www.co.ellis.tx.us/191/Veteran-Services",
  ]},
  { county: "Brazos", seat: "Bryan", candidates: [
    "https://www.brazoscountytx.gov/206/Veterans-Services",
    "https://www.brazoscountytx.gov/Departments/Veterans-Services",
  ]},
  { county: "Johnson", seat: "Cleburne", candidates: [
    "https://www.johnsoncountytx.org/departments/veterans-services",
    "https://www.johnsoncountytx.org/departments/veteran-services",
  ]},
  { county: "Parker", seat: "Weatherford", candidates: [
    "https://www.parkercountytx.com/195/Veterans-Service-Office",
    "https://www.parkercountytx.com/Veterans-Services",
  ]},
  { county: "Comal", seat: "New Braunfels", candidates: [
    "https://www.co.comal.tx.us/VSO.htm",
    "https://www.co.comal.tx.us/Veterans-Service-Office",
  ]},
  { county: "Guadalupe", seat: "Seguin", candidates: [
    "https://www.guadalupe.tx.us/253/Veterans-Service-Office",
    "https://www.co.guadalupe.tx.us/veterans-service-office",
  ]},
  { county: "Kaufman", seat: "Kaufman", candidates: [
    "https://www.kaufmancounty.net/dept-vetsvc.html",
    "https://www.kaufmancounty.net/veteran-services",
  ]},
  { county: "Rockwall", seat: "Rockwall", candidates: [
    "https://www.rockwallcountytexas.com/362/Veteran-Service-Office",
    "https://www.rockwallcountytexas.com/Veteran-Service-Office",
  ]},
  { county: "Midland", seat: "Midland", candidates: [
    "https://www.co.midland.tx.us/170/Veterans-Services-Office",
    "https://www.co.midland.tx.us/Veterans-Services-Office",
  ]},
  { county: "Ector", seat: "Odessa", candidates: [
    "https://www.co.ector.tx.us/page/ector.County.Veterans.Service.Officer",
    "https://www.co.ector.tx.us/Veterans-Service-Officer",
  ]},
  { county: "Jefferson", seat: "Beaumont", candidates: [
    "https://co.jefferson.tx.us/veterans/index.htm",
    "https://co.jefferson.tx.us/veterans/",
  ]},
  { county: "Taylor", seat: "Abilene", candidates: [
    "https://www.taylorcountytexas.org/177/Veterans-Service-Office",
    "https://www.taylorcountytexas.org/Veterans-Service-Office",
  ]},
  { county: "Tom Green", seat: "San Angelo", candidates: [
    "https://www.co.tom-green.tx.us/page/tomgreen.Veterans.Service.Office",
    "https://www.co.tom-green.tx.us/veterans-service-office",
  ]},
  { county: "Potter", seat: "Amarillo", candidates: [
    "https://www.co.potter.tx.us/page/potter.Veterans.Service.Office",
    "https://www.co.potter.tx.us/Veterans-Service-Office",
  ]},
  { county: "Randall", seat: "Canyon", candidates: [
    "https://www.randallcounty.org/government/county-departments/veterans-services-office",
    "https://www.randallcounty.org/veterans-services-office",
  ]},
  { county: "Wichita", seat: "Wichita Falls", candidates: [
    "https://www.co.wichita.tx.us/198/Veteran-Services",
    "https://www.co.wichita.tx.us/Veteran-Services",
  ]},
  { county: "Grayson", seat: "Sherman", candidates: [
    "https://www.co.grayson.tx.us/page/grayson.Veterans.Services",
    "https://www.co.grayson.tx.us/Veterans-Services",
  ]},
  { county: "Hunt", seat: "Greenville", candidates: [
    "https://www.huntcounty.net/page/hunt.County.Veterans.Service.Office",
    "https://www.huntcounty.net/Veterans-Service-Office",
  ]},
  { county: "Henderson", seat: "Athens", candidates: [
    "https://www.henderson-county.com/veterans-service-officer/",
    "https://www.henderson-county.com/veterans-service-officer",
  ]},
  { county: "Gregg", seat: "Longview", candidates: [
    "https://www.co.gregg.tx.us/page/gregg.veterans.services.office",
    "https://www.co.gregg.tx.us/Veterans-Services-Office",
  ]},
  { county: "Bowie", seat: "New Boston", candidates: [
    "https://www.co.bowie.tx.us/page/bowie.County.Veterans.Service.Office",
    "https://www.co.bowie.tx.us/Veterans-Service-Office",
  ]},
  { county: "Walker", seat: "Huntsville", candidates: [
    "https://www.co.walker.tx.us/page/walker.veterans.service.office",
    "https://www.co.walker.tx.us/Veterans-Service-Office",
  ]},
  { county: "Liberty", seat: "Liberty", candidates: [
    "https://www.co.liberty.tx.us/page/liberty.Veterans.Services",
    "https://www.co.liberty.tx.us/Veterans-Services",
  ]},
  { county: "Hardin", seat: "Kountze", candidates: [
    "https://co.hardin.tx.us/page/hardin.Veterans.Service.Office",
    "https://co.hardin.tx.us/Veterans-Service-Office",
  ]},
  { county: "Orange", seat: "Orange", candidates: [
    "https://co.orange.tx.us/page/orange.Veterans.Service.Office",
    "https://co.orange.tx.us/Veterans-Service-Office",
  ]},
  { county: "Hood", seat: "Granbury", candidates: [
    "https://www.co.hood.tx.us/page/hood.Veterans.Service.Office",
    "https://www.co.hood.tx.us/Veterans-Service-Office",
  ]},
  { county: "Wise", seat: "Decatur", candidates: [
    "https://www.co.wise.tx.us/page/wise.Veterans.Service.Office",
    "https://www.co.wise.tx.us/Veterans-Service-Office",
  ]},
  { county: "Victoria", seat: "Victoria", candidates: [
    "https://www.victoriacountytx.org/197/Veteran-Services",
    "https://www.victoriacountytx.org/Veteran-Services",
  ]},
];

const UA = "Mozilla/5.0 (compatible; veteran-care-rollout-probe/1.0)";

function extractPhone(html: string): string | undefined {
  // Match (XXX) XXX-XXXX or XXX-XXX-XXXX or XXX.XXX.XXXX
  const patterns = [
    /\(?(\d{3})\)?[\s.\-]?(\d{3})[\s.\-]?(\d{4})/g,
  ];
  for (const re of patterns) {
    const matches = Array.from(html.matchAll(re));
    for (const m of matches) {
      const phone = `${m[1]}-${m[2]}-${m[3]}`;
      // Skip obvious non-phone false positives (e.g. dates, ID numbers)
      if (/^[12]\d{2}/.test(m[1])) continue;     // doesn't start with TX area code-ish but allow all valid TX area codes
      if (m[1] === "000" || m[1] === "111") continue;
      // Whitelist TX area codes
      const txAreaCodes = ["210","214","254","281","325","346","361","409","430","432","469","512","682","713","726","737","806","817","830","832","903","915","936","940","945","956","972","979"];
      if (txAreaCodes.includes(m[1])) return phone;
    }
  }
  return undefined;
}

function extractStreet(html: string, seat: string): { street?: string; zip?: string } {
  // Look for "<digits> <Street Name> ... <City>, TX <ZIP>" pattern, prefer matches near "address" text
  const txZipRe = new RegExp(`\\b(\\d{1,5}(?:\\s\\d{1,4})?\\s+[A-Z][\\w'\\-\\.\\s]{3,60}?(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Lane|Ln|Highway|Hwy|Way|Place|Pl|Square|Sq|Court|Ct|Building|Bldg|Suite|Ste|Floor|Fl|Plaza)\\.?)[\\s,]+(?:[\\w'\\-\\.\\s]+,\\s*)?${seat.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}[\\s,]+TX[\\s,]+(\\d{5})`, "gi");
  const m = txZipRe.exec(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
  if (m) {
    return { street: m[1].trim(), zip: m[2] };
  }
  // Loose ZIP-only fallback (5-digit near city name)
  const looseZip = new RegExp(`${seat}[\\s,]+TX[\\s,]+(\\d{5})`, "i").exec(html.replace(/<[^>]+>/g, " "));
  if (looseZip) return { zip: looseZip[1] };
  return {};
}

async function probe(url: string): Promise<{ ok: boolean; status: number; body?: string }> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const r = await fetch(url, {
      headers: { "User-Agent": UA, "Accept": "text/html,*/*" },
      redirect: "follow",
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!r.ok) return { ok: false, status: r.status };
    const body = await r.text();
    return { ok: true, status: r.status, body };
  } catch {
    return { ok: false, status: 0 };
  }
}

async function main() {
  const results: Array<{ county: string; seat: string; url?: string; phone?: string; street?: string; zip?: string }> = [];
  await Promise.all(
    COUNTIES.map(async ({ county, seat, candidates }) => {
      for (const url of candidates) {
        const r = await probe(url);
        if (r.ok && r.body) {
          const phone = extractPhone(r.body);
          const { street, zip } = extractStreet(r.body, seat);
          results.push({ county, seat, url, phone, street, zip });
          return;
        }
      }
      results.push({ county, seat });
    })
  );
  results.sort((a, b) => a.county.localeCompare(b.county));
  console.log("\n=== TX County VSO probe results ===\n");
  for (const r of results) {
    if (!r.url) {
      console.log(`MISS  ${r.county.padEnd(15)}  ${r.seat.padEnd(20)}  — no candidate URL returned 200`);
    } else {
      const phoneStr = r.phone ?? "(no phone)";
      const streetStr = r.street ?? "(no street)";
      const zipStr = r.zip ?? "(no zip)";
      console.log(`OK    ${r.county.padEnd(15)}  ${r.seat.padEnd(20)}  url=${r.url}  phone=${phoneStr}  zip=${zipStr}  street=${streetStr.slice(0, 60)}`);
    }
  }
  const hits = results.filter((r) => r.url).length;
  console.log(`\n=== ${hits}/${results.length} URLs verified live ===`);
}

main();
