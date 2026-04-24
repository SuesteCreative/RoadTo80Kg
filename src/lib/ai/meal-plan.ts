"use server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  mealPlan,
  products,
  recipes,
  recipeItems,
  users,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";
import { getAnthropic, AI_MODEL } from "./client";
import { CAVEMAN_RULES_PT } from "./caveman";
import { pantryForPrompt, formatPantry, userContext, formatUserLine } from "./context";
import { weekStartISO } from "@/lib/calc/date";
import { revalidatePath } from "next/cache";

const Ingredient = z.object({
  product_sku: z.string(),
  qty_g: z.number().positive().max(2000),
});

const SlotChange = z.object({
  day: z.number().int().min(0).max(6),
  meal_type: z.enum(["breakfast", "snack", "dinner"]),
  recipe: z.object({
    name: z.string().min(3).max(80),
    prep_min: z.number().int().min(1).max(240),
    instructions_md: z.string().min(20).max(3000),
    ingredients: z.array(Ingredient).min(1).max(15),
  }),
});

const AdjustWeekResult = z.object({
  summary: z.string().min(3).max(300),
  changes: z.array(SlotChange).min(1).max(28),
});

export type WeekAdjustResult = z.infer<typeof AdjustWeekResult>;
export type SlotChange = z.infer<typeof SlotChange>;

const DAY_LABEL = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MEAL_LABEL_PT: Record<string, string> = {
  breakfast: "pequeno-almoço",
  snack: "snack",
  dinner: "jantar",
};

export async function adjustWeekPlan(userRequest: string): Promise<WeekAdjustResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");
  const uid = Number(session.user.id);
  const [user] = await db.select().from(users).where(eq(users.id, uid));
  const ws = weekStartISO();

  const current = await db
    .select({
      day: mealPlan.day,
      mealType: mealPlan.mealType,
      recipeName: recipes.namePt,
    })
    .from(mealPlan)
    .innerJoin(recipes, eq(recipes.id, mealPlan.recipeId))
    .where(and(eq(mealPlan.userId, uid), eq(mealPlan.weekStart, ws)));

  if (current.length === 0) {
    throw new Error("Sem plano da semana. Gera primeiro com 'Regenerar semana'.");
  }

  const planLines: string[] = [];
  for (let d = 0; d < 7; d++) {
    const dayRows = current.filter((r) => r.day === d);
    for (const mt of ["breakfast", "snack", "lunch", "dinner"] as const) {
      const row = dayRows.find((r) => r.mealType === mt);
      if (!row) continue;
      const label = mt === "lunch" ? "almoço (sobras)" : MEAL_LABEL_PT[mt];
      planLines.push(`${DAY_LABEL[d]} · ${label}: ${row.recipeName}`);
    }
  }

  const pantry = await pantryForPrompt();
  const ctx = await userContext(uid, user.displayName);

  const system = [
    CAVEMAN_RULES_PT,
    "",
    "Função: ajustas PLANO SEMANAL de refeições pt-PT conforme pedido.",
    "",
    "CONTEXTO",
    formatUserLine(ctx),
    "",
    "PANTRY (SKU · nome · categoria · macros/100g) — apenas estes produtos permitidos:",
    formatPantry(pantry),
    "",
    "REGRAS:",
    "- Interpreta o scope do pedido. Se disser 'todos os pequenos almoços', afecta os 7 PAs. Se 'segunda-feira', afecta só day=0 (Seg=0, Dom=6).",
    "- Para cada slot afectado devolve receita NOVA completa (nome, instruções, ingredientes). Não mexas em slots que não foram pedidos.",
    "- NUNCA devolvas slots de almoço (lunch) — é sobras do jantar anterior. Se o pedido pedir almoço, redirecciona para o jantar do dia anterior.",
    "- Ingredientes: só SKUs da PANTRY acima. qty_g em gramas inteiras.",
    "- Respeita o tipo da refeição (pequeno-almoço não pode ter 800 kcal).",
    "- summary: 1 frase caveman a explicar o que mudou.",
  ].join("\n");

  const anthropic = getAnthropic();
  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 4096,
    cache_control: { type: "ephemeral" },
    system,
    messages: [
      {
        role: "user",
        content: `PLANO ACTUAL:\n${planLines.join("\n")}\n\nPEDIDO: ${userRequest}\n\nDevolve só os slots a mudar.`,
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            summary: { type: "string" },
            changes: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  day: { type: "integer" },
                  meal_type: { type: "string", enum: ["breakfast", "snack", "dinner"] },
                  recipe: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      name: { type: "string" },
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
                    },
                    required: ["name", "prep_min", "instructions_md", "ingredients"],
                  },
                },
                required: ["day", "meal_type", "recipe"],
              },
            },
          },
          required: ["summary", "changes"],
        },
      },
    },
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Sem resposta do modelo.");
  const parsed = AdjustWeekResult.parse(JSON.parse(textBlock.text));

  const allowedSkus = new Set(pantry.map((p) => p.sku));
  for (const ch of parsed.changes) {
    ch.recipe.ingredients = ch.recipe.ingredients.filter((i) => allowedSkus.has(i.product_sku));
  }
  parsed.changes = parsed.changes.filter((ch) => ch.recipe.ingredients.length > 0);
  if (parsed.changes.length === 0) throw new Error("Modelo não devolveu mudanças válidas.");

  return parsed;
}

export async function applyMealPlanAdjustments(
  changes: SlotChange[],
): Promise<{ applied: number }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");
  const uid = Number(session.user.id);
  const ws = weekStartISO();

  const allProducts = await db.select({ id: products.id, sku: products.continenteSku }).from(products);
  const skuToId = new Map<string, number>();
  for (const r of allProducts) if (r.sku) skuToId.set(r.sku, r.id);

  let applied = 0;
  for (const ch of changes) {
    const slug = `ai-${ch.meal_type}-d${ch.day}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const [inserted] = await db
      .insert(recipes)
      .values({
        slug,
        namePt: ch.recipe.name,
        mealType: ch.meal_type,
        servings: 1,
        prepMin: ch.recipe.prep_min,
        instructionsMd: ch.recipe.instructions_md,
        tags: ["ai-ajustada"],
      })
      .returning({ id: recipes.id });

    for (const ing of ch.recipe.ingredients) {
      const productId = skuToId.get(ing.product_sku);
      if (!productId) continue;
      await db.insert(recipeItems).values({
        recipeId: inserted.id,
        productId,
        qtyG: String(ing.qty_g),
      });
    }

    await db
      .update(mealPlan)
      .set({ recipeId: inserted.id })
      .where(
        and(
          eq(mealPlan.userId, uid),
          eq(mealPlan.weekStart, ws),
          eq(mealPlan.day, ch.day),
          eq(mealPlan.mealType, ch.meal_type),
        ),
      );
    applied++;
  }

  revalidatePath("/refeicoes");
  revalidatePath("/");
  return { applied };
}
