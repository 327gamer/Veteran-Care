const UA = "Mozilla/5.0 (compatible; veteran-care-rollout-probe/1.0)";

async function probe(url: string) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow", signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return { ok: false, status: r.status };
    return { ok: true, status: r.status, body: await r.text(), ct: r.headers.get("content-type") };
  } catch (e: any) { return { ok: false, status: 0, err: String(e?.message ?? e) }; }
}

async function main() {
  // Look for the JS bundle reference in the TVC page
  const tvcPage = await probe("https://tvc.texas.gov/veterans/find-a-county-veterans-service-officer/");
  if (tvcPage.ok && tvcPage.body) {
    console.log("\n=== TVC page snippet (first 4 KB) ===\n");
    console.log(tvcPage.body.slice(0, 4000));
    console.log("\n=== JS bundle / API hints ===");
    const scripts = Array.from(tvcPage.body.matchAll(/<script[^>]*src=["']([^"']+)["']/gi)).map(m => m[1]);
    console.log("scripts:", scripts);
    const apis = Array.from(tvcPage.body.matchAll(/https?:\/\/[\w./-]+\/(api|wp-json|graphql|data)[\w./?=&-]*/gi)).map(m => m[0]);
    console.log("api refs:", Array.from(new Set(apis)));
  }
  // Try common WP API endpoints (TVC site looks like WordPress)
  const tries = [
    "https://tvc.texas.gov/wp-json/wp/v2/cvso?per_page=100",
    "https://tvc.texas.gov/wp-json/wp/v2/county-service-officer?per_page=100",
    "https://tvc.texas.gov/wp-json/wp/v2/cvso-list?per_page=100",
    "https://tvc.texas.gov/wp-json/acf/v3/cvso",
    "https://tvc.texas.gov/wp-json/wp/v2/pages?slug=find-a-county-veterans-service-officer",
    "https://tvc.texas.gov/wp-json/",
  ];
  for (const u of tries) {
    const r = await probe(u);
    console.log(`${r.ok ? "OK  " : "MISS"} ${u} → ${r.status} ${(r as any).ct ?? ""}  ${r.ok && r.body ? `(${(r.body.length/1024).toFixed(1)} KB)` : ""}`);
    if (r.ok && r.body && r.body.length < 50000) {
      console.log(r.body.slice(0, 1500));
      console.log("...");
    }
  }
}
main();
