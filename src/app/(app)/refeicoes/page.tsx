import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import {
  mealPlan,
  profiles,
  recipes,
  weightLogs,
} from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { weekStartISO, dayLabelPt } from "@/lib/calc/date";
import { computeTargets } from "@/lib/calc/tdee";
import RegenerateButton from "./regenerate-button";
import ServingsEdit from "./servings-edit";
import AiWeekAdjust from "./ai-week-adjust";

const MEAL_LABEL = {
  breakfast: "P. Almoço",
  snack: "Snack",
  lunch: "Almoço",
  dinner: "Jantar",
} as const;
const MEAL_TYPES = ["breakfast", "snack", "lunch", "dinner"] as const;

export default async function RefeicoesPage() {
  const session = await auth();
  const uid = Number(session!.user.id);
  const ws = weekStartISO();

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, uid));
  const [latest] = await db
    .select()
    .from(weightLogs)
    .where(eq(weightLogs.userId, uid))
    .orderBy(desc(weightLogs.loggedOn))
    .limit(1);

  if (!profile || !latest) {
    return (
      <p className="text-sm">
        Falta perfil ou peso inicial.{" "}
        <Link href="/perfil" className="underline decoration-primary/40 underline-offset-4">
          Configurar →
        </Link>
      </p>
    );
  }
  const t = computeTargets({
    sex: profile.sex,
    heightCm: Number(profile.heightCm),
    birthdate: profile.birthdate,
    weightKg: Number(latest.weightKg),
    activity: profile.activityLevel,
    targetWeightKg: Number(profile.targetWeightKg),
    deficitKcal: profile.deficitKcal,
  });

  const current = await db
    .select({
      day: mealPlan.day,
      mealType: mealPlan.mealType,
      recipeId: mealPlan.recipeId,
      recipeSlug: recipes.slug,
      recipeName: recipes.namePt,
      servings: mealPlan.servings,
    })
    .from(mealPlan)
    .innerJoin(recipes, eq(recipes.id, mealPlan.recipeId))
    .where(and(eq(mealPlan.userId, uid), eq(mealPlan.weekStart, ws)));

  const byCell = new Map<string, (typeof current)[number]>();
  for (const row of current) byCell.set(`${row.day}-${row.mealType}`, row);

  const todayDow = (new Date().getDay() + 6) % 7;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.1em] font-medium text-muted-foreground">
            Plano semanal — {ws}
          </p>
          <h1 className="font-display text-3xl font-medium tracking-tight">
            Refeições
          </h1>
          <p className="text-xs text-muted-foreground">
            Alvo diário: <span className="tabular-nums">{t.targetKcal.toLocaleString("pt-PT")}</span> kcal · proteína ≥{" "}
            <span className="tabular-nums">{t.proteinG}</span> g
          </p>
        </div>
        <RegenerateButton />
      </header>

      <AiWeekAdjust />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="w-24 p-3 text-left text-[11px] font-normal uppercase tracking-wider text-muted-foreground"></th>
                {Array.from({ length: 7 }).map((_, d) => (
                  <th
                    key={d}
                    className={`min-w-[8.5rem] p-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] ${
                      d === todayDow ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <span className="flex items-baseline gap-1.5">
                      {dayLabelPt(d)}
                      {d === todayDow && <span className="size-1.5 rounded-full bg-primary" />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEAL_TYPES.map((mt) => (
                <tr key={mt} className="border-b border-border/50 last:border-b-0">
                  <td className="p-3 align-top text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
                    {MEAL_LABEL[mt]}
                  </td>
                  {Array.from({ length: 7 }).map((_, d) => {
                    const cell = byCell.get(`${d}-${mt}`);
                    return (
                      <td
                        key={d}
                        className={`p-3 align-top ${d === todayDow ? "bg-primary/[0.035]" : ""}`}
                      >
                        {cell ? (
                          <div className="space-y-1">
                            <Link
                              href={`/receitas/${cell.recipeSlug}`}
                              className={`block font-display text-[0.95rem] leading-tight transition-colors hover:text-primary ${
                                mt === "lunch" ? "italic text-foreground/70" : ""
                              }`}
                            >
                              {cell.recipeName}
                            </Link>
                            {mt !== "lunch" && (
                              <ServingsEdit
                                day={d}
                                mealType={mt}
                                initial={Number(cell.servings)}
                              />
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground">
        <span className="font-semibold">n×</span> = número total de refeições cozinhadas (pessoas × dias). Default: jantar 4 · pequeno-almoço/snack 2 · almoço 0 (sobras).
      </p>
    </div>
  );
}
