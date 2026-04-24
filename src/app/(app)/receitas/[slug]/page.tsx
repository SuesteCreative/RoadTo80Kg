import { db } from "@/lib/db/client";
import { recipes, recipeItems, products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { recipeTotalsPerServing } from "@/lib/calc/nutrition";
import { fmtKcal } from "@/lib/utils";

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
    <div className="grid gap-4 md:grid-cols-[1fr_1.5fr]">
      <Card>
        <CardHeader><CardTitle>Macros por dose</CardTitle></CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{fmtKcal(totals.kcal)}</p>
          <p className="mt-2 text-sm">P: {totals.proteinG} g · C: {totals.carbsG} g · G: {totals.fatG} g</p>
          <p className="mt-3 text-sm text-muted-foreground">{r.prepMin} min · {r.servings} dose(s)</p>

          <h3 className="mt-6 mb-2 font-medium">Ingredientes</h3>
          <ul className="divide-y text-sm">
            {ing.map((i, idx) => (
              <li key={idx} className="flex justify-between py-1.5">
                <span>{i.namePt}</span>
                <span className="tabular-nums text-muted-foreground">{Number(i.qtyG)} g</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{r.namePt}</CardTitle></CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{r.instructionsMd}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
