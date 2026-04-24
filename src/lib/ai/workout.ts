"use server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { workouts, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";
import { getAnthropic, AI_MODEL } from "./client";
import { CAVEMAN_RULES_PT } from "./caveman";
import { userContext, formatUserLine } from "./context";
import { revalidatePath } from "next/cache";

const AdjustedWorkout = z.object({
  name: z.string().min(3).max(80),
  mode: z.enum(["indoor", "outdoor"]),
  duration_min: z.number().int().min(5).max(120),
  instructions_md: z.string().min(40).max(4000),
  equipment: z.array(z.string()).max(10).optional(),
  notes: z.string().max(300).optional(),
});

export type AdjustedWorkoutResult = z.infer<typeof AdjustedWorkout>;

export async function suggestWorkoutAdjustment(
  workoutSlug: string,
  userRequest: string,
): Promise<AdjustedWorkoutResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");
  const uid = Number(session.user.id);
  const [user] = await db.select().from(users).where(eq(users.id, uid));

  const [w] = await db.select().from(workouts).where(eq(workouts.slug, workoutSlug));
  if (!w) throw new Error("Treino não encontrado.");

  const ctx = await userContext(uid, user.displayName);

  const originalText = [
    `Nome: ${w.namePt}`,
    `Modo: ${w.mode}`,
    `Duração: ${w.durationMin} min`,
    `Equipamento: ${w.equipment.join(", ") || "nenhum"}`,
    "",
    w.instructionsMd,
  ].join("\n");

  const system = [
    CAVEMAN_RULES_PT,
    "",
    "Função: ajustas rotina de treino pt-PT conforme pedido.",
    "",
    "CONTEXTO",
    formatUserLine(ctx),
    "",
    "REGRAS:",
    "- mode 'indoor' = sala em casa (peso corporal, garrafas de água). 'outdoor' = parque/rua (corrida, peso corporal).",
    "- instructions_md com blocos: Aquecimento / Circuito principal (reps × rondas ou tempo:rest) / Retorno à calma. Headers em markdown ** **.",
    "- duration_min realista face ao pedido (se pedir 20 min, devolve 20).",
    "- Sem equipamento de ginásio (pesos livres, barra, etc.) a menos que utilizador peça.",
    "- notes: 1-2 frases caveman a explicar mudança.",
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
        content: `TREINO ORIGINAL:\n${originalText}\n\nPEDIDO: ${userRequest}\n\nDevolve treino ajustado.`,
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
            mode: { type: "string", enum: ["indoor", "outdoor"] },
            duration_min: { type: "integer" },
            instructions_md: { type: "string" },
            equipment: { type: "array", items: { type: "string" } },
            notes: { type: "string" },
          },
          required: ["name", "mode", "duration_min", "instructions_md"],
        },
      },
    },
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Sem resposta do modelo.");
  return AdjustedWorkout.parse(JSON.parse(textBlock.text));
}

export async function saveAdjustedWorkoutAsVariant(
  sourceSlug: string,
  adjusted: AdjustedWorkoutResult,
): Promise<{ slug: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");

  const baseSlug = `${sourceSlug}-ajustado-${Date.now().toString(36)}`;
  await db.insert(workouts).values({
    slug: baseSlug,
    namePt: adjusted.name,
    mode: adjusted.mode,
    durationMin: adjusted.duration_min,
    instructionsMd: adjusted.instructions_md,
    equipment: adjusted.equipment ?? [],
  });

  revalidatePath("/treinos");
  return { slug: baseSlug };
}
