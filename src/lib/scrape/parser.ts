import * as cheerio from "cheerio";

export type Parsed = {
  priceEur: number;
  pricePerKgEur: number | null;
  promo: boolean;
};

export function parseProductHtml(html: string): Parsed | { error: string } {
  const $ = cheerio.load(html);

  const promoEl = $(".product-detail [class*='promo-price'], .product-tile-price [class*='promo-price']").first();
  const salesEl = $(".sales .value, .product-detail .value.price-value").first();
  const priceStr = (promoEl.text() || salesEl.text() || $("span[itemprop='price']").attr("content") || "").trim();

  const price = parsePriceEur(priceStr);
  if (price == null) return { error: "price selector missed" };

  const perKgText = $(".pwc-price, .product-detail [class*='per-unit'], .ccm-product-price-per-unit").first().text();
  const perKg = parsePriceEur(perKgText);

  const promo = !!$(".product-detail [class*='promo-flag'], .ccm-product-tile .callout").first().text().trim();

  return {
    priceEur: price,
    pricePerKgEur: perKg,
    promo,
  };
}

function parsePriceEur(s: string): number | null {
  const m = s.replace(/\s/g, "").match(/(\d+[.,]?\d*)/);
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}
