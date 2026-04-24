import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { profiles, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PerfilForm from "./form";

export default async function PerfilPage() {
  const session = await auth();
  const uid = Number(session!.user.id);
  const [user] = await db.select().from(users).where(eq(users.id, uid));
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, uid));

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.1em] font-medium text-muted-foreground">
          Parâmetros pessoais
        </p>
        <h1 className="font-display text-3xl font-medium tracking-tight">
          Perfil — {user.displayName}
        </h1>
      </header>
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Medidas e objectivo</CardTitle>
          <CardDescription>
            Usado para calcular alvo calórico diário (Mifflin-St Jeor) e macros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PerfilForm profile={profile ?? null} />
        </CardContent>
      </Card>
    </div>
  );
}
