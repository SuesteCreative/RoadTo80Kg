export type MealPlanRow = {
  recipeId: number;
  servings: number;
};

export type RecipeItem = {
  recipeId: number;
  productId: number;
  qtyG: number;
};

export type ProductMeta = {
  id: number;
  namePt: string;
  packSizeG: number | null;
  latestPriceEur: number | null;
};

export type AggregatedItem = {
  productId: number;
  namePt: string;
  qtyG: number;
  qtyUnits: number;
  priceEur: number | null;
};

export function aggregateShopping(
  plans: MealPlanRow[],
  recipeItems: RecipeItem[],
  products: ProductMeta[],
  portionMultiplier = 1,
): AggregatedItem[] {
  // meal_plan.servings now stores total portions cooked (people × meals).
  // Kept portionMultiplier as an escape hatch but defaults to 1.
  const byProduct = new Map<number, number>();
  for (const row of plans) {
    const itemsForRecipe = recipeItems.filter((ri) => ri.recipeId === row.recipeId);
    for (const ri of itemsForRecipe) {
      const add = ri.qtyG * row.servings * portionMultiplier;
      byProduct.set(ri.productId, (byProduct.get(ri.productId) || 0) + add);
    }
  }

  const out: AggregatedItem[] = [];
  for (const [productId, qtyG] of byProduct) {
    const p = products.find((x) => x.id === productId);
    if (!p) continue;
    const pack = p.packSizeG ?? 0;
    const qtyUnits = pack > 0 ? Math.ceil(qtyG / pack) : 1;
    const priceEur =
      p.latestPriceEur != null ? Number((p.latestPriceEur * qtyUnits).toFixed(2)) : null;
    out.push({
      productId,
      namePt: p.namePt,
      qtyG: Math.round(qtyG),
      qtyUnits,
      priceEur,
    });
  }
  return out.sort((a, b) => a.namePt.localeCompare(b.namePt, "pt"));
}
