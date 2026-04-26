const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0";
async function main() {
  const r = await fetch("https://www.lubbockcounty.gov/egov/apps/services/index.egov?view=item&id=83", {
    headers: { "User-Agent": UA, "Accept": "text/html", "Accept-Language": "en-US,en;q=0.9" },
    redirect: "follow"
  });
  const body = await r.text();
  // Find service title and content
  const heading = /<h\d[^>]*>([^<]*veteran[^<]*)<\/h\d>/i.exec(body);
  console.log("heading match:", heading?.[1] || "(none)");
  // Look for "Texas Veterans Commission" text + surrounding
  const tvcIdx = body.toLowerCase().indexOf("texas veterans commission");
  if (tvcIdx > 0) console.log("TVC ref @", tvcIdx, ":", body.slice(tvcIdx-100, tvcIdx+500).replace(/\s+/g," "));
  // Look for vet anchors
  const anchors = Array.from(body.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi))
    .map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim() }))
    .filter(a => /veteran|vso/i.test(a.href + " " + a.text)).slice(0, 10);
  console.log("\nveteran anchors:");
  anchors.forEach(a => console.log(`  text="${a.text.slice(0,50)}" href=${a.href.slice(0,100)}`));
  // Look for phone in the immediate area
  const phones = Array.from(body.matchAll(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g)).slice(0,10);
  console.log("\nphones found in page:", phones.map(p => p[0]).join(", "));
}
main();
