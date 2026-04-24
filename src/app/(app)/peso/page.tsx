import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { weightLogs } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import WeightChart from "./chart";
import PesoForm from "./form";

export default async function PesoPage() {
  const session = await auth();
  const uid = Number(session!.user.id);
  const logs = await db
    .select()
    .from(weightLogs)
    .where(eq(weightLogs.userId, uid))
    .orderBy(desc(weightLogs.loggedOn))
    .limit(180);

  const chartData = [...logs]
    .reverse()
    .map((l) => ({ date: l.loggedOn, kg: Number(l.weightKg) }));

  const latest = logs[0];
  const prev = logs[6] ?? logs[logs.length - 1];
  const delta7 =
    latest && prev && prev.id !== latest.id
      ? Number(latest.weightKg) - Number(prev.weightKg)
      : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.1em] font-medium text-muted-foreground">
            Registo de peso
          </p>
          <h1 className="font-display text-3xl font-medium tracking-tight">Pesagens</h1>
        </div>
        {latest && (
          <div className="flex items-baseline gap-4 text-[11px] uppercase tracking-[0.08em] font-medium text-muted-foreground">
            <span>
              Actual <strong className="ml-1 font-mono text-foreground">{Number(latest.weightKg).toFixed(1)} kg</strong>
            </span>
            {delta7 != null && (
              <span className={delta7 < 0 ? "text-accent" : delta7 > 0 ? "text-destructive" : undefined}>
                7 d {delta7 > 0 ? "+" : ""}
                {delta7.toFixed(1)} kg
              </span>
            )}
          </div>
        )}
      </header>

      <div className="grid gap-4 md:grid-cols-[minmax(0,.9fr)_minmax(0,1.6fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Novo registo</CardTitle>
            <CardDescription>Diário, pela manhã, em jejum.</CardDescription>
          </CardHeader>
          <CardContent>
            <PesoForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trajectória</CardTitle>
            <CardDescription>Linha fina: pesagens · linha grossa: média 7 dias.</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem registos ainda.</p>
            ) : (
              <WeightChart data={chartData} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
