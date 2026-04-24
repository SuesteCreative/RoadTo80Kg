"use server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({
  sex: z.enum(["M", "F"]),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  heightCm: z.coerce.number().min(120).max(230),
  activityLevel: z.enum(["sedentary", "light", "moderate", "heavy"]),
  targetWeightKg: z.coerce.number().min(40).max(200),
  deficitKcal: z.coerce.number().min(0).max(1000),
});

export async function saveProfile(formData: FormData) {
  const session = await auth();
  const uid = Number(session!.user.id);
  const parsed = schema.parse(Object.fromEntries(formData));
  await db
    .insert(profiles)
    .values({
      userId: uid,
      ...parsed,
      heightCm: String(parsed.heightCm),
      targetWeightKg: String(parsed.targetWeightKg),
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        sex: parsed.sex,
        birthdate: parsed.birthdate,
        heightCm: String(parsed.heightCm),
        activityLevel: parsed.activityLevel,
        targetWeightKg: String(parsed.targetWeightKg),
        deficitKcal: parsed.deficitKcal,
        updatedAt: new Date(),
      },
    });
  revalidatePath("/perfil");
  revalidatePath("/");
}
