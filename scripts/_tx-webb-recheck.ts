const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Upgrade-Insecure-Requests": "1",
};

const URLS = [
  "https://www.webbcountytx.gov/VeteranServices/",
  "https://www.webbcountytx.gov/VeteranServices",
  "https://www.webbcountytx.gov/veteranservices/",
  "https://www.webbcountytx.gov/Veteran-Services/",
  "https://www.webbcountytx.gov/WCRVTP/",
];

async function main() {
  for (const url of URLS) {
    const r = await fetch(url, { headers: HEADERS, redirect: "follow" });
    const body = r.ok ? await r.text() : "";
    const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(body);
    const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g," ").replace(/&amp;/g,"&") : "";
    const vetCount = (body.toLowerCase().match(/veteran/g) || []).length;
    // Body-text excerpt that mentions veteran
    const idx = body.toLowerCase().indexOf("veteran");
    const snippet = idx >= 0 ? body.slice(Math.max(0,idx-50), idx+250).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim() : "";
    console.log(`${r.ok ? "OK ":"BAD"} ${r.status}  ${url}  →${r.url}`);
    console.log(`  title="${title}"  vetCount=${vetCount}`);
    if (snippet) console.log(`  snippet: "${snippet.slice(0,200)}"`);
  }
}
main();
