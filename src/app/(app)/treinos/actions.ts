"use server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { workoutSchedule, workouts } from "@/lib/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function swapMode(formData: FormData) {
  const session = await auth();
  const uid = Number(session!.user.id);
  const day = Number(formData.get("day"));
  const currentMode = String(formData.get("mode"));
  const target = currentMode === "indoor" ? "outdoor" : "indoor";

  const pool = await db
    .select({ id: workouts.id })
    .from(workouts)
    .where(eq(workouts.mode, target));
  if (pool.length === 0) return;

  const [existing] = await db
    .select({ workoutId: workoutSchedule.workoutId })
    .from(workoutSchedule)
    .where(and(eq(workoutSchedule.userId, uid), eq(workoutSchedule.dayOfWeek, day)));

  const pick = pool[Math.floor(Math.random() * pool.length)];
  if (existing) {
    await db
      .update(workoutSchedule)
      .set({ workoutId: pick.id })
      .where(and(eq(workoutSchedule.userId, uid), eq(workoutSchedule.dayOfWeek, day)));
  } else {
    await db.insert(workoutSchedule).values({ userId: uid, dayOfWeek: day, workoutId: pick.id });
  }
  revalidatePath("/treinos");
}
