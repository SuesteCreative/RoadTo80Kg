import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AiNotesForm from "./form";
import Link from "next/link";

export default async function DefinicoesPage() {
  const session = await auth();
  const uid = Number(session!.user.id);
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, uid));

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.1em] font-medium text-muted-foreground">
          Definições
        </p>
        <h1 className="font-display text-3xl font-medium tracking-tight">Preferências AI</h1>
      </header>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Regras e contexto para o Claude</CardTitle>
          <CardDescription>
            Escreve regras em linguagem natural. O Claude lê este bloco em cada chamada —
            ajuste de receitas, variantes de treino, coach. Uma regra por linha funciona melhor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AiNotesForm initial={profile?.aiNotes ?? ""} />
        </CardContent>
      </Card>

      {!profile && (
        <p className="text-sm text-muted-foreground">
          Precisas de configurar{" "}
          <Link href="/perfil" className="underline decoration-primary/40 underline-offset-4">
            perfil
          </Link>{" "}
          primeiro.
        </p>
      )}
    </div>
  );
}
