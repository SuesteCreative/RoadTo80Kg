import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import {
  profiles,
  weightLogs,
  mealPlan,
  recipes,
  workoutSchedule,
  workouts,
} from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeTargets } from "@/lib/calc/tdee";
import { weekStartISO } from "@/lib/calc/date";
import { fmtKcal } from "@/lib/utils";
import Link from "next/link";

export default async function Dashboard() {
  const session = await auth();
  const uid = Number(session!.user.id);

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, uid));
  const [latest] = await db
    .select()
    .from(weightLogs)
    .where(eq(weightLogs.userId, uid))
    .orderBy(desc(weightLogs.loggedOn))
    .limit(1);

  let targetKcal: number | null = null;
  if (profile && latest) {
    const t = computeTargets({
      sex: profile.sex,
      heightCm: Number(profile.heightCm),
      birthdate: profile.birthdate,
      weightKg: Number(latest.weightKg),
      activity: profile.activityLevel,
      targetWeightKg: Number(profile.targetWeightKg),
      deficitKcal: profile.deficitKcal,
    });
    targetKcal = t.targetKcal;
  }

  const todayDow = (new Date().getDay() + 6) % 7;
  const ws = weekStartISO();
  const todayMeals = await db
    .select({
      mealType: mealPlan.mealType,
      recipeName: recipes.namePt,
      recipeSlug: recipes.slug,
    })
    .from(mealPlan)
    .innerJoin(recipes, eq(recipes.id, mealPlan.recipeId))
    .where(and(eq(mealPlan.userId, uid), eq(mealPlan.weekStart, ws), eq(mealPlan.day, todayDow)));

  const [todayWorkout] = await db
    .select({ namePt: workouts.namePt, slug: workouts.slug, mode: workouts.mode })
    .from(workoutSchedule)
    .innerJoin(workouts, eq(workouts.id, workoutSchedule.workoutId))
    .where(and(eq(workoutSchedule.userId, uid), eq(workoutSchedule.dayOfWeek, todayDow)));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Alvo diário</CardTitle></CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{fmtKcal(targetKcal)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Peso actual: {latest ? `${latest.weightKg} kg` : "—"} · Objectivo: {profile?.targetWeightKg ?? "—"} kg
          </p>
          {!profile && (
            <p className="mt-3 text-sm">
              <Link className="underline" href="/perfil">Configura o teu perfil →</Link>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Treino de hoje</CardTitle></CardHeader>
        <CardContent>
          {todayWorkout ? (
            <Link className="underline" href={`/treinos/${todayWorkout.slug}`}>
              {todayWorkout.namePt} ({todayWorkout.mode === "indoor" ? "casa" : "parque"})
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">Dia de descanso.</p>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader><CardTitle>Refeições de hoje</CardTitle></CardHeader>
        <CardContent>
          {todayMeals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda sem plano. <Link className="underline" href="/refeicoes">Gerar semana →</Link>
            </p>
          ) : (
            <ul className="divide-y">
              {todayMeals.map((m) => (
                <li key={m.mealType} className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">
                    {{ breakfast: "Pequeno-almoço", snack: "Snack", lunch: "Almoço (sobras)", dinner: "Jantar" }[m.mealType]}
                  </span>
                  <Link className="text-sm underline" href={`/receitas/${m.recipeSlug}`}>
                    {m.recipeName}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
