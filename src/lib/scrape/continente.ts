import { request } from "undici";
import { db } from "@/lib/db/client";
import { products, productPrices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { parseSearchGrid, parseProductHtml, type SearchHit, type Parsed } from "./parser";

export { parseProductHtml, parseSearchGrid };
export type { SearchHit, Parsed };

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const SEARCH_URL =
  "https://www.continente.pt/on/demandware.store/Sites-continente-Site/pt_PT/Search-UpdateGrid";

const BASE = "https://www.continente.pt";

const THROTTLE_MS = 2500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchSearchGrid(query: string): Promise<SearchHit[] | { error: string }> {
  try {
    const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}`;
    const res = await request(url, {
      method: "GET",
      headers: {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.7",
        "Referer": `${BASE}/pesquisa/?q=${encodeURIComponent(query)}`,
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    if (res.statusCode !== 200) return { error: `HTTP ${res.statusCode}` };
    const html = await res.body.text();
    const hits = parseSearchGrid(html);
    if (hits.length === 0) return { error: "no tiles" };
    return hits;
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// Best match: exact SKU hit, otherwise highest token-overlap score with name
function bestMatch(hits: SearchHit[], targetSku: string | null, targetName: string): SearchHit | null {
  if (targetSku) {
    const exact = hits.find((h) => h.sku === targetSku);
    if (exact) return exact;
  }
  const tokens = normalize(targetName).split(" ").filter((t) => t.length > 2);
  let best: SearchHit | null = null;
  let bestScore = -1;
  for (const h of hits) {
    const cand = normalize(`${h.brand ?? ""} ${h.name}`);
    let score = 0;
    for (const t of tokens) if (cand.includes(t)) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = h;
    }
  }
  return bestScore > 0 ? best : hits[0] ?? null;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function scrapeAll(opts?: { productIds?: number[] }): Promise<{
  ok: number;
  errors: { sku: string; reason: string }[];
}> {
  let all = await db.select().from(products);
  if (opts?.productIds && opts.productIds.length > 0) {
    const set = new Set(opts.productIds);
    all = all.filter((p) => set.has(p.id));
  }
  const errors: { sku: string; reason: string }[] = [];
  let ok = 0;

  for (const p of all) {
    const sku = p.continenteSku ?? "";
    const query = sku || p.namePt;
    const res = await fetchSearchGrid(query);
    if ("error" in res) {
      errors.push({ sku: sku || p.namePt, reason: res.error });
      await db.update(products).set({ needsReview: true }).where(eq(products.id, p.id));
    } else {
      const match = bestMatch(res, sku || null, p.namePt);
      if (!match) {
        errors.push({ sku: sku || p.namePt, reason: "no match" });
        await db.update(products).set({ needsReview: true }).where(eq(products.id, p.id));
      } else {
        await db.insert(productPrices).values({
          productId: p.id,
          priceEur: String(match.priceEur),
          pricePerKgEur: match.pricePerKgEur != null ? String(match.pricePerKgEur) : null,
          promo: match.promo,
          source: "scrape",
        });
        const updates: Record<string, unknown> = {
          needsReview: false,
          lastSeenAt: new Date(),
        };
        if (!sku && match.sku) updates.continenteSku = match.sku;
        if (!p.continenteUrl && match.urlPath) {
          updates.continenteUrl = match.urlPath.startsWith("http") ? match.urlPath : `${BASE}${match.urlPath}`;
        }
        await db.update(products).set(updates).where(eq(products.id, p.id));
        ok++;
      }
    }
    await sleep(THROTTLE_MS);
  }
  return { ok, errors };
}

// Discovery: for products that don't have a real Continente SKU yet, query by name,
// pick best match, and persist sku + url so next scrape uses exact lookup.
import { sql as dsql } from "drizzle-orm";

export async function discoverSkus(): Promise<{
  matched: number;
  unmatched: { name: string; reason: string }[];
}> {
  // Wipe seed-fake SKUs so real ones don't collide with unique index.
  await db.update(products).set({ continenteSku: null, continenteUrl: null });

  const rows = await db.select().from(products);
  const unmatched: { name: string; reason: string }[] = [];
  let matched = 0;

  for (const p of rows) {
    const res = await fetchSearchGrid(p.namePt);
    if ("error" in res) {
      unmatched.push({ name: p.namePt, reason: res.error });
      await sleep(THROTTLE_MS);
      continue;
    }
    const pick = bestMatch(res, null, p.namePt);
    if (!pick) {
      unmatched.push({ name: p.namePt, reason: "no match" });
    } else {
      try {
        await db.execute(
          dsql`UPDATE products SET
            continente_sku = ${pick.sku},
            continente_url = ${pick.urlPath.startsWith("http") ? pick.urlPath : `${BASE}${pick.urlPath}`},
            needs_review = true
            WHERE id = ${p.id}`,
        );
        matched++;
      } catch (e) {
        unmatched.push({
          name: p.namePt,
          reason: `sku conflict (${pick.sku}): ${(e as Error).message.slice(0, 80)}`,
        });
      }
    }
    await sleep(THROTTLE_MS);
  }
  return { matched, unmatched };
}
