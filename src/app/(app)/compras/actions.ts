"use server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import {
  mealPlan,
  recipeItems,
  products,
  productPrices,
  shoppingLists,
  shoppingItems,
} from "@/lib/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { addDays, format } from "date-fns";
import { weekStartISO } from "@/lib/calc/date";
import { aggregateShopping } from "@/lib/calc/shopping";
import { redirect } from "next/navigation";

export async function generateBiweekly() {
  const session = await auth();
  const uid = Number(session!.user.id);
  const start = weekStartISO();
  const end = format(addDays(new Date(start), 13), "yyyy-MM-dd");

  const plans = await db
    .select({ recipeId: mealPlan.recipeId, servings: mealPlan.servings })
    .from(mealPlan)
    .where(and(eq(mealPlan.userId, uid), gte(mealPlan.weekStart, start), lte(mealPlan.weekStart, end)));

  const ri = await db
    .select({ recipeId: recipeItems.recipeId, productId: recipeItems.productId, qtyG: recipeItems.qtyG })
    .from(recipeItems);

  const prodRows = await db.select().from(products);

  const latestSub = db
    .select({
      productId: productPrices.productId,
      priceEur: productPrices.priceEur,
      rn: sql<number>`row_number() over (partition by ${productPrices.productId} order by ${productPrices.scrapedAt} desc)`.as("rn"),
    })
    .from(productPrices)
    .as("ls");
  const latest = await db.select().from(latestSub).where(eq(latestSub.rn, 1));
  const priceBy = new Map(latest.map((p) => [p.productId, Number(p.priceEur)]));

  const aggregated = aggregateShopping(
    plans.map((p) => ({ recipeId: p.recipeId, servings: Number(p.servings) })),
    ri.map((r) => ({ recipeId: r.recipeId, productId: r.productId, qtyG: Number(r.qtyG) })),
    prodRows.map((p) => ({
      id: p.id,
      namePt: p.namePt,
      packSizeG: p.packSizeG != null ? Number(p.packSizeG) : null,
      latestPriceEur: priceBy.get(p.id) ?? null,
    })),
    2,
  );

  const total = aggregated.reduce((s, x) => s + (x.priceEur ?? 0), 0);

  const [list] = await db
    .insert(shoppingLists)
    .values({
      userId: uid,
      periodStart: start,
      periodEnd: end,
      status: "active",
      totalEur: String(total.toFixed(2)),
    })
    .returning({ id: shoppingLists.id });

  for (const it of aggregated) {
    await db.insert(shoppingItems).values({
      listId: list.id,
      productId: it.productId,
      qtyG: String(it.qtyG),
      qtyUnits: String(it.qtyUnits),
      priceEur: it.priceEur != null ? String(it.priceEur) : null,
    });
  }

  revalidatePath("/compras");
  redirect(`/compras/${list.id}`);
}

export async function toggleItem(formData: FormData) {
  const id = Number(formData.get("id"));
  const checked = formData.get("checked") === "1";
  await db.update(shoppingItems).set({ checked }).where(eq(shoppingItems.id, id));
  revalidatePath(`/compras/${formData.get("listId")}`);
}
