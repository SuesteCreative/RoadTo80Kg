import { and, eq, inArray, sql as dsql } from "drizzle-orm";
import { db } from "./client";
import { mealPlan, planItems, products, recipeItems } from "./schema";

export type DerivedItem = { productId: number; qtyG: number };

export async function deriveItemsFromPlan(
  uid: number,
  weekStart: string,
): Promise<DerivedItem[]> {
  const rows = await db
    .select({
      productId: recipeItems.productId,
      qtyG: recipeItems.qtyG,
      servings: mealPlan.servings,
    })
    .from(mealPlan)
    .innerJoin(recipeItems, eq(recipeItems.recipeId, mealPlan.recipeId))
    .where(and(eq(mealPlan.userId, uid), eq(mealPlan.weekStart, weekStart)));

  const byProduct = new Map<number, number>();
  for (const r of rows) {
    const servings = Number(r.servings);
    if (servings <= 0) continue;
    const add = Number(r.qtyG) * servings;
    byProduct.set(r.productId, (byProduct.get(r.productId) || 0) + add);
  }
  return Array.from(byProduct.entries()).map(([productId, qtyG]) => ({
    productId,
    qtyG: Math.round(qtyG * 100) / 100,
  }));
}

// Derives the list from meal_plan and upserts into plan_items with source=derived.
// Preserves manual rows. Derived rows are replaced with fresh qty values.
// Exclusion flags are kept so users don't lose their overrides.
export async function regenerateDerivedPlanItems(
  uid: number,
  weekStart: string,
): Promise<{ inserted: number; updated: number; removed: number }> {
  const derived = await deriveItemsFromPlan(uid, weekStart);
  const derivedIds = new Set(derived.map((d) => d.productId));

  // Fetch existing derived rows to reconcile
  const existing = await db
    .select()
    .from(planItems)
    .where(and(eq(planItems.userId, uid), eq(planItems.weekStart, weekStart), eq(planItems.source, "derived")));
  const existingMap = new Map(existing.map((r) => [r.productId, r]));

  let inserted = 0;
  let updated = 0;
  let removed = 0;

  for (const d of derived) {
    const row = existingMap.get(d.productId);
    if (row) {
      if (Number(row.qtyG) !== d.qtyG) {
        await db
          .update(planItems)
          .set({ qtyG: String(d.qtyG), updatedAt: new Date() })
          .where(eq(planItems.id, row.id));
        updated++;
      }
    } else {
      await db
        .insert(planItems)
        .values({
          userId: uid,
          weekStart,
          productId: d.productId,
          qtyG: String(d.qtyG),
          source: "derived",
        })
        .onConflictDoUpdate({
          target: [planItems.userId, planItems.weekStart, planItems.productId],
          set: { qtyG: String(d.qtyG), source: "derived", updatedAt: new Date() },
        });
      inserted++;
    }
  }

  // Remove derived rows for products that are no longer in the plan
  const staleDerived = existing.filter((r) => !derivedIds.has(r.productId));
  for (const r of staleDerived) {
    await db.delete(planItems).where(eq(planItems.id, r.id));
    removed++;
  }

  return { inserted, updated, removed };
}

// First-time sync: if the user has a meal plan for this week but no plan_items
// yet, seed them from the plan. Idempotent — safe to call on every page load.
export async function ensurePlanItemsForWeek(uid: number, weekStart: string): Promise<void> {
  const [hasAny] = await db
    .select({ n: dsql<number>`COUNT(*)::int` })
    .from(planItems)
    .where(and(eq(planItems.userId, uid), eq(planItems.weekStart, weekStart)));
  if (hasAny && Number(hasAny.n) > 0) return;

  const derived = await deriveItemsFromPlan(uid, weekStart);
  if (derived.length === 0) return;
  for (const d of derived) {
    await db
      .insert(planItems)
      .values({
        userId: uid,
        weekStart,
        productId: d.productId,
        qtyG: String(d.qtyG),
        source: "derived",
      })
      .onConflictDoNothing();
  }
}

export async function planProductIds(uid: number, weekStart: string): Promise<number[]> {
  const rows = await db
    .select({ productId: planItems.productId })
    .from(planItems)
    .where(
      and(eq(planItems.userId, uid), eq(planItems.weekStart, weekStart), eq(planItems.excluded, false)),
    );
  return rows.map((r) => r.productId);
}

