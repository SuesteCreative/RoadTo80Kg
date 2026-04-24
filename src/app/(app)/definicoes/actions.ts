"use server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function saveAiNotes(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");
  const uid = Number(session.user.id);
  const raw = String(formData.get("aiNotes") ?? "").trim();
  const notes = raw.length > 0 ? raw.slice(0, 4000) : null;

  await db
    .update(profiles)
    .set({ aiNotes: notes, updatedAt: new Date() })
    .where(eq(profiles.userId, uid));

  revalidatePath("/definicoes");
}
