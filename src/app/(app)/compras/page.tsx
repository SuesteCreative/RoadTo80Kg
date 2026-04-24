import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { shoppingLists } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { fmtEur } from "@/lib/utils";
import GenerateButton from "./generate-button";

export default async function ComprasPage() {
  const session = await auth();
  const uid = Number(session!.user.id);
  const lists = await db
    .select()
    .from(shoppingLists)
    .where(eq(shoppingLists.userId, uid))
    .orderBy(desc(shoppingLists.generatedAt))
    .limit(10);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Mantimentos
        </p>
        <h1 className="font-display text-3xl font-medium tracking-tight">Listas de compras</h1>
      </header>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 gap-3">
          <CardTitle>Biquinzenais</CardTitle>
          <GenerateButton />
        </CardHeader>
        <CardContent>
          {lists.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem listas. Gera a próxima a partir do plano.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {lists.map((l) => (
                <li key={l.id} className="group flex items-center justify-between py-3 text-sm first:pt-0 last:pb-0">
                  <Link
                    href={`/compras/${l.id}`}
                    className="flex items-baseline gap-3 font-display text-base transition-colors group-hover:text-primary"
                  >
                    <span>{l.periodStart}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">→</span>
                    <span>{l.periodEnd}</span>
                  </Link>
                  <span className="font-mono text-sm tabular-nums text-muted-foreground">
                    {fmtEur(Number(l.totalEur))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
