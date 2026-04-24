import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { db } from "../../src/lib/db/client";
import { products, recipes, recipeItems, workouts } from "../../src/lib/db/schema";
import { SEED_PRODUCTS } from "./data/products";
import { SEED_RECIPES } from "./data/recipes";
import { SEED_WORKOUTS } from "./data/workouts";
import { sql } from "drizzle-orm";

async function main() {
  console.log("→ Seeding products…");
  for (const p of SEED_PRODUCTS) {
    await db
      .insert(products)
      .values({
        continenteSku: p.sku,
        continenteUrl: `https://www.continente.pt/produto/${p.url}`,
        namePt: p.name,
        brand: p.brand ?? null,
        category: p.category,
        kcalPer100: String(p.kcal),
        proteinG: String(p.protein),
        carbsG: String(p.carbs),
        fatG: String(p.fat),
        fiberG: p.fiber != null ? String(p.fiber) : null,
        unit: p.unit,
        packSizeG: String(p.packSizeG),
        needsReview: true,
      })
      .onConflictDoUpdate({
        target: products.continenteSku,
        set: {
          namePt: p.name,
          category: p.category,
          kcalPer100: String(p.kcal),
          proteinG: String(p.protein),
          carbsG: String(p.carbs),
          fatG: String(p.fat),
          unit: p.unit,
          packSizeG: String(p.packSizeG),
        },
      });
  }

  const skuToId = new Map<string, number>();
  const allProducts = await db.select({ id: products.id, sku: products.continenteSku }).from(products);
  for (const r of allProducts) if (r.sku) skuToId.set(r.sku, r.id);

  console.log("→ Seeding recipes…");
  for (const r of SEED_RECIPES) {
    const [inserted] = await db
      .insert(recipes)
      .values({
        slug: r.slug,
        namePt: r.name,
        mealType: r.mealType,
        servings: r.servings,
        prepMin: r.prepMin,
        instructionsMd: r.instructions,
        tags: r.tags ?? [],
      })
      .onConflictDoUpdate({
        target: recipes.slug,
        set: {
          namePt: r.name,
          mealType: r.mealType,
          servings: r.servings,
          prepMin: r.prepMin,
          instructionsMd: r.instructions,
          tags: r.tags ?? [],
        },
      })
      .returning({ id: recipes.id });

    await db.execute(sql`DELETE FROM recipe_items WHERE recipe_id = ${inserted.id}`);
    for (const item of r.items) {
      const productId = skuToId.get(item.sku);
      if (!productId) {
        console.warn(`  ⚠ skipped ${r.slug} item — unknown SKU ${item.sku}`);
        continue;
      }
      await db.insert(recipeItems).values({
        recipeId: inserted.id,
        productId,
        qtyG: String(item.qtyG),
      });
    }
  }

  console.log("→ Seeding workouts…");
  for (const w of SEED_WORKOUTS) {
    await db
      .insert(workouts)
      .values({
        slug: w.slug,
        namePt: w.name,
        mode: w.mode,
        durationMin: w.durationMin,
        instructionsMd: w.instructions,
        equipment: w.equipment ?? [],
      })
      .onConflictDoUpdate({
        target: workouts.slug,
        set: {
          namePt: w.name,
          mode: w.mode,
          durationMin: w.durationMin,
          instructionsMd: w.instructions,
          equipment: w.equipment ?? [],
        },
      });
  }

  console.log("✓ Seed done.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
