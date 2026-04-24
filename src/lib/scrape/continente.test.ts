import { describe, it, expect } from "vitest";
import { parseProductHtml } from "./parser";

describe("parseProductHtml", () => {
  it("parses first tile from Search-UpdateGrid fragment", () => {
    const html = `
      <div class="product-tile" data-pid="2076480">
        <span class="pwc-tile-product-name">Banana da Madeira</span>
        <span class="pwc-tile-brand">Continente</span>
        <a class="pwc-tile-link" href="/produto/banana-da-madeira-continente-continente-2076480.html">link</a>
        <span class="pwc-tile-price-primary">3,83 €</span>
        <span class="pwc-tile-price-secondary">3,19 €/kg</span>
      </div>`;
    const r = parseProductHtml(html);
    expect("priceEur" in r && r.priceEur).toBe(3.83);
  });

  it("returns error when no price found", () => {
    const html = `<div>nada</div>`;
    const r = parseProductHtml(html);
    expect("error" in r).toBe(true);
  });
});
