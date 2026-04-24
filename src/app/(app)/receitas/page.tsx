import { db } from "@/lib/db/client";
import { recipes, recipeItems, products } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { recipeTotalsPerServing } from "@/lib/calc/nutrition";

const MEAL_LABEL = {
  breakfast: "Pequenos-almoços",
  snack: "Snacks",
  dinner: "Jantares",
} as const;
const MEAL_SUB = {
  breakfast: "primeira refeição",
  snack: "meio da tarde",
  dinner: "cozinhar a dobrar para almoço seguinte",
} as const;

export default async function ReceitasPage() {
  const rows = await db.select().from(recipes).orderBy(asc(recipes.mealType), asc(recipes.namePt));
  const items = await db
    .select({
      recipeId: recipeItems.recipeId,
      qtyG: recipeItems.qtyG,
      kcalPer100: products.kcalPer100,
      proteinG: products.proteinG,
      carbsG: products.carbsG,
      fatG: products.fatG,
    })
    .from(recipeItems)
    .innerJoin(products, eq(products.id, recipeItems.productId));

  const byRecipe = new Map<number, typeof items>();
  for (const it of items) {
    const arr = byRecipe.get(it.recipeId) ?? [];
    arr.push(it);
    byRecipe.set(it.recipeId, arr);
  }

  const grouped = { breakfast: [] as typeof rows, snack: [] as typeof rows, dinner: [] as typeof rows };
  for (const r of rows) {
    if (r.mealType === "lunch") continue;
    grouped[r.mealType].push(r);
  }

  return (
    <div className="space-y-10">
      <header className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Receituário — 30 fichas
        </p>
        <h1 className="font-display text-3xl font-medium tracking-tight">Receitas</h1>
      </header>

      {(["breakfast", "snack", "dinner"] as const).map((mt) => (
        <section key={mt} className="space-y-4">
          <div className="flex items-baseline justify-between border-b border-border pb-2">
            <h2 className="font-display text-xl font-medium">{MEAL_LABEL[mt]}</h2>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {MEAL_SUB[mt]} · {grouped[mt].length}
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {grouped[mt].map((r, idx) => {
              const ing = (byRecipe.get(r.id) ?? []).map((i) => ({
                qtyG: Number(i.qtyG),
                product: {
                  kcalPer100: Number(i.kcalPer100),
                  proteinG: Number(i.proteinG),
                  carbsG: Number(i.carbsG),
                  fatG: Number(i.fatG),
                },
              }));
              const totals = recipeTotalsPerServing(ing, r.servings);
              return (
                <Link
                  key={r.id}
                  href={`/receitas/${r.slug}`}
                  className="group block rounded-lg border border-border bg-card p-5 shadow-paper transition-all hover:border-primary/40 hover:shadow-[0_8px_32px_-12px_rgba(40,20,10,.18)]"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Nº {String(idx + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-1 font-display text-[1.15rem] font-medium leading-tight transition-colors group-hover:text-primary">
                    {r.namePt}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-3 font-mono text-xs text-muted-foreground">
                    <span className="tabular-nums text-foreground">{totals.kcal} kcal</span>
                    <span>·</span>
                    <span className="tabular-nums">{totals.proteinG} g P</span>
                    <span>·</span>
                    <span>{r.prepMin} min</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
