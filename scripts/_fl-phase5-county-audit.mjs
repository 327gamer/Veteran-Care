import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// FL city → county map (covers all known/seeded cities + common others)
const CITY_TO_COUNTY = {
  // Alachua
  'Gainesville':'Alachua','Alachua':'Alachua','High Springs':'Alachua','Newberry':'Alachua','Archer':'Alachua',
  // Baker
  'Macclenny':'Baker','Glen Saint Mary':'Baker',
  // Bay
  'Panama City':'Bay','Panama City Beach':'Bay','Lynn Haven':'Bay','Callaway':'Bay','Tyndall AFB':'Bay','Mexico Beach':'Bay',
  // Bradford
  'Starke':'Bradford','Lawtey':'Bradford',
  // Brevard
  'Melbourne':'Brevard','Palm Bay':'Brevard','Cocoa':'Brevard','Cocoa Beach':'Brevard','Rockledge':'Brevard','Titusville':'Brevard','Viera':'Brevard','Patrick AFB':'Brevard','Patrick Space Force Base':'Brevard','Indialantic':'Brevard','Merritt Island':'Brevard','Satellite Beach':'Brevard',
  // Broward
  'Fort Lauderdale':'Broward','Hollywood':'Broward','Pompano Beach':'Broward','Coral Springs':'Broward','Sunrise':'Broward','Plantation':'Broward','Davie':'Broward','Pembroke Pines':'Broward','Pembroke Park':'Broward','Lauderdale Lakes':'Broward','Oakland Park':'Broward','Lauderhill':'Broward','Tamarac':'Broward','Margate':'Broward','Coconut Creek':'Broward','Deerfield Beach':'Broward','Hallandale Beach':'Broward','Wilton Manors':'Broward','Weston':'Broward',
  // Calhoun
  'Blountstown':'Calhoun',
  // Charlotte
  'Port Charlotte':'Charlotte','Punta Gorda':'Charlotte','Englewood':'Charlotte',
  // Citrus
  'Inverness':'Citrus','Crystal River':'Citrus','Lecanto':'Citrus','Homosassa':'Citrus',
  // Clay
  'Orange Park':'Clay','Green Cove Springs':'Clay','Middleburg':'Clay','Fleming Island':'Clay',
  // Collier
  'Naples':'Collier','Marco Island':'Collier','Immokalee':'Collier','Everglades City':'Collier',
  // Columbia
  'Lake City':'Columbia','Fort White':'Columbia',
  // DeSoto
  'Arcadia':'DeSoto',
  // Dixie
  'Cross City':'Dixie',
  // Duval
  'Jacksonville':'Duval','Jacksonville Beach':'Duval','Atlantic Beach':'Duval','Neptune Beach':'Duval','Mayport':'Duval','Baldwin':'Duval',
  // Escambia
  'Pensacola':'Escambia','Cantonment':'Escambia',
  // Flagler
  'Bunnell':'Flagler','Palm Coast':'Flagler','Flagler Beach':'Flagler',
  // Franklin
  'Apalachicola':'Franklin','Carrabelle':'Franklin','Eastpoint':'Franklin',
  // Gadsden
  'Quincy':'Gadsden','Havana':'Gadsden','Chattahoochee':'Gadsden',
  // Gilchrist
  'Trenton':'Gilchrist','Bell':'Gilchrist',
  // Glades
  'Moore Haven':'Glades',
  // Gulf
  'Port Saint Joe':'Gulf','Wewahitchka':'Gulf',
  // Hamilton
  'Jasper':'Hamilton','Jennings':'Hamilton','White Springs':'Hamilton',
  // Hardee
  'Wauchula':'Hardee','Bowling Green':'Hardee','Zolfo Springs':'Hardee',
  // Hendry
  'LaBelle':'Hendry','Clewiston':'Hendry',
  // Hernando
  'Brooksville':'Hernando','Spring Hill':'Hernando','Weeki Wachee':'Hernando',
  // Highlands
  'Sebring':'Highlands','Avon Park':'Highlands','Lake Placid':'Highlands',
  // Hillsborough
  'Tampa':'Hillsborough','Brandon':'Hillsborough','Plant City':'Hillsborough','Riverview':'Hillsborough','Apollo Beach':'Hillsborough','Sun City Center':'Hillsborough','Lutz':'Hillsborough','Land O Lakes':'Pasco','Wesley Chapel':'Pasco',
  // Holmes
  'Bonifay':'Holmes','Westville':'Holmes',
  // Indian River
  'Vero Beach':'Indian River','Sebastian':'Indian River','Fellsmere':'Indian River',
  // Jackson
  'Marianna':'Jackson','Graceville':'Jackson','Sneads':'Jackson',
  // Jefferson
  'Monticello':'Jefferson',
  // Lafayette
  'Mayo':'Lafayette',
  // Lake
  'Tavares':'Lake','Leesburg':'Lake','Eustis':'Lake','Mount Dora':'Lake','Clermont':'Lake','Lady Lake':'Lake','Fruitland Park':'Lake',
  // Lee
  'Fort Myers':'Lee','Cape Coral':'Lee','Bonita Springs':'Lee','Estero':'Lee','Lehigh Acres':'Lee','North Fort Myers':'Lee','Sanibel':'Lee','Fort Myers Beach':'Lee',
  // Leon
  'Tallahassee':'Leon','Woodville':'Leon',
  // Levy
  'Bronson':'Levy','Williston':'Levy','Chiefland':'Levy','Cedar Key':'Levy',
  // Liberty
  'Bristol':'Liberty',
  // Madison
  'Madison':'Madison','Greenville':'Madison',
  // Manatee
  'Bradenton':'Manatee','Palmetto':'Manatee','Bradenton Beach':'Manatee','Holmes Beach':'Manatee','Anna Maria':'Manatee','Parrish':'Manatee','Ellenton':'Manatee',
  // Marion
  'Ocala':'Marion','Belleview':'Marion','Dunnellon':'Marion','Silver Springs':'Marion','Ocklawaha':'Marion',
  // Martin
  'Stuart':'Martin','Jensen Beach':'Martin','Hobe Sound':'Martin','Palm City':'Martin',
  // Miami-Dade
  'Miami':'Miami-Dade','Hialeah':'Miami-Dade','Miami Beach':'Miami-Dade','Coral Gables':'Miami-Dade','Homestead':'Miami-Dade','Doral':'Miami-Dade','North Miami':'Miami-Dade','North Miami Beach':'Miami-Dade','Aventura':'Miami-Dade','Miami Gardens':'Miami-Dade','Kendall':'Miami-Dade','Cutler Bay':'Miami-Dade','Pinecrest':'Miami-Dade','South Miami':'Miami-Dade',
  // Monroe
  'Key West':'Monroe','Key Largo':'Monroe','Marathon':'Monroe','Tavernier':'Monroe','Islamorada':'Monroe','Big Pine Key':'Monroe',
  // Nassau
  'Fernandina Beach':'Nassau','Yulee':'Nassau','Hilliard':'Nassau','Callahan':'Nassau',
  // Okaloosa
  'Crestview':'Okaloosa','Fort Walton Beach':'Okaloosa','Niceville':'Okaloosa','Destin':'Okaloosa','Mary Esther':'Okaloosa','Eglin AFB':'Okaloosa','Hurlburt Field':'Okaloosa','Valparaiso':'Okaloosa','Shalimar':'Okaloosa',
  // Okeechobee
  'Okeechobee':'Okeechobee',
  // Orange
  'Orlando':'Orange','Winter Park':'Orange','Apopka':'Orange','Ocoee':'Orange','Winter Garden':'Orange','Maitland':'Orange','Belle Isle':'Orange','Pine Hills':'Orange',
  // Osceola
  'Kissimmee':'Osceola','Saint Cloud':'Osceola','Celebration':'Osceola','Poinciana':'Osceola',
  // Palm Beach
  'West Palm Beach':'Palm Beach','Boca Raton':'Palm Beach','Delray Beach':'Palm Beach','Boynton Beach':'Palm Beach','Palm Beach Gardens':'Palm Beach','Lake Worth':'Palm Beach','Lake Park':'Palm Beach','Greenacres':'Palm Beach','Wellington':'Palm Beach','Jupiter':'Palm Beach','Belle Glade':'Palm Beach','Palm Beach':'Palm Beach','Riviera Beach':'Palm Beach','Royal Palm Beach':'Palm Beach','North Palm Beach':'Palm Beach',
  // Pasco
  'Holiday':'Pasco','New Port Richey':'Pasco','Port Richey':'Pasco','Hudson':'Pasco','Dade City':'Pasco','Zephyrhills':'Pasco',
  // Pinellas
  'Saint Petersburg':'Pinellas','Clearwater':'Pinellas','Largo':'Pinellas','Pinellas Park':'Pinellas','Dunedin':'Pinellas','Tarpon Springs':'Pinellas','Seminole':'Pinellas','Tierra Verde':'Pinellas','Madeira Beach':'Pinellas','Clearwater Beach':'Pinellas','Gulfport':'Pinellas','St. Petersburg':'Pinellas','Saint Pete Beach':'Pinellas','Treasure Island':'Pinellas','Indian Rocks Beach':'Pinellas','Palm Harbor':'Pinellas','Safety Harbor':'Pinellas','Oldsmar':'Pinellas',
  // Polk
  'Lakeland':'Polk','Winter Haven':'Polk','Bartow':'Polk','Auburndale':'Polk','Haines City':'Polk','Lake Wales':'Polk','Mulberry':'Polk',
  // Putnam
  'Palatka':'Putnam','Crescent City':'Putnam','Interlachen':'Putnam',
  // Saint Johns
  'Saint Augustine':'Saint Johns','Ponte Vedra':'Saint Johns','Ponte Vedra Beach':'Saint Johns','Saint Marys':'Saint Johns','World Golf Village':'Saint Johns',
  // Saint Lucie
  'Fort Pierce':'Saint Lucie','Port Saint Lucie':'Saint Lucie',
  // Santa Rosa
  'Milton':'Santa Rosa','Pace':'Santa Rosa','Gulf Breeze':'Santa Rosa','Navarre':'Santa Rosa','Jay':'Santa Rosa',
  // Sarasota
  'Sarasota':'Sarasota','North Port':'Sarasota','Venice':'Sarasota','Osprey':'Sarasota','Nokomis':'Sarasota','Englewood East':'Sarasota',
  // Seminole
  'Sanford':'Seminole','Altamonte Springs':'Seminole','Lake Mary':'Seminole','Casselberry':'Seminole','Longwood':'Seminole','Oviedo':'Seminole','Winter Springs':'Seminole',
  // Sumter
  'Bushnell':'Sumter','Wildwood':'Sumter','The Villages':'Sumter','Coleman':'Sumter',
  // Suwannee
  'Live Oak':'Suwannee','Branford':'Suwannee',
  // Taylor
  'Perry':'Taylor','Steinhatchee':'Taylor',
  // Union
  'Lake Butler':'Union','Raiford':'Union',
  // Volusia
  'Daytona Beach':'Volusia','DeLand':'Volusia','Deltona':'Volusia','Port Orange':'Volusia','Ormond Beach':'Volusia','New Smyrna Beach':'Volusia','Edgewater':'Volusia','South Daytona':'Volusia','Holly Hill':'Volusia','Orange City':'Volusia','DeBary':'Volusia',
  // Wakulla
  'Crawfordville':'Wakulla','Sopchoppy':'Wakulla',
  // Walton
  'DeFuniak Springs':'Walton','Santa Rosa Beach':'Walton','Freeport':'Walton','Miramar Beach':'Walton',
  // Washington
  'Chipley':'Washington','Vernon':'Washington',
};