export type ListedPlanItem = {
  id: number;
  productId: number;
  qtyG: number;
  source: "derived" | "manual";
  excluded: boolean;
  namePt: string;
  brand: string | null;
  category: string | null;
  packSizeG: number | null;
  unit: "g" | "ml" | "un";
  kcalPer100: number | null;
  proteinG: number | null;
  continenteUrl: string | null;
  needsReview: boolean;
  latestPrice: number | null;
  latestPricePerKg: number | null;
  promo: boolean;
  priceSource: "scrape" | "manual" | null;
};

export async function listPlanItems(
  uid: number,
  weekStart: string,
): Promise<ListedPlanItem[]> {
  const rows = await db
    .select({
      id: planItems.id,
      productId: planItems.productId,
      qtyG: planItems.qtyG,
      source: planItems.source,
      excluded: planItems.excluded,
      namePt: products.namePt,
      brand: products.brand,
      category: products.category,
      packSizeG: products.packSizeG,
      unit: products.unit,
      kcalPer100: products.kcalPer100,
      proteinG: products.proteinG,
      continenteUrl: products.continenteUrl,
      needsReview: products.needsReview,
    })
    .from(planItems)
    .innerJoin(products, eq(products.id, planItems.productId))
    .where(and(eq(planItems.userId, uid), eq(planItems.weekStart, weekStart)));

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.productId);
  const latest = await db.execute<{
    product_id: number;
    price_eur: string;
    price_per_kg_eur: string | null;
    promo: boolean;
    source: "scrape" | "manual";
  }>(dsql`
    SELECT DISTINCT ON (product_id)
      product_id, price_eur, price_per_kg_eur, promo, source
    FROM product_prices
    WHERE product_id IN (${dsql.join(ids.map((id) => dsql`${id}`), dsql`, `)})
    ORDER BY product_id, scraped_at DESC
  `);
  const priceBy = new Map<
    number,
    { priceEur: number; pricePerKgEur: number | null; promo: boolean; source: "scrape" | "manual" }
  >();
  for (const p of latest.rows) {
    priceBy.set(p.product_id, {
      priceEur: Number(p.price_eur),
      pricePerKgEur: p.price_per_kg_eur != null ? Number(p.price_per_kg_eur) : null,
      promo: p.promo,
      source: p.source,
    });
  }

  return rows.map((r) => {
    const price = priceBy.get(r.productId) ?? null;
    return {
      id: r.id,
      productId: r.productId,
      qtyG: Number(r.qtyG),
      source: r.source,
      excluded: r.excluded,
      namePt: r.namePt,
      brand: r.brand,
      category: r.category,
      packSizeG: r.packSizeG != null ? Number(r.packSizeG) : null,
      unit: r.unit,
      kcalPer100: r.kcalPer100 != null ? Number(r.kcalPer100) : null,
      proteinG: r.proteinG != null ? Number(r.proteinG) : null,
      continenteUrl: r.continenteUrl,
      needsReview: r.needsReview,
      latestPrice: price?.priceEur ?? null,
      latestPricePerKg: price?.pricePerKgEur ?? null,
      promo: price?.promo ?? false,
      priceSource: price?.source ?? null,
    };
  });
}

export async function availableToAdd(
  uid: number,
  weekStart: string,
  query: string,
): Promise<Array<{ id: number; namePt: string; category: string | null; brand: string | null }>> {
  const existing = await db
    .select({ productId: planItems.productId })
    .from(planItems)
    .where(and(eq(planItems.userId, uid), eq(planItems.weekStart, weekStart)));
  const existingIds = existing.map((r) => r.productId);

  const q = `%${query.trim()}%`;
  const rows = await db
    .select({
      id: products.id,
      namePt: products.namePt,
      category: products.category,
      brand: products.brand,
    })
    .from(products)
    .where(
      existingIds.length > 0
        ? and(
            dsql`${products.namePt} ILIKE ${q}`,
            dsql`${products.id} NOT IN (${dsql.join(
              existingIds.map((i) => dsql`${i}`),
              dsql`, `,
            )})`,
          )
        : dsql`${products.namePt} ILIKE ${q}`,
    )
    .limit(20);
  return rows;
}

export async function inArrayClause(ids: number[]) {
  return inArray(planItems.productId, ids);
}
