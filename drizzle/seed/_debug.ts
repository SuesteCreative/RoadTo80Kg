import { request } from "undici";
import { parseSearchGrid } from "../../src/lib/scrape/parser";

async function main() {
  const q = process.argv[2] ?? "banana";
  const res = await request(
    `https://www.continente.pt/on/demandware.store/Sites-continente-Site/pt_PT/Search-UpdateGrid?q=${encodeURIComponent(q)}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
        "X-Requested-With": "XMLHttpRequest",
      },
    },
  );
  const html = await res.body.text();
  const hits = parseSearchGrid(html);
  console.log(`status ${res.statusCode} — ${hits.length} tiles`);
  console.log(JSON.stringify(hits.slice(0, 5), null, 2));
  process.exit(0);
}
main();
