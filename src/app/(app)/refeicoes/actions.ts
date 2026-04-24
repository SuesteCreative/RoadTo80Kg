"use server";
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
import { and, desc, eq, sql as dsql } from "drizzle-orm";
import { weekStartISO } from "@/lib/calc/date";
import { computeTargets } from "@/lib/calc/tdee";
import { recipeTotalsPerServing } from "@/lib/calc/nutrition";
import { planWeek, type PlannableRecipe } from "@/lib/calc/meal-planner";
import { revalidatePath } from "next/cache";

const MEAL_TYPES = ["breakfast", "snack", "lunch", "dinner"] as const;

export async function regenerateWeek() {
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
  if (!profile || !latest) throw new Error("Falta perfil ou peso inicial.");

  const t = computeTargets({
    sex: profile.sex,
    heightCm: Number(profile.heightCm),
    birthdate: profile.birthdate,
    weightKg: Number(latest.weightKg),
    activity: profile.activityLevel,
    targetWeightKg: Number(profile.targetWeightKg),
    deficitKcal: profile.deficitKcal,
  });

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

  await db.delete(mealPlan).where(and(eq(mealPlan.userId, uid), eq(mealPlan.weekStart, ws)));

  // Servings = nº total de refeições cozinhadas nesse slot (pessoas × dias).
  // Default: jantar 4 (2 hoje + 2 sobras para almoço), pa/snack 2 (1 por pessoa),
  // almoço 0 (sai das sobras do jantar anterior).
  for (const day of plan) {
    for (const mt of MEAL_TYPES) {
      const servings = mt === "dinner" ? "4" : mt === "lunch" ? "0" : "2";
      await db.insert(mealPlan).values({
        userId: uid,
        weekStart: ws,
        day: day.day,
        mealType: mt,
        recipeId: day[mt].id,
        servings,
      });
    }
  }

  revalidatePath("/refeicoes");
  revalidatePath("/");

  return {
    days: plan.length,
    avgKcal: Math.round(plan.reduce((s, d) => s + d.kcal, 0) / plan.length),
  };
}

export async function updateSlotServings(
  day: number,
  mealType: "breakfast" | "snack" | "lunch" | "dinner",
  servings: number,
) {
  const session = await auth();
  const uid = Number(session!.user.id);
  const ws = weekStartISO();
  const clamped = Math.max(0, Math.min(20, Math.round(servings)));
  await db.execute(dsql`
    UPDATE meal_plan SET servings = ${String(clamped)}
    WHERE user_id = ${uid} AND week_start = ${ws}
      AND day = ${day} AND meal_type = ${mealType}
  `);
  revalidatePath("/refeicoes");
  return { servings: clamped };
}
