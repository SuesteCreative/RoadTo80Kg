import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { workoutSchedule, workouts } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { dayLabelPt } from "@/lib/calc/date";
import { Dumbbell, Trees } from "lucide-react";
import SwapButton from "./swap";

export default async function TreinosPage() {
  const session = await auth();
  const uid = Number(session!.user.id);
  const rows = await db
    .select({
      day: workoutSchedule.dayOfWeek,
      workoutId: workouts.id,
      slug: workouts.slug,
      name: workouts.namePt,
      mode: workouts.mode,
      duration: workouts.durationMin,
    })
    .from(workoutSchedule)
    .innerJoin(workouts, eq(workouts.id, workoutSchedule.workoutId))
    .where(eq(workoutSchedule.userId, uid))
    .orderBy(asc(workoutSchedule.dayOfWeek));

  const todayDow = (new Date().getDay() + 6) % 7;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Rotina semanal · 30 min/dia
        </p>
        <h1 className="font-display text-3xl font-medium tracking-tight">Treinos</h1>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 7 }).map((_, d) => {
          const row = rows.find((r) => r.day === d);
          const isToday = d === todayDow;
          return (
            <Card
              key={d}
              className={`relative overflow-hidden transition-shadow ${
                isToday ? "ring-1 ring-primary/40 shadow-[0_4px_20px_-8px_hsl(var(--primary)/0.3)]" : ""
              }`}
            >
              {isToday && <div className="topo pointer-events-none absolute inset-0 opacity-40" />}
              <CardHeader className="relative space-y-0">
                <div className="flex items-baseline justify-between">
                  <CardTitle className="text-base">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {dayLabelPt(d)}
                    </span>
                    {isToday && (
                      <span className="ml-2 inline-block size-1.5 rounded-full bg-primary align-middle" />
                    )}
                  </CardTitle>
                  {row && (
                    <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {row.mode === "indoor" ? (
                        <Dumbbell className="size-3" />
                      ) : (
                        <Trees className="size-3" />
                      )}
                      {row.mode === "indoor" ? "sala" : "parque"}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="relative space-y-3">
                {row ? (
                  <>
                    <Link
                      href={`/treinos/${row.slug}`}
                      className="group block space-y-1"
                    >
                      <p className="font-display text-[1.1rem] font-medium leading-tight transition-colors group-hover:text-primary">
                        {row.name}
                      </p>
                      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        {row.duration} min · começar →
                      </p>
                    </Link>
                    <SwapButton day={d} currentMode={row.mode} />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Descanso.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
