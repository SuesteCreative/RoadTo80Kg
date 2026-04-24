import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { shoppingLists, shoppingItems, products } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { fmtEur } from "@/lib/utils";
import { generateBiweekly } from "./actions";

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
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Listas de compras</CardTitle>
          <form action={generateBiweekly}>
            <Button type="submit" size="sm">Gerar próximas 2 semanas</Button>
          </form>
        </CardHeader>
        <CardContent>
          {lists.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem listas. Gera a próxima a partir do plano.</p>
          ) : (
            <ul className="divide-y">
              {lists.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/compras/${l.id}`} className="hover:underline">
                    {l.periodStart} → {l.periodEnd}
                  </Link>
                  <span className="text-muted-foreground tabular-nums">{fmtEur(Number(l.totalEur))}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
