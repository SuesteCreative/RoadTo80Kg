import { neon } from "@neondatabase/serverless";

// Collapses duplicate ai-ajustada recipes (same name_pt + meal_type + identical
// ingredient list) into a single canonical row, repoints meal_plan + plan_items
// consumers, and deletes the duplicates. Safe to run multiple times.

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  const allAi = (await sql`
    SELECT r.id, r.slug, r.name_pt, r.meal_type
    FROM recipes r
    WHERE 'ai-ajustada' = ANY(r.tags)
    ORDER BY r.id ASC
  `) as Array<{ id: number; slug: string; name_pt: string; meal_type: string }>;

  if (allAi.length === 0) {
    console.log("Sem receitas AI. Nada a limpar.");
    return;
  }

  const items = (await sql`
    SELECT recipe_id, product_id, qty_g
    FROM recipe_items
    WHERE recipe_id = ANY(${allAi.map((r) => r.id)})
    ORDER BY recipe_id, product_id
  `) as Array<{ recipe_id: number; product_id: number; qty_g: string }>;

  const itemsByRecipe = new Map<number, Array<{ productId: number; qtyG: number }>>();
  for (const r of allAi) itemsByRecipe.set(r.id, []);
  for (const it of items) {
    itemsByRecipe.get(it.recipe_id)!.push({
      productId: it.product_id,
      qtyG: Math.round(Number(it.qty_g)),
    });
  }

  function canonicalKey(r: typeof allAi[number]) {
    const its = itemsByRecipe
      .get(r.id)!
      .slice()
      .sort((a, b) => a.productId - b.productId)
      .map((i) => `${i.productId}:${i.qtyG}`)
      .join("|");
    return `${r.meal_type}::${r.name_pt.trim().toLowerCase()}::${its}`;
  }

  const groups = new Map<string, typeof allAi>();
  for (const r of allAi) {
    const k = canonicalKey(r);
    const arr = groups.get(k) ?? [];
    arr.push(r);
    groups.set(k, arr);
  }

  let repointed = 0;
  let deleted = 0;
  for (const [, rows] of groups) {
    if (rows.length < 2) continue;
    const canonical = rows[0];
    const duplicateIds = rows.slice(1).map((r) => r.id);

    const mp = await sql`
      UPDATE meal_plan SET recipe_id = ${canonical.id}
      WHERE recipe_id = ANY(${duplicateIds})
      RETURNING id
    ` as Array<{ id: number }>;
    repointed += mp.length;

    await sql`DELETE FROM recipe_items WHERE recipe_id = ANY(${duplicateIds})`;
    const del = await sql`
      DELETE FROM recipes WHERE id = ANY(${duplicateIds}) RETURNING id
    ` as Array<{ id: number }>;
    deleted += del.length;

    console.log(
      `✓ "${canonical.name_pt}" (${canonical.meal_type}) — manteve id=${canonical.id}, apagou ${duplicateIds.length} duplicadas.`,
    );
  }

  console.log(`\n${deleted} receitas removidas · ${repointed} meal_plan repointed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
