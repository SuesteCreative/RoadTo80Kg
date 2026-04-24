"use server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";
import { getAnthropic, AI_MODEL } from "./client";
import { CAVEMAN_RULES_PT } from "./caveman";
import { userContext, formatUserLine } from "./context";

export async function askCoach(question: string): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");
  const uid = Number(session.user.id);
  const [user] = await db.select().from(users).where(eq(users.id, uid));
  const ctx = await userContext(uid, user.displayName);

  const system = [
    CAVEMAN_RULES_PT,
    "",
    "Função: coach pessoal pt-PT. Responde perguntas sobre cut, nutrição, treino, plateaus, motivação, estratégia alimentar.",
    "",
    "CONTEXTO",
    formatUserLine(ctx),
    "",
    "REGRAS:",
    "- Markdown curto: parágrafos de 1-3 frases, bullets * quando adequado.",
    "- Se pergunta for ambígua: assume contexto mais provável e responde. Não peças clarificação.",
    "- Nunca conselhos médicos. Se pergunta for clínica (dor, lesão persistente, suspeita de doença) sugere médico e para aí.",
    "- Dá valores concretos quando pedido (gramas, kcal, reps).",
  ].join("\n");

  const anthropic = getAnthropic();
  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    cache_control: { type: "ephemeral" },
    system,
    messages: [{ role: "user", content: question }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Sem resposta.");
  return textBlock.text.trim();
}
