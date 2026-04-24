"use server";
import { db } from "@/lib/db/client";
import { planItems, productPrices, products, scrapeRuns } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { scrapeAll } from "@/lib/scrape/continente";
import { weekStartISO } from "@/lib/calc/date";
import {
  planProductIds,
  regenerateDerivedPlanItems,
  availableToAdd,
} from "@/lib/db/plan-items";

const manualSchema = z.object({
  productId: z.coerce.number().int().positive(),
  priceEur: z.coerce.number().positive(),
});

export async function saveManualPrice(formData: FormData) {
  const { productId, priceEur } = manualSchema.parse(Object.fromEntries(formData));
  const [p] = await db
    .select({ packSizeG: products.packSizeG, unit: products.unit })
    .from(products)
    .where(eq(products.id, productId));
  const pack = p ? Number(p.packSizeG) : 0;
  const pricePerKg =
    p && pack > 0 && p.unit !== "un" ? Number(((priceEur / pack) * 1000).toFixed(2)) : null;
  await db.insert(productPrices).values({
    productId,
    priceEur: String(priceEur),
    pricePerKgEur: pricePerKg != null ? String(pricePerKg) : null,
    source: "manual",
  });
  await db.update(products).set({ needsReview: false, lastSeenAt: new Date() }).where(eq(products.id, productId));
  revalidatePath("/produtos");
}

export async function triggerScrape() {
  const session = await auth();
  const uid = Number(session!.user.id);
  const ws = weekStartISO();
  const ids = await planProductIds(uid, ws);

  const [run] = await db
    .insert(scrapeRuns)
    .values({ status: "ok" })
    .returning();
  const result = await scrapeAll({ productIds: ids });
  await db
    .update(scrapeRuns)
    .set({
      finishedAt: new Date(),
      status: result.errors.length === 0 ? "ok" : result.ok > 0 ? "partial" : "failed",
      productsFound: result.ok,
      errors: result.errors,
    })
    .where(eq(scrapeRuns.id, run.id));
  revalidatePath("/produtos");
  return result;
}

export async function updateItemQty(planItemId: number, qtyG: number) {
  const session = await auth();
  const uid = Number(session!.user.id);
  const clamped = Math.max(0, Math.round(qtyG));
  await db
    .update(planItems)
    .set({ qtyG: String(clamped), updatedAt: new Date() })
    .where(and(eq(planItems.id, planItemId), eq(planItems.userId, uid)));
  revalidatePath("/produtos");
  return { qtyG: clamped };
}

export async function toggleExcluded(planItemId: number) {
  const session = await auth();
  const uid = Number(session!.user.id);
  const [row] = await db
    .select({ excluded: planItems.excluded })
    .from(planItems)
    .where(and(eq(planItems.id, planItemId), eq(planItems.userId, uid)));
  if (!row) return;
  await db
    .update(planItems)
    .set({ excluded: !row.excluded, updatedAt: new Date() })
    .where(eq(planItems.id, planItemId));
  revalidatePath("/produtos");
}

export async function removeItem(planItemId: number) {
  const session = await auth();
  const uid = Number(session!.user.id);
  await db
    .delete(planItems)
    .where(and(eq(planItems.id, planItemId), eq(planItems.userId, uid)));
  revalidatePath("/produtos");
}

export async function addManualItem(productId: number, qtyG: number) {
  const session = await auth();
  const uid = Number(session!.user.id);
  const ws = weekStartISO();
  await db
    .insert(planItems)
    .values({
      userId: uid,
      weekStart: ws,
      productId,
      qtyG: String(Math.max(1, Math.round(qtyG))),
      source: "manual",
    })
    .onConflictDoUpdate({
      target: [planItems.userId, planItems.weekStart, planItems.productId],
      set: {
        qtyG: String(Math.max(1, Math.round(qtyG))),
        excluded: false,
        updatedAt: new Date(),
      },
    });
  revalidatePath("/produtos");
}

export async function regeneratePlan() {
  const session = await auth();
  const uid = Number(session!.user.id);
  const ws = weekStartISO();
  const r = await regenerateDerivedPlanItems(uid, ws);
  revalidatePath("/produtos");
  return r;
}

export async function searchProducts(query: string) {
  const session = await auth();
  const uid = Number(session!.user.id);
  const ws = weekStartISO();
  if (!query.trim()) return [];
  return availableToAdd(uid, ws, query);
}
