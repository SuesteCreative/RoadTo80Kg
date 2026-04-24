"use server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { weightLogs } from "@/lib/db/schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({
  loggedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weightKg: z.coerce.number().min(30).max(250),
  note: z.string().optional(),
});

export async function saveWeight(formData: FormData) {
  const session = await auth();
  const uid = Number(session!.user.id);
  const p = schema.parse(Object.fromEntries(formData));
  await db
    .insert(weightLogs)
    .values({
      userId: uid,
      loggedOn: p.loggedOn,
      weightKg: String(p.weightKg),
      note: p.note || null,
    })
    .onConflictDoUpdate({
      target: [weightLogs.userId, weightLogs.loggedOn],
      set: { weightKg: String(p.weightKg), note: p.note || null },
    });
  revalidatePath("/peso");
  revalidatePath("/");
}
