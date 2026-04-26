/**
 * OHIO REBUILD — PHASE 3: COUNTY BACKBONE
 * Florida SOP. Add missing County Veterans Service Commissions (ORC 5901).
 * 31 counties this batch — all URLs liveness-verified before write.
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";
const COMMIT = process.argv.includes("--commit");

const VSC = (c: { name: string; seat: string; zip: string; url: string; phone?: string; address?: string }): SeedRow => ({
  section: "VSC",
  title: `${c.name} County Veterans Service Commission`,
  cat: "va-benefits",
  sub: "County Veterans Service Offices",
  city: c.seat,
  zip: c.zip,
  website_url: c.url,
  source_name: `${c.name} County, Ohio`,
  source_type: "county_agency",
  ...(c.phone ? { phone: c.phone } : {}),
  ...(c.address ? { address: c.address } : {}),
  desc: `${c.name} County Veterans Service Commission — county-funded VSC under ORC §5901; accredited service officers help with VA disability claims (filing, evidence development, appeals), pension/Aid & Attendance, DD-214 retrieval, financial assistance for indigent veterans (food/utilities/rent), transportation to VA appointments, burial benefits, and survivor benefits. Office located in ${c.seat}, OH.`,
});

const ROWS: SeedRow[] = [
  VSC({ name: "Ashland", seat: "Ashland", zip: "44805", url: "https://www.ashlandcounty.org/veterans/", phone: "419-282-4242", address: "110 Cottage St, 1st Floor, Ashland, OH 44805" }),
  VSC({ name: "Ashtabula", seat: "Jefferson", zip: "44047", url: "https://www.ashtabulacounty.us/189/Veteran-Services", phone: "440-576-3590", address: "25 W Jefferson St, Jefferson, OH 44047" }),
  VSC({ name: "Auglaize", seat: "Wapakoneta", zip: "45895", url: "https://www.auglaizecounty.org/" }),
  VSC({ name: "Belmont", seat: "St. Clairsville", zip: "43950", url: "https://belmontcountyohio.org/" }),
  VSC({ name: "Carroll", seat: "Carrollton", zip: "44615", url: "https://www.carrollcountyohio.us/" }),
  VSC({ name: "Darke", seat: "Greenville", zip: "45331", url: "https://www.darkecountyveterans.org/", phone: "937-547-7307", address: "504 S Broadway, Greenville, OH 45331" }),
  VSC({ name: "Fulton", seat: "Wauseon", zip: "43567", url: "https://www.fultoncountyoh.com/" }),
  VSC({ name: "Gallia", seat: "Gallipolis", zip: "45631", url: "https://www.galliacounty.org/" }),
  VSC({ name: "Geauga", seat: "Chardon", zip: "44024", url: "https://geaugavets.com/", phone: "440-279-1860", address: "12611 Ravenwood Dr, Chardon, OH 44024" }),
  VSC({ name: "Guernsey", seat: "Cambridge", zip: "43725", url: "https://www.guernseycounty.org/Veterans" }),
  VSC({ name: "Hancock", seat: "Findlay", zip: "45840", url: "https://www.co.hancock.oh.us/" }),
  VSC({ name: "Hardin", seat: "Kenton", zip: "43326", url: "https://www.hardincountyohio.gov/" }),
  VSC({ name: "Harrison", seat: "Cadiz", zip: "43907", url: "https://www.harrisoncountyohio.org/" }),
  VSC({ name: "Lawrence", seat: "Ironton", zip: "45638", url: "https://www.lawrencecountyohio.org/" }),
  VSC({ name: "Logan", seat: "Bellefontaine", zip: "43311", url: "https://www.logancountyohio.gov/" }),
  VSC({ name: "Mercer", seat: "Celina", zip: "45822", url: "https://mercercountyohio.org/" }),
  VSC({ name: "Miami", seat: "Troy", zip: "45373", url: "https://www.miamicountyohio.gov/" }),
  VSC({ name: "Monroe", seat: "Woodsfield", zip: "43793", url: "https://www.monroecountyohio.net/" }),
  VSC({ name: "Morrow", seat: "Mount Gilead", zip: "43338", url: "https://www.morrowcountyohio.gov/" }),
  VSC({ name: "Ottawa", seat: "Port Clinton", zip: "43452", url: "https://www.co.ottawa.oh.us/" }),
  VSC({ name: "Paulding", seat: "Paulding", zip: "45879", url: "https://www.pauldingcountyoh.com/" }),
  VSC({ name: "Perry", seat: "New Lexington", zip: "43764", url: "https://www.perrycountyohio.net/" }),
  VSC({ name: "Pickaway", seat: "Circleville", zip: "43113", url: "https://www.pickawaycountyohio.gov/" }),
  VSC({ name: "Putnam", seat: "Ottawa", zip: "45875", url: "https://putnamcountyohio.gov/" }),
  VSC({ name: "Ross", seat: "Chillicothe", zip: "45601", url: "https://www.rosscountyohio.gov/" }),
  VSC({ name: "Seneca", seat: "Tiffin", zip: "44883", url: "https://www.senecacountyohio.gov/" }),
  VSC({ name: "Van Wert", seat: "Van Wert", zip: "45891", url: "https://www.vanwertcounty.org/" }),
  VSC({ name: "Washington", seat: "Marietta", zip: "45750", url: "https://www.washingtongov.org/" }),
  VSC({ name: "Wayne", seat: "Wooster", zip: "44691", url: "https://www.wayneohio.org/" }),
  VSC({ name: "Williams", seat: "Bryan", zip: "43506", url: "https://www.williamscountyoh.gov/" }),
  VSC({ name: "Wyandot", seat: "Upper Sandusky", zip: "43351", url: "https://www.co.wyandot.oh.us/" }),
];

runSeed(ROWS, { state: "OH", commit: COMMIT, scriptName: "seed-oh-rebuild-p3.ts" });
