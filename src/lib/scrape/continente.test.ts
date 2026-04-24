import { describe, it, expect } from "vitest";
import { parseProductHtml } from "./parser";

describe("parseProductHtml", () => {
  it("parses price from itemprop meta", () => {
    const html = `<div class="product-detail"><span itemprop="price" content="4.99">4,99 €</span></div>`;
    const r = parseProductHtml(html);
    expect("priceEur" in r && r.priceEur).toBe(4.99);
  });

  it("returns error when no price found", () => {
    const html = `<div>nada</div>`;
    const r = parseProductHtml(html);
    expect("error" in r).toBe(true);
  });
});
