import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../../src/lib/db/client";
import { users, workoutSchedule, workouts } from "../../src/lib/db/schema";
import { DEFAULT_SCHEDULE } from "./data/workouts";
import readline from "node:readline/promises";

function parseArgs(argv: string[]) {
  const out: Record<string, string> = {};
  for (const a of argv) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let email = args.email;
  let name = args.name;
  let pass = args.password;

  if (!email || !name || !pass) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    email = email ?? (await rl.question("Email: ")).trim();
    name = name ?? (await rl.question("Nome a mostrar: ")).trim();
    pass = pass ?? (await rl.question("Palavra-passe (min 8): ")).trim();
    rl.close();
  }

  email = email.toLowerCase();
  if (!email || !name || !pass) {
    console.error("Faltam campos.");
    process.exit(1);
  }
  if (pass.length < 8) {
    console.error("Palavra-passe curta (min 8).");
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

  console.log(`✓ ${email} (id=${u.id}) — agenda de treinos criada.`);
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
