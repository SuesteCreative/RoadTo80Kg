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

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: 7 }).map((_, d) => {
        const row = rows.find((r) => r.day === d);
        return (
          <Card key={d}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{dayLabelPt(d)}</CardTitle>
              {row && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {row.mode === "indoor" ? <Dumbbell className="size-3.5" /> : <Trees className="size-3.5" />}
                  {row.mode === "indoor" ? "casa" : "parque"}
                </span>
              )}
            </CardHeader>
            <CardContent>
              {row ? (
                <div className="space-y-2">
                  <Link href={`/treinos/${row.slug}`} className="text-sm hover:underline">
                    {row.name} · {row.duration} min
                  </Link>
                  <SwapButton day={d} currentMode={row.mode} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Descanso.</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
