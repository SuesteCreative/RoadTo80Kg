import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import {
  mealPlan,
  profiles,
  recipes,
  recipeItems,
  products,
  weightLogs,
} from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { weekStartISO, dayLabelPt } from "@/lib/calc/date";
import { computeTargets } from "@/lib/calc/tdee";
import { recipeTotalsPerServing } from "@/lib/calc/nutrition";
import { planWeek, type PlannableRecipe } from "@/lib/calc/meal-planner";
import { revalidatePath } from "next/cache";
import { fmtKcal } from "@/lib/utils";

const MEAL_LABEL = { breakfast: "Pequeno-almoço", lunch: "Almoço", dinner: "Jantar" } as const;
const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;

export default async function RefeicoesPage() {
  const session = await auth();
  const uid = Number(session!.user.id);
  const ws = weekStartISO();

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, uid));
  const [latest] = await db
    .select()
    .from(weightLogs)
    .where(eq(weightLogs.userId, uid))
    .orderBy(desc(weightLogs.loggedOn))
    .limit(1);

  if (!profile || !latest) {
    return (
      <p className="text-sm">
        Falta perfil ou peso inicial.{" "}
        <Link href="/perfil" className="underline">Configurar →</Link>
      </p>
    );
  }
  const t = computeTargets({
    sex: profile.sex,
    heightCm: Number(profile.heightCm),
    birthdate: profile.birthdate,
    weightKg: Number(latest.weightKg),
    activity: profile.activityLevel,
    targetWeightKg: Number(profile.targetWeightKg),
    deficitKcal: profile.deficitKcal,
  });

  const current = await db
    .select({
      day: mealPlan.day,
      mealType: mealPlan.mealType,
      recipeId: mealPlan.recipeId,
      recipeSlug: recipes.slug,
      recipeName: recipes.namePt,
    })
    .from(mealPlan)
    .innerJoin(recipes, eq(recipes.id, mealPlan.recipeId))
    .where(and(eq(mealPlan.userId, uid), eq(mealPlan.weekStart, ws)));

  async function regenerate() {
    "use server";
    const allRecipes = await db.select().from(recipes);
    const allItems = await db
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

    const library: PlannableRecipe[] = allRecipes.map((r) => {
      const ings = allItems
        .filter((i) => i.recipeId === r.id)
        .map((i) => ({
          qtyG: Number(i.qtyG),
          product: {
            kcalPer100: Number(i.kcalPer100),
            proteinG: Number(i.proteinG),
            carbsG: Number(i.carbsG),
            fatG: Number(i.fatG),
          },
        }));
      return {
        id: r.id,
        slug: r.slug,
        namePt: r.namePt,
        mealType: r.mealType,
        totals: recipeTotalsPerServing(ings, r.servings),
      };
    });
    const plan = planWeek(library, t.targetKcal, Math.round(t.proteinG * 0.9));

    await db
      .delete(mealPlan)
      .where(and(eq(mealPlan.userId, uid), eq(mealPlan.weekStart, ws)));

    for (const day of plan) {
      for (const mt of MEAL_TYPES) {
        await db.insert(mealPlan).values({
          userId: uid,
          weekStart: ws,
          day: day.day,
          mealType: mt,
          recipeId: day[mt].id,
          servings: "1",
        });
      }
    }
    revalidatePath("/refeicoes");
    revalidatePath("/");
  }

  const byCell = new Map<string, (typeof current)[number]>();
  for (const row of current) byCell.set(`${row.day}-${row.mealType}`, row);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Semana {ws} — alvo {fmtKcal(t.targetKcal)} / dia</CardTitle>
          <form action={regenerate}>
            <Button type="submit" size="sm">Regenerar semana</Button>
          </form>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="p-2 text-left font-medium"></th>
                {Array.from({ length: 7 }).map((_, d) => (
                  <th key={d} className="p-2 text-left font-medium">{dayLabelPt(d)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEAL_TYPES.map((mt) => (
                <tr key={mt} className="border-b last:border-b-0">
                  <td className="p-2 align-top text-sm text-muted-foreground">{MEAL_LABEL[mt]}</td>
                  {Array.from({ length: 7 }).map((_, d) => {
                    const cell = byCell.get(`${d}-${mt}`);
                    return (
                      <td key={d} className="p-2 align-top">
                        {cell ? (
                          <Link href={`/receitas/${cell.recipeSlug}`} className="text-xs hover:underline">
                            {cell.recipeName}
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
