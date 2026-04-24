import type { RecipeTotals } from "./nutrition";

export type PlannableRecipe = {
  id: number;
  slug: string;
  namePt: string;
  mealType: "breakfast" | "snack" | "lunch" | "dinner";
  totals: RecipeTotals;
};

export type DayPlan = {
  day: number;
  breakfast: PlannableRecipe;
  snack: PlannableRecipe;
  lunch: PlannableRecipe;
  dinner: PlannableRecipe;
  kcal: number;
  proteinG: number;
};

const MEAL_SPLIT = {
  breakfast: 0.25,
  snack: 0.13,
  dinner: 0.32,
} as const;

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
  _minProteinG: number,
): DayPlan[] {
  const breakfasts = library.filter((r) => r.mealType === "breakfast");
  const snacks = library.filter((r) => r.mealType === "snack");
  const dinners = library.filter((r) => r.mealType === "dinner");
  if (!breakfasts.length || !dinners.length || !snacks.length) {
    throw new Error("Receitário incompleto: preciso de pequeno-almoços, snacks e jantares.");
  }

  const seenB = new Set<number>();
  const seenS = new Set<number>();
  const seenD = new Set<number>();

  const dinnerPicks: PlannableRecipe[] = [];
  for (let day = 0; day < 7; day++) {
    if (seenD.size >= dinners.length) seenD.clear();
    const d = pickClosest(dinners, dailyKcal * MEAL_SPLIT.dinner, seenD)!;
    seenD.add(d.id);
    dinnerPicks.push(d);
  }

  const plan: DayPlan[] = [];
  for (let day = 0; day < 7; day++) {
    if (seenB.size >= breakfasts.length) seenB.clear();
    if (seenS.size >= snacks.length) seenS.clear();
    const b = pickClosest(breakfasts, dailyKcal * MEAL_SPLIT.breakfast, seenB)!;
    seenB.add(b.id);
    const s = pickClosest(snacks, dailyKcal * MEAL_SPLIT.snack, seenS)!;
    seenS.add(s.id);
    const d = dinnerPicks[day];
    const lunch = dinnerPicks[(day + 6) % 7]; // yesterday's dinner = leftovers

    plan.push({
      day,
      breakfast: b,
      snack: s,
      lunch,
      dinner: d,
      kcal: b.totals.kcal + s.totals.kcal + lunch.totals.kcal + d.totals.kcal,
      proteinG: b.totals.proteinG + s.totals.proteinG + lunch.totals.proteinG + d.totals.proteinG,
    });
  }
  return plan;
}
