"use server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { products, recipes, recipeItems, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";
import { getAnthropic, AI_MODEL } from "./client";
import { CAVEMAN_RULES_PT } from "./caveman";
import { pantryForPrompt, formatPantry, userContext, formatUserLine, formatUserRules } from "./context";
import { revalidatePath } from "next/cache";

const AdjustedRecipe = z.object({
  name: z.string().min(3).max(80),
  meal_type: z.enum(["breakfast", "snack", "lunch", "dinner"]),
  servings: z.number().int().min(1).max(8),
  prep_min: z.number().int().min(1).max(240),
  instructions_md: z.string().min(20).max(4000),
  ingredients: z
    .array(
      z.object({
        product_sku: z.string(),
        qty_g: z.number().positive().max(2000),
      }),
    )
    .min(1)
    .max(20),
  notes: z.string().max(300).optional(),
});

export type AdjustedRecipeResult = z.infer<typeof AdjustedRecipe>;

export async function suggestRecipeAdjustment(
  recipeSlug: string,
  userRequest: string,
): Promise<AdjustedRecipeResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");
  const uid = Number(session.user.id);
  const [user] = await db.select().from(users).where(eq(users.id, uid));

  const [recipe] = await db.select().from(recipes).where(eq(recipes.slug, recipeSlug));
  if (!recipe) throw new Error("Receita não encontrada.");

  const items = await db
    .select({
      qtyG: recipeItems.qtyG,
      sku: products.continenteSku,
      name: products.namePt,
    })
    .from(recipeItems)
    .innerJoin(products, eq(products.id, recipeItems.productId))
    .where(eq(recipeItems.recipeId, recipe.id));

  const pantry = await pantryForPrompt();
  const ctx = await userContext(uid, user.displayName);

  const originalText = [
    `Nome: ${recipe.namePt}`,
    `Tipo: ${recipe.mealType}`,
    `Doses: ${recipe.servings}`,
    `Preparo: ${recipe.prepMin} min`,
    "Ingredientes:",
    ...items.map((i) => `  - ${i.sku} · ${i.name} · ${Number(i.qtyG)} g`),
    "",
    recipe.instructionsMd,
  ].join("\n");

  const rules = formatUserRules(ctx);
  const system = [
    CAVEMAN_RULES_PT,
    "",
    "Função: ajustas receita pt-PT conforme pedido do utilizador.",
    "",
    `CONTEXTO`,
    formatUserLine(ctx),
    rules ? "\n" + rules : "",
    "",
    "PANTRY (SKU · nome · categoria · macros/100g) — apenas estes produtos são permitidos:",
    formatPantry(pantry),
    "",
    "REGRAS DE OUTPUT:",
    "- Devolve SÓ ingredientes cujo product_sku esteja na PANTRY acima.",
    "- qty_g em gramas inteiras (ou ml tratados como g).",
    "- meal_type igual ao original excepto se pedido mudar.",
    "- instructions_md com passos numerados, verbos infinitivo.",
    "- notes: 1-2 frases caveman a explicar o que mudaste.",
  ].join("\n");

  const anthropic = getAnthropic();
  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 2048,
    cache_control: { type: "ephemeral" },
    system,
    messages: [
      {
        role: "user",
        content: `RECEITA ORIGINAL:\n${originalText}\n\nPEDIDO: ${userRequest}\n\nDevolve receita ajustada.`,
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            meal_type: { type: "string", enum: ["breakfast", "snack", "lunch", "dinner"] },
            servings: { type: "integer" },
            prep_min: { type: "integer" },
            instructions_md: { type: "string" },
            ingredients: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  product_sku: { type: "string" },
                  qty_g: { type: "number" },
                },
                required: ["product_sku", "qty_g"],
              },
            },
            notes: { type: "string" },
          },
          required: [
            "name",
            "meal_type",
            "servings",
            "prep_min",
            "instructions_md",
            "ingredients",
          ],
        },
      },
    },
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Sem resposta do modelo.");
  const parsed = AdjustedRecipe.parse(JSON.parse(textBlock.text));

  const allowedSkus = new Set(pantry.map((p) => p.sku));
  parsed.ingredients = parsed.ingredients.filter((i) => allowedSkus.has(i.product_sku));
  if (parsed.ingredients.length === 0) {
    throw new Error("Modelo devolveu ingredientes fora da pantry.");
  }

  return parsed;
}

export async function saveAdjustedAsVariant(
  sourceSlug: string,
  adjusted: AdjustedRecipeResult,
): Promise<{ slug: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");

  const pantry = await pantryForPrompt();
  const skuToId = new Map<string, number>();
  const allProducts = await db.select({ id: products.id, sku: products.continenteSku }).from(products);
  for (const r of allProducts) if (r.sku) skuToId.set(r.sku, r.id);

  const baseSlug = `${sourceSlug}-ajustada-${Date.now().toString(36)}`;

  const [inserted] = await db
    .insert(recipes)
    .values({
      slug: baseSlug,
      namePt: adjusted.name,
      mealType: adjusted.meal_type,
      servings: adjusted.servings,
      prepMin: adjusted.prep_min,
      instructionsMd: adjusted.instructions_md,
      tags: ["ai-ajustada"],
    })
    .returning({ id: recipes.id });

  for (const ing of adjusted.ingredients) {
    const productId = skuToId.get(ing.product_sku);
    if (!productId) continue;
    await db.insert(recipeItems).values({
      recipeId: inserted.id,
      productId,
      qtyG: String(ing.qty_g),
    });
  }

  revalidatePath("/receitas");
  void pantry;
  return { slug: baseSlug };
}
