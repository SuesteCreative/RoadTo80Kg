import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../../src/lib/db/client";
import { users, workoutSchedule, workouts } from "../../src/lib/db/schema";
import { DEFAULT_SCHEDULE } from "./data/workouts";
import readline from "node:readline/promises";

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const email = (await rl.question("Email: ")).trim().toLowerCase();
  const name = (await rl.question("Nome a mostrar: ")).trim();
  const pass = (await rl.question("Palavra-passe (min 8): ")).trim();
  rl.close();

  if (pass.length < 8) {
    console.error("Palavra-passe curta.");
    process.exit(1);
  }

  const hash = await bcrypt.hash(pass, 10);
  const [u] = await db
    .insert(users)
    .values({ email, passwordHash: hash, displayName: name })
    .onConflictDoUpdate({
      target: users.email,
      set: { passwordHash: hash, displayName: name },
    })
    .returning({ id: users.id });

  const wo = await db.select({ id: workouts.id, slug: workouts.slug }).from(workouts);
  const bySlug = new Map(wo.map((w) => [w.slug, w.id]));
  await db.delete(workoutSchedule).where(eq(workoutSchedule.userId, u.id));
  for (const row of DEFAULT_SCHEDULE) {
    const id = bySlug.get(row.slug);
    if (!id) continue;
    await db.insert(workoutSchedule).values({ userId: u.id, dayOfWeek: row.day, workoutId: id });
  }

  console.log(`✓ User ${email} (id=${u.id}) criado/actualizado com agenda de treinos.`);
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
