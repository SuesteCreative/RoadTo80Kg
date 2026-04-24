import type { RecipeTotals } from "./nutrition";

export type PlannableRecipe = {
  id: number;
  slug: string;
  namePt: string;
  mealType: "breakfast" | "lunch" | "dinner";
  totals: RecipeTotals;
};

export type DayPlan = {
  day: number;
  breakfast: PlannableRecipe;
  lunch: PlannableRecipe;
  dinner: PlannableRecipe;
  kcal: number;
  proteinG: number;
};

const MEAL_SPLIT = { breakfast: 0.25, lunch: 0.4, dinner: 0.35 } as const;

function pickClosest(pool: PlannableRecipe[], targetKcal: number, exclude: Set<number>) {
  let best: PlannableRecipe | null = null;
  let bestScore = Infinity;
  for (const r of pool) {
    if (exclude.has(r.id)) continue;
    const diff = Math.abs(r.totals.kcal - targetKcal);
    if (diff < bestScore) {
      bestScore = diff;
      best = r;
    }
  }
  return best;
}

export function planWeek(
  library: PlannableRecipe[],
  dailyKcal: number,
  minProteinG: number,
): DayPlan[] {
  const breakfasts = library.filter((r) => r.mealType === "breakfast");
  const lunches = library.filter((r) => r.mealType === "lunch");
  const dinners = library.filter((r) => r.mealType === "dinner");
  if (!breakfasts.length || !lunches.length || !dinners.length) {
    throw new Error("Recipe library incomplete: need at least 1 of each meal type");
  }

  const seenB = new Set<number>();
  const seenL = new Set<number>();
  const seenD = new Set<number>();
  const plan: DayPlan[] = [];

  for (let day = 0; day < 7; day++) {
    if (seenB.size >= breakfasts.length) seenB.clear();
    if (seenL.size >= lunches.length) seenL.clear();
    if (seenD.size >= dinners.length) seenD.clear();

    const b = pickClosest(breakfasts, dailyKcal * MEAL_SPLIT.breakfast, seenB)!;
    seenB.add(b.id);

    let l = pickClosest(lunches, dailyKcal * MEAL_SPLIT.lunch, seenL)!;
    seenL.add(l.id);

    let d = pickClosest(dinners, dailyKcal * MEAL_SPLIT.dinner, seenD)!;
    seenD.add(d.id);

    if (b.totals.proteinG + l.totals.proteinG + d.totals.proteinG < minProteinG) {
      const boost = [...lunches, ...dinners]
        .filter((r) => r.totals.proteinG > l.totals.proteinG)
        .sort((a, z) => z.totals.proteinG - a.totals.proteinG)[0];
      if (boost) {
        if (boost.mealType === "lunch") l = boost;
        else if (boost.mealType === "dinner") d = boost;
      }
    }

    plan.push({
      day,
      breakfast: b,
      lunch: l,
      dinner: d,
      kcal: b.totals.kcal + l.totals.kcal + d.totals.kcal,
      proteinG: b.totals.proteinG + l.totals.proteinG + d.totals.proteinG,
    });
  }
  return plan;
}
