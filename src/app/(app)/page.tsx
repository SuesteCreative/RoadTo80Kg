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
import { and, asc, desc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeTargets } from "@/lib/calc/tdee";
import { weekStartISO } from "@/lib/calc/date";
import Link from "next/link";
import { JourneyBar } from "@/components/journey-bar";
import CoachWidget from "@/components/coach-widget";
import { Dumbbell, Trees, ChevronRight } from "lucide-react";

const MEAL_LABEL = {
  breakfast: "Pequeno-almoço",
  snack: "Snack",
  lunch: "Almoço · sobras",
  dinner: "Jantar",
} as const;

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
  const [first] = await db
    .select()
    .from(weightLogs)
    .where(eq(weightLogs.userId, uid))
    .orderBy(asc(weightLogs.loggedOn))
    .limit(1);

  let targets: ReturnType<typeof computeTargets> | null = null;
  if (profile && latest) {
    targets = computeTargets({
      sex: profile.sex,
      heightCm: Number(profile.heightCm),
      birthdate: profile.birthdate,
      weightKg: Number(latest.weightKg),
      activity: profile.activityLevel,
      targetWeightKg: Number(profile.targetWeightKg),
      deficitKcal: profile.deficitKcal,
    });
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
    .select({ namePt: workouts.namePt, slug: workouts.slug, mode: workouts.mode, duration: workouts.durationMin })
    .from(workoutSchedule)
    .innerJoin(workouts, eq(workouts.id, workoutSchedule.workoutId))
    .where(and(eq(workoutSchedule.userId, uid), eq(workoutSchedule.dayOfWeek, todayDow)));

  const startWeight = first ? Number(first.weightKg) : null;
  const currentWeight = latest ? Number(latest.weightKg) : null;
  const targetWeight = profile ? Number(profile.targetWeightKg) : null;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-lg border border-border bg-card shadow-paper">
        <div className="topo pointer-events-none absolute inset-0 opacity-80" />
        <div className="relative grid gap-8 p-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-5">
            <p className="text-[11px] uppercase tracking-[0.1em] font-medium text-muted-foreground">
              Registo — {new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <div className="space-y-1.5">
              <h1 className="font-display text-5xl font-medium leading-[1.05] tracking-tight md:text-6xl">
                {targets ? (
                  <>
                    <span className="tabular-nums">{targets.targetKcal.toLocaleString("pt-PT")}</span>
                    <span className="ml-2 text-2xl text-muted-foreground md:text-3xl">kcal</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Configura o perfil</span>
                )}
              </h1>
              {targets && (
                <p className="font-mono text-xs text-muted-foreground">
                  <span className="tabular-nums">{targets.proteinG}g P</span> · <span className="tabular-nums">{targets.fatG}g G</span> · <span className="tabular-nums">{targets.carbsG}g C</span>
                  <span className="mx-2 text-border">·</span>
                  défice {profile!.deficitKcal} kcal/dia · TDEE {targets.tdee}
                </p>
              )}
            </div>

            {startWeight && currentWeight && targetWeight && (
              <div className="pt-2">
                <JourneyBar startKg={startWeight} currentKg={currentWeight} targetKg={targetWeight} />
              </div>
            )}
            {!profile && (
              <Link
                href="/perfil"
                className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
              >
                Configurar perfil <ChevronRight className="size-4" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Today: workout + meals */}
      <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
        <Card className="relative overflow-hidden">
          <div className="topo pointer-events-none absolute inset-0 opacity-40" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Treino de hoje</CardTitle>
              {todayWorkout && (
                <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
                  {todayWorkout.mode === "indoor" ? (
                    <Dumbbell className="size-3.5" />
                  ) : (
                    <Trees className="size-3.5" />
                  )}
                  {todayWorkout.mode === "indoor" ? "sala" : "ar livre"}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="relative">
            {todayWorkout ? (
              <Link
                href={`/treinos/${todayWorkout.slug}`}
                className="group block space-y-2 rounded-md"
              >
                <p className="font-display text-2xl font-medium leading-tight transition-colors group-hover:text-primary">
                  {todayWorkout.namePt}
                </p>
                <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                  {todayWorkout.duration} min · começar →
                </p>
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">Dia de descanso.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Refeições de hoje</CardTitle>
              <Link href="/refeicoes" className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground hover:text-primary">
                ver semana →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {todayMeals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ainda sem plano. <Link className="underline decoration-primary/40 underline-offset-4 hover:text-primary" href="/refeicoes">Gerar semana</Link>.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {todayMeals.map((m) => (
                  <li key={m.mealType} className="group flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <span className="text-[11px] uppercase tracking-[0.08em] font-medium text-muted-foreground">
                      {MEAL_LABEL[m.mealType]}
                    </span>
                    <Link
                      href={`/receitas/${m.recipeSlug}`}
                      className="font-display text-[1.05rem] leading-tight transition-colors group-hover:text-primary"
                    >
                      {m.recipeName}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <CoachWidget />
    </div>
  );
}