const ALL_67_COUNTIES = ['Alachua','Baker','Bay','Bradford','Brevard','Broward','Calhoun','Charlotte','Citrus','Clay','Collier','Columbia','DeSoto','Dixie','Duval','Escambia','Flagler','Franklin','Gadsden','Gilchrist','Glades','Gulf','Hamilton','Hardee','Hendry','Hernando','Highlands','Hillsborough','Holmes','Indian River','Jackson','Jefferson','Lafayette','Lake','Lee','Leon','Levy','Liberty','Madison','Manatee','Marion','Martin','Miami-Dade','Monroe','Nassau','Okaloosa','Okeechobee','Orange','Osceola','Palm Beach','Pasco','Pinellas','Polk','Putnam','Saint Johns','Saint Lucie','Santa Rosa','Sarasota','Seminole','Sumter','Suwannee','Taylor','Union','Volusia','Wakulla','Walton','Washington'];

const { data: rows } = await sb.from('resources').select('city,title').eq('state','FL').eq('status','approved').limit(2000);

const byCounty = {}, unmappedCities = new Set(), countyTitles = {};
for (const r of rows) {
  if (!r.city) continue;
  const county = CITY_TO_COUNTY[r.city];
  if (!county) { unmappedCities.add(r.city); continue; }
  byCounty[county] = (byCounty[county] || 0) + 1;
  if (!countyTitles[county]) countyTitles[county] = [];
  if (countyTitles[county].length < 3) countyTitles[county].push(r.title);
}

console.log(`\n=== County coverage (${Object.keys(byCounty).length} of 67 covered) ===`);
const counts = ALL_67_COUNTIES.map(c => ({c, n: byCounty[c] || 0})).sort((a,b) => a.n - b.n);
console.log('\nZERO coverage counties:');
const zero = counts.filter(x => x.n === 0).map(x => x.c);
console.log(`  (${zero.length}) ${zero.join(', ')}`);
console.log('\n1-2 row counties (thin):');
for (const x of counts.filter(c => c.n >= 1 && c.n <= 2)) console.log(`  ${x.c.padEnd(15)} ${x.n}`);
console.log('\n3-9 row counties (light):');
for (const x of counts.filter(c => c.n >= 3 && c.n <= 9)) console.log(`  ${x.c.padEnd(15)} ${x.n}`);
console.log('\n10+ row counties (solid):');
for (const x of counts.filter(c => c.n >= 10).sort((a,b) => b.n - a.n)) console.log(`  ${x.c.padEnd(15)} ${x.n}`);

if (unmappedCities.size) {
  console.log(`\nUnmapped cities (${unmappedCities.size}):  ${[...unmappedCities].sort().join(', ')}`);
}
