import { db } from "@/lib/db/client";
import { shoppingLists, shoppingItems, products } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { fmtEur } from "@/lib/utils";
import ItemCheckbox from "./checkbox";
import ExportButton from "./export";

export default async function ShoppingListDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const uid = Number(session!.user.id);
  const [list] = await db.select().from(shoppingLists).where(eq(shoppingLists.id, Number(id)));
  if (!list || list.userId !== uid) notFound();

  const items = await db
    .select({
      id: shoppingItems.id,
      qtyG: shoppingItems.qtyG,
      qtyUnits: shoppingItems.qtyUnits,
      priceEur: shoppingItems.priceEur,
      checked: shoppingItems.checked,
      namePt: products.namePt,
      category: products.category,
      unit: products.unit,
    })
    .from(shoppingItems)
    .innerJoin(products, eq(products.id, shoppingItems.productId))
    .where(eq(shoppingItems.listId, list.id))
    .orderBy(asc(products.category), asc(products.namePt));

  const lines = items.map(
    (i) => `${i.checked ? "[x]" : "[ ]"} ${i.namePt} — ${Number(i.qtyUnits)}× (${Number(i.qtyG)} ${i.unit})${i.priceEur ? ` — ${fmtEur(Number(i.priceEur))}` : ""}`,
  );
  const exportText = `Lista ${list.periodStart} → ${list.periodEnd}\n\n${lines.join("\n")}\n\nTotal: ${fmtEur(Number(list.totalEur))}`;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.1em] font-medium text-muted-foreground">
            Lista · {list.periodStart} — {list.periodEnd}
          </p>
          <h1 className="font-display text-3xl font-medium tracking-tight">Compras</h1>
          <p className="font-mono text-xs text-muted-foreground">
            Total estimado <span className="tabular-nums font-semibold text-foreground">{fmtEur(Number(list.totalEur))}</span>
            {" · "}
            {items.length} produtos
          </p>
        </div>
        <ExportButton text={exportText} />
      </header>

      <Card>
        <CardContent className="p-0">
          <ul className="divide-y divide-border/60">
            {items.map((it) => (
              <li
                key={it.id}
                className={`flex items-center gap-3 p-4 transition-colors ${
                  it.checked ? "bg-muted/20" : "hover:bg-muted/10"
                }`}
              >
                <ItemCheckbox id={it.id} listId={list.id} checked={it.checked} />
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-display text-[15px] leading-tight transition-all ${
                      it.checked ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {it.namePt}
                  </div>
                  <div className="mt-0.5 text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
                    {it.category}
                  </div>
                </div>
                <div className="shrink-0 text-right font-mono tabular-nums">
                  <div className="text-[13px]">
                    {Number(it.qtyUnits)}× · {Number(it.qtyG)} {it.unit}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {it.priceEur ? fmtEur(Number(it.priceEur)) : "—"}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
