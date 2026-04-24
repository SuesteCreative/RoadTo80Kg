import { db } from "@/lib/db/client";
import { products, profiles, weightLogs } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { computeTargets } from "@/lib/calc/tdee";

export type ProductLine = {
  sku: string;
  name: string;
  category: string;
  kcal: number;
  protein: number;
};

export async function pantryForPrompt(): Promise<ProductLine[]> {
  const rows = await db.select().from(products);
  return rows
    .filter((p) => p.continenteSku)
    .map((p) => ({
      sku: p.continenteSku!,
      name: p.namePt,
      category: p.category ?? "",
      kcal: Number(p.kcalPer100 ?? 0),
      protein: Number(p.proteinG ?? 0),
    }));
}

export function formatPantry(list: ProductLine[]): string {
  return list
    .map((p) => `- ${p.sku} · ${p.name} · ${p.category} · ${p.kcal}kcal/${p.protein}gP por 100`)
    .join("\n");
}

export type UserContext = {
  displayName: string;
  targetKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbsG: number | null;
  currentWeightKg: number | null;
  targetWeightKg: number | null;
  aiNotes: string | null;
};

export async function userContext(uid: number, displayName: string): Promise<UserContext> {
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, uid));
  const [latest] = await db
    .select()
    .from(weightLogs)
    .where(eq(weightLogs.userId, uid))
    .orderBy(desc(weightLogs.loggedOn))
    .limit(1);

  if (!profile || !latest) {
    return {
      displayName,
      targetKcal: null,
      proteinG: null,
      fatG: null,
      carbsG: null,
      currentWeightKg: latest ? Number(latest.weightKg) : null,
      targetWeightKg: profile ? Number(profile.targetWeightKg) : null,
      aiNotes: profile?.aiNotes ?? null,
    };
  }
  const t = computeTargets({
    sex: profile.sex,
    heightCm: Number(profile.heightCm),
    birthdate: profile.birthdate,
    weightKg: Number(latest.weightKg),
    activity: profile.activityLevel,
    targetWeightKg: Number(profile.targetWeightKg),
    deficitKcal: profile.deficitKcal,
  });
  return {
    displayName,
    targetKcal: t.targetKcal,
    proteinG: t.proteinG,
    fatG: t.fatG,
    carbsG: t.carbsG,
    currentWeightKg: Number(latest.weightKg),
    targetWeightKg: Number(profile.targetWeightKg),
    aiNotes: profile.aiNotes ?? null,
  };
}

export function formatUserLine(ctx: UserContext): string {
  if (ctx.targetKcal == null) {
    return `Utilizador: ${ctx.displayName}. Perfil incompleto.`;
  }
  return `Utilizador: ${ctx.displayName}. Alvo ${ctx.targetKcal} kcal/dia (P${ctx.proteinG} F${ctx.fatG} C${ctx.carbsG}). Peso ${ctx.currentWeightKg}→${ctx.targetWeightKg} kg.`;
}

export function formatUserRules(ctx: UserContext): string {
  if (!ctx.aiNotes || ctx.aiNotes.trim().length === 0) return "";
  return [
    "REGRAS DO UTILIZADOR (respeita SEMPRE; se entrar em conflito com o pedido, prioriza estas regras e explica no summary/notes):",
    ctx.aiNotes.trim(),
  ].join("\n");
}
