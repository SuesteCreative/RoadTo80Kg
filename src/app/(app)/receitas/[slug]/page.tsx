import { db } from "@/lib/db/client";
import { recipes, recipeItems, products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { recipeTotalsPerServing } from "@/lib/calc/nutrition";
import Link from "next/link";
import AiAdjustRecipe from "./ai-adjust";

const MEAL_LABEL: Record<string, string> = {
  breakfast: "Pequeno-almoço",
  snack: "Snack",
  dinner: "Jantar",
  lunch: "Almoço",
};

export default async function ReceitaDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [r] = await db.select().from(recipes).where(eq(recipes.slug, slug));
  if (!r) notFound();

  const ing = await db
    .select({
      qtyG: recipeItems.qtyG,
      namePt: products.namePt,
      kcalPer100: products.kcalPer100,
      proteinG: products.proteinG,
      carbsG: products.carbsG,
      fatG: products.fatG,
    })
    .from(recipeItems)
    .innerJoin(products, eq(products.id, recipeItems.productId))
    .where(eq(recipeItems.recipeId, r.id));

  const totals = recipeTotalsPerServing(
    ing.map((i) => ({
      qtyG: Number(i.qtyG),
      product: {
        kcalPer100: Number(i.kcalPer100),
        proteinG: Number(i.proteinG),
        carbsG: Number(i.carbsG),
        fatG: Number(i.fatG),
      },
    })),
    r.servings,
  );

  return (
    <article className="space-y-8">
      <Link
        href="/receitas"
        className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.1em] font-medium text-muted-foreground hover:text-primary"
      >
        ← receituário
      </Link>

      <header className="space-y-3 border-b border-border pb-6">
        <div className="flex items-start justify-between gap-4">
          <p className="text-[11px] uppercase tracking-[0.1em] font-medium text-muted-foreground">
            {MEAL_LABEL[r.mealType] ?? r.mealType} · {r.prepMin} min · {r.servings} dose
            {r.servings > 1 ? "s" : ""}
          </p>
          <AiAdjustRecipe slug={r.slug} />
        </div>
        <h1 className="font-display text-4xl font-medium leading-tight tracking-tight md:text-5xl">
          {r.namePt}
        </h1>
        <div className="flex flex-wrap items-baseline gap-4 pt-2 font-mono text-sm">
          <span>
            <span className="tabular-nums font-semibold">{totals.kcal}</span>
            <span className="ml-1 text-muted-foreground">kcal</span>
          </span>
          <span className="text-border">·</span>
          <span>
            <span className="tabular-nums">{totals.proteinG}</span>
            <span className="ml-1 text-muted-foreground">g P</span>
          </span>
          <span>
            <span className="tabular-nums">{totals.carbsG}</span>
            <span className="ml-1 text-muted-foreground">g C</span>
          </span>
          <span>
            <span className="tabular-nums">{totals.fatG}</span>
            <span className="ml-1 text-muted-foreground">g G</span>
          </span>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[minmax(0,.75fr)_minmax(0,1fr)]">
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-3 font-display text-lg font-medium">Ingredientes</h2>
            <ul className="divide-y divide-border/60">
              {ing.map((i, idx) => (
                <li
                  key={idx}
                  className="flex items-baseline justify-between gap-4 py-2 font-mono text-sm"
                >
                  <span className="font-sans">{i.namePt}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {Number(i.qtyG)} g
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-3 font-display text-lg font-medium">Preparação</h2>
            <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed">
              {r.instructionsMd}
            </pre>
          </CardContent>
        </Card>
      </div>
    </article>
  );
}
