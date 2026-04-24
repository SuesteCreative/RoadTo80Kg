"use server";
import { db } from "@/lib/db/client";
import { productPrices, products, scrapeRuns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { scrapeAll } from "@/lib/scrape/continente";

const manualSchema = z.object({
  productId: z.coerce.number().int().positive(),
  priceEur: z.coerce.number().positive(),
});

export async function saveManualPrice(formData: FormData) {
  const { productId, priceEur } = manualSchema.parse(Object.fromEntries(formData));
  const [p] = await db.select({ packSizeG: products.packSizeG, unit: products.unit }).from(products).where(eq(products.id, productId));
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
  const [run] = await db.insert(scrapeRuns).values({ status: "ok" }).returning();
  const result = await scrapeAll();
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
