import { request } from "undici";
import { db } from "@/lib/db/client";
import { products, productPrices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { parseProductHtml, type Parsed } from "./parser";

export { parseProductHtml };

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const THROTTLE_MS = 3000;

export async function fetchAndParse(url: string): Promise<Parsed | { error: string }> {
  try {
    const res = await request(url, {
      method: "GET",
      headers: {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.7",
      },
    });
    if (res.statusCode !== 200) {
      return { error: `HTTP ${res.statusCode}` };
    }
    const html = await res.body.text();
    return parseProductHtml(html);
  } catch (e) {
    return { error: (e as Error).message };
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function scrapeAll(): Promise<{ ok: number; errors: { sku: string; reason: string }[] }> {
  const all = await db.select().from(products);
  const errors: { sku: string; reason: string }[] = [];
  let ok = 0;

  for (const p of all) {
    if (!p.continenteUrl || !p.continenteSku) continue;
    const res = await fetchAndParse(p.continenteUrl);
    if ("error" in res) {
      errors.push({ sku: p.continenteSku, reason: res.error });
      await db.update(products).set({ needsReview: true }).where(eq(products.id, p.id));
    } else {
      await db.insert(productPrices).values({
        productId: p.id,
        priceEur: String(res.priceEur),
        pricePerKgEur: res.pricePerKgEur != null ? String(res.pricePerKgEur) : null,
        promo: res.promo,
        source: "scrape",
      });
      await db.update(products).set({ needsReview: false, lastSeenAt: new Date() }).where(eq(products.id, p.id));
      ok++;
    }
    await sleep(THROTTLE_MS);
  }
  return { ok, errors };
}
