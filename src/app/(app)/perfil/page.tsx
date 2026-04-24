import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { profiles, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  sex: z.enum(["M", "F"]),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  heightCm: z.coerce.number().min(120).max(230),
  activityLevel: z.enum(["sedentary", "light", "moderate", "heavy"]),
  targetWeightKg: z.coerce.number().min(40).max(200),
  deficitKcal: z.coerce.number().min(0).max(1000),
});

export default async function PerfilPage() {
  const session = await auth();
  const uid = Number(session!.user.id);
  const [user] = await db.select().from(users).where(eq(users.id, uid));
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, uid));

  async function save(formData: FormData) {
    "use server";
    const parsed = schema.parse(Object.fromEntries(formData));
    await db
      .insert(profiles)
      .values({
        userId: uid,
        ...parsed,
        heightCm: String(parsed.heightCm),
        targetWeightKg: String(parsed.targetWeightKg),
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          sex: parsed.sex,
          birthdate: parsed.birthdate,
          heightCm: String(parsed.heightCm),
          activityLevel: parsed.activityLevel,
          targetWeightKg: String(parsed.targetWeightKg),
          deficitKcal: parsed.deficitKcal,
          updatedAt: new Date(),
        },
      });
    revalidatePath("/perfil");
    revalidatePath("/");
  }

  return (
    <Card className="max-w-xl">
      <CardHeader><CardTitle>Perfil — {user.displayName}</CardTitle></CardHeader>
      <CardContent>
        <form action={save} className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Sexo</Label>
            <select name="sex" defaultValue={profile?.sex ?? "M"} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthdate">Nascimento</Label>
            <Input id="birthdate" name="birthdate" type="date" defaultValue={profile?.birthdate ?? ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="heightCm">Altura (cm)</Label>
            <Input id="heightCm" name="heightCm" type="number" step="1" min="120" max="230" placeholder="184" defaultValue={profile?.heightCm ?? ""} required />
          </div>
          <div className="space-y-2">
            <Label>Actividade</Label>
            <select name="activityLevel" defaultValue={profile?.activityLevel ?? "sedentary"} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="sedentary">Sedentário (x1.2)</option>
              <option value="light">Ligeiro (x1.375)</option>
              <option value="moderate">Moderado (x1.55)</option>
              <option value="heavy">Intenso (x1.725)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetWeightKg">Peso alvo (kg)</Label>
            <Input id="targetWeightKg" name="targetWeightKg" type="number" step="0.1" defaultValue={profile?.targetWeightKg ?? "80"} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deficitKcal">Défice (kcal/dia)</Label>
            <Input id="deficitKcal" name="deficitKcal" type="number" defaultValue={profile?.deficitKcal ?? 300} required />
          </div>
          <div className="col-span-2">
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
