import { db } from "@/lib/db/client";
import { recipes, recipeItems, products, mealPlan } from "@/lib/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { recipeTotalsPerServing } from "@/lib/calc/nutrition";
import { auth } from "@/lib/auth/config";
import { weekStartISO } from "@/lib/calc/date";

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

export default async function ReceitasPage({
  searchParams,
}: {
  searchParams: Promise<{ todas?: string }>;
}) {
  const sp = await searchParams;
  const showAll = sp.todas === "1";

  const session = await auth();
  const uid = Number(session!.user.id);
  const ws = weekStartISO();

  const planRecipeIds = await db
    .selectDistinct({ recipeId: mealPlan.recipeId })
    .from(mealPlan)
    .where(and(eq(mealPlan.userId, uid), eq(mealPlan.weekStart, ws)));
  const inPlanIds = planRecipeIds.map((r) => r.recipeId);

  const rows = showAll
    ? await db.select().from(recipes).orderBy(asc(recipes.mealType), asc(recipes.namePt))
    : inPlanIds.length === 0
      ? []
      : await db
          .select()
          .from(recipes)
          .where(inArray(recipes.id, inPlanIds))
          .orderBy(asc(recipes.mealType), asc(recipes.namePt));

  const items =
    rows.length === 0
      ? []
      : await db
          .select({
            recipeId: recipeItems.recipeId,
            qtyG: recipeItems.qtyG,
            kcalPer100: products.kcalPer100,
            proteinG: products.proteinG,
            carbsG: products.carbsG,
            fatG: products.fatG,
          })
          .from(recipeItems)
          .innerJoin(products, eq(products.id, recipeItems.productId))
          .where(
            inArray(
              recipeItems.recipeId,
              rows.map((r) => r.id),
            ),
          );

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
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.1em] font-medium text-muted-foreground">
            {showAll ? "Receituário completo" : `Receitas desta semana — ${ws}`}
          </p>
          <h1 className="font-display text-3xl font-medium tracking-tight">Receitas</h1>
          <p className="text-sm text-muted-foreground">
            {showAll
              ? `${rows.length} fichas no catálogo.`
              : `${rows.length} receitas no plano actual.`}
          </p>
        </div>
        <Link
          href={showAll ? "/receitas" : "/receitas?todas=1"}
          className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground hover:text-primary"
        >
          {showAll ? "só do plano →" : "ver todas →"}
        </Link>
      </header>

      {rows.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Sem receitas no plano.{" "}
          <Link
            href="/refeicoes"
            className="underline decoration-primary/40 underline-offset-4 hover:text-primary"
          >
            Regenerar semana em Refeições
          </Link>
          .
        </p>
      )}

      {(["breakfast", "snack", "dinner"] as const).map((mt) => {
        if (grouped[mt].length === 0) return null;
        return (
          <section key={mt} className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-border pb-2">
              <h2 className="font-display text-xl font-medium">{MEAL_LABEL[mt]}</h2>
              <span className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
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
                    <p className="text-[11px] uppercase tracking-[0.08em] font-medium text-muted-foreground">
                      Nº {String(idx + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-1 font-display text-[1.15rem] font-medium leading-tight transition-colors group-hover:text-primary">
                      {r.namePt}
                    </h3>
                    <div className="mt-3 flex items-baseline gap-3 text-xs text-muted-foreground">
                      <span className="tabular-nums text-foreground font-semibold">
                        {totals.kcal} kcal
                      </span>
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
        );
      })}
    </div>
  );
}
