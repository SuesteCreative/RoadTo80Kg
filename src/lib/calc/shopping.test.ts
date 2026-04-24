import { describe, it, expect } from "vitest";
import { aggregateShopping } from "./shopping";

describe("aggregateShopping", () => {
  const products = [
    { id: 1, namePt: "Peito Frango", packSizeG: 500, latestPriceEur: 4.5 },
    { id: 2, namePt: "Arroz Basmati", packSizeG: 1000, latestPriceEur: 2.1 },
  ];
  const recipeItems = [
    { recipeId: 10, productId: 1, qtyG: 200 },
    { recipeId: 10, productId: 2, qtyG: 75 },
  ];

  it("sums recipe items across plans, scales by total servings, converts to packs", () => {
    // servings = total portions cooked (e.g. dinner for 2 × 2 days = 4)
    const plans = [
      { recipeId: 10, servings: 4 },
      { recipeId: 10, servings: 4 },
    ];
    const out = aggregateShopping(plans, recipeItems, products);
    const frango = out.find((x) => x.productId === 1)!;
    expect(frango.qtyG).toBe(200 * 4 + 200 * 4);
    expect(frango.qtyUnits).toBe(Math.ceil(1600 / 500));
    expect(frango.priceEur).toBe(Number((4.5 * 4).toFixed(2)));
  });
});
