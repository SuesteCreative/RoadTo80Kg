type ProductNut = {
  kcalPer100: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
};
type Item = { qtyG: number; product: ProductNut };

export type RecipeTotals = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export function recipeTotalsPerServing(
  items: Item[],
  servings: number,
): RecipeTotals {
  let kcal = 0;
  let p = 0;
  let c = 0;
  let f = 0;
  for (const it of items) {
    const ratio = it.qtyG / 100;
    kcal += (Number(it.product.kcalPer100) || 0) * ratio;
    p += (Number(it.product.proteinG) || 0) * ratio;
    c += (Number(it.product.carbsG) || 0) * ratio;
    f += (Number(it.product.fatG) || 0) * ratio;
  }
  const s = Math.max(1, servings);
  return {
    kcal: Math.round(kcal / s),
    proteinG: Math.round(p / s),
    carbsG: Math.round(c / s),
    fatG: Math.round(f / s),
  };
}
