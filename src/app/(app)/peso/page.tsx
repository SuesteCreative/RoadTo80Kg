import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { weightLogs } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { revalidatePath } from "next/cache";
import WeightChart from "./chart";
import { z } from "zod";

const schema = z.object({
  loggedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weightKg: z.coerce.number().min(30).max(250),
  note: z.string().optional(),
});

export default async function PesoPage() {
  const session = await auth();
  const uid = Number(session!.user.id);
  const logs = await db
    .select()
    .from(weightLogs)
    .where(eq(weightLogs.userId, uid))
    .orderBy(desc(weightLogs.loggedOn))
    .limit(120);

  async function save(formData: FormData) {
    "use server";
    const p = schema.parse(Object.fromEntries(formData));
    await db
      .insert(weightLogs)
      .values({
        userId: uid,
        loggedOn: p.loggedOn,
        weightKg: String(p.weightKg),
        note: p.note || null,
      })
      .onConflictDoUpdate({
        target: [weightLogs.userId, weightLogs.loggedOn],
        set: { weightKg: String(p.weightKg), note: p.note || null },
      });
    revalidatePath("/peso");
    revalidatePath("/");
  }

  const today = new Date().toISOString().slice(0, 10);
  const chartData = [...logs]
    .reverse()
    .map((l) => ({ date: l.loggedOn, kg: Number(l.weightKg) }));

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1.5fr]">
      <Card>
        <CardHeader><CardTitle>Registar peso</CardTitle></CardHeader>
        <CardContent>
          <form action={save} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="loggedOn">Data</Label>
              <Input id="loggedOn" name="loggedOn" type="date" defaultValue={today} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weightKg">Peso (kg)</Label>
              <Input id="weightKg" name="weightKg" type="number" step="0.1" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Nota</Label>
              <Input id="note" name="note" placeholder="opcional" />
            </div>
            <Button type="submit">Guardar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Evolução</CardTitle></CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem registos ainda.</p>
          ) : (
            <WeightChart data={chartData} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
