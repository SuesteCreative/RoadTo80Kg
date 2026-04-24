import { describe, it, expect } from "vitest";
import { parseProductHtml } from "./parser";

describe("parseProductHtml", () => {
  it("parses first tile from Search-UpdateGrid fragment", () => {
    const impression = JSON.stringify({
      name: "Banana da Madeira Continente",
      id: "2076480",
      price: 3.83,
      brand: "Continente",
    });
    const html = `
      <div class="productTile" data-idx="1">
        <div class="product-tile pid-2076480"
             data-product-tile-impression='${impression.replace(/"/g, "&quot;")}'>
          <a href="/produto/banana-da-madeira-continente-continente-2076480.html">link</a>
          <span class="pwc-tile--price-primary">3,83<span class="decimalPrice">,19€/kg</span></span>
        </div>
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
