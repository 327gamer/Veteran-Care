const UA = "Mozilla/5.0 (compatible; veteran-care-rollout-probe/1.0)";

async function probe(url: string) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(url, {
      headers: { "User-Agent": UA, "Accept": "text/html,*/*" },
      redirect: "follow", signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!r.ok) return { ok: false, status: r.status, url };
    const body = await r.text();
    return { ok: true, status: r.status, url, body, finalUrl: r.url };
  } catch (e: any) { return { ok: false, status: 0, url, err: String(e?.message || e) }; }
}

async function main() {
  const candidates = [
    "https://www.tvc.texas.gov/veterans/find-a-county-veterans-service-officer/",
    "https://www.tvc.texas.gov/veterans/find-a-county-service-officer/",
    "https://tvc.texas.gov/county-service-officers/",
    "https://www.tvc.texas.gov/county-service-officers/",
    "https://www.tvc.texas.gov/veterans/county-services/",
    "https://www.tvc.texas.gov/veterans/county-veterans-service-officers/",
    "https://tacvso.org/",
    "https://tacvso.org/county-services/",
    "https://www.tacvso.org/",
    "https://www.tacvso.org/cvso-directory",
  ];
  for (const u of candidates) {
    const r = await probe(u);
    if (r.ok) {
      console.log(`OK   ${u} → ${r.finalUrl} (${(r.body!.length/1024).toFixed(0)} KB)`);
      // Quick peek for county-name density (proxy for "is this a county directory?")
      const counties = ["Harris", "Dallas", "Tarrant", "Bexar", "Travis", "El Paso", "Collin", "Denton", "Hidalgo", "Williamson"];
      const hits = counties.filter(c => new RegExp(`\\b${c}\\b`, "i").test(r.body!)).length;
      console.log(`     county-name hits (sample 10): ${hits}/10`);
    } else {
      console.log(`MISS ${u} → ${r.status}${(r as any).err ? ` (${(r as any).err})` : ""}`);
    }
  }
}
main();
