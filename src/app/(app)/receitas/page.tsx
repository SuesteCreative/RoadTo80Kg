import { db } from "@/lib/db/client";
import { recipes, recipeItems, products } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { recipeTotalsPerServing } from "@/lib/calc/nutrition";
import { fmtKcal } from "@/lib/utils";

const MEAL_LABEL = { breakfast: "Pequeno-almoço", snack: "Snack", dinner: "Jantar (cozinhar p/ 2 refeições)" } as const;

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
    <div className="space-y-6">
      {(["breakfast", "snack", "dinner"] as const).map((mt) => (
        <section key={mt}>
          <h2 className="mb-3 text-lg font-semibold">{MEAL_LABEL[mt]}</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {grouped[mt].map((r) => {
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
                <Card key={r.id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      <Link href={`/receitas/${r.slug}`} className="hover:underline">{r.namePt}</Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{fmtKcal(totals.kcal)} · {totals.proteinG} g P · {r.prepMin} min</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
