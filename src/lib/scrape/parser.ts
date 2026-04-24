import * as cheerio from "cheerio";

export type Parsed = {
  priceEur: number;
  pricePerKgEur: number | null;
  promo: boolean;
};

export type SearchHit = {
  sku: string;
  name: string;
  brand: string | null;
  urlPath: string;
  priceEur: number;
  pricePerKgEur: number | null;
  promo: boolean;
};

export function parseSearchGrid(html: string): SearchHit[] {
  const $ = cheerio.load(html);
  const hits: SearchHit[] = [];

  $("[data-product-tile-impression]").each((_, el) => {
    const $el = $(el);
    const raw = $el.attr("data-product-tile-impression");
    if (!raw) return;

    let data: {
      id?: string;
      name?: string;
      brand?: string;
      price?: number;
    };
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }
    if (!data.id || typeof data.price !== "number") return;

    const $tile = $el.closest(".productTile, [data-idx]").length
      ? $el.closest(".productTile, [data-idx]")
      : $el;

    const href =
      $tile.find("a[href*='/produto/']").first().attr("href") ||
      $el.find("a[href*='/produto/']").first().attr("href") ||
      "";

    // Display price texts
    const primaryTxt = normText($tile.find(".pwc-tile--price-primary").first().text());
    const secondaryTxt = normText($tile.find(".pwc-tile--price-secondary").first().text());

    // If primary text says "/kg", the impression price IS per-kg → already captured
    // If secondary text has "/kg", parse it as pricePerKgEur
    let pricePerKgEur: number | null = null;
    if (/\/\s*kg/i.test(primaryTxt)) {
      pricePerKgEur = data.price;
    } else if (/\/\s*kg/i.test(secondaryTxt)) {
      pricePerKgEur = parseEur(secondaryTxt);
    }

    const promoBadge = $tile
      .find(".badge-text, .pwc-tile-badge, [class*='promo'], .callout")
      .first()
      .text()
      .trim();
    const promo = promoBadge.length > 0 && !/indispon/i.test(promoBadge);

    hits.push({
      sku: String(data.id),
      name: data.name ?? "",
      brand: data.brand ?? null,
      urlPath: href,
      priceEur: data.price,
      pricePerKgEur,
      promo,
    });
  });

  return hits;
}

export function parseProductHtml(html: string): Parsed | { error: string } {
  const hits = parseSearchGrid(html);
  if (hits.length === 0) return { error: "no product tiles found" };
  const h = hits[0];
  return { priceEur: h.priceEur, pricePerKgEur: h.pricePerKgEur, promo: h.promo };
}

function normText(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function parseEur(s: string): number | null {
  if (!s) return null;
  const cleaned = s.replace(/[^0-9,.]/g, "");
  const m = cleaned.match(/(\d+)[.,]?(\d*)/);
  if (!m) return null;
  const whole = m[1];
  const dec = (m[2] || "").padEnd(2, "0").slice(0, 2);
  const n = Number(dec ? `${whole}.${dec}` : whole);
  return Number.isFinite(n) && n > 0 ? n : null;
}
