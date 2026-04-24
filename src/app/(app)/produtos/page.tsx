import { Card, CardContent } from "@/components/ui/card";
import { fmtEur } from "@/lib/utils";
import Link from "next/link";
import EditPriceButton from "./edit-price";
import RunScrapeButton from "./run-scrape";
import RegenerateButton from "./regenerate-button";
import AddProduct from "./add-product";
import { QtyEdit, RemoveButton, ExcludeToggle } from "./row-actions";
import { auth } from "@/lib/auth/config";
import { weekStartISO } from "@/lib/calc/date";
import { ensurePlanItemsForWeek, listPlanItems, type ListedPlanItem } from "@/lib/db/plan-items";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const session = await auth();
  const uid = Number(session!.user.id);
  const ws = weekStartISO();

  await ensurePlanItemsForWeek(uid, ws);
  const items = await listPlanItems(uid, ws);

  const active = items.filter((i) => !i.excluded);
  const estimatedTotal = active.reduce((s, i) => {
    if (i.latestPrice == null || i.packSizeG == null || i.packSizeG <= 0) return s;
    const packs = Math.ceil(i.qtyG / i.packSizeG);
    return s + i.latestPrice * packs;
  }, 0);

  const byCategory = new Map<string, ListedPlanItem[]>();
  for (const it of items) {
    const k = it.category ?? "Outro";
    const arr = byCategory.get(k) ?? [];
    arr.push(it);
    byCategory.set(k, arr);
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.1em] font-medium text-muted-foreground">
            Lista da semana — {ws}
          </p>
          <h1 className="font-display text-3xl font-medium tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            Derivada do plano de refeições.{" "}
            <span className="tabular-nums font-semibold text-foreground">{active.length}</span>{" "}
            activos · total estimado{" "}
            <span className="tabular-nums font-semibold text-foreground">{fmtEur(estimatedTotal)}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RegenerateButton />
          <RunScrapeButton />
        </div>
      </header>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Sem plano da semana. Vai a{" "}
            <Link
              href="/refeicoes"
              className="underline decoration-primary/40 underline-offset-4 hover:text-primary"
            >
              Refeições → Regenerar semana
            </Link>{" "}
            primeiro.
          </CardContent>
        </Card>
      ) : (
        [...byCategory.entries()].map(([cat, rows]) => (
          <section key={cat} className="space-y-3">
            <h2 className="font-display text-xl font-medium border-b border-border pb-2">{cat}</h2>
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/30 text-left">
                    <tr className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
                      <th className="w-10 p-3" />
                      <th className="p-3 font-normal">Produto</th>
                      <th className="p-3 font-normal text-right">Quantidade</th>
                      <th className="p-3 font-normal">Pack</th>
                      <th className="p-3 font-normal">Preço</th>
                      <th className="p-3 font-normal">€/kg</th>
                      <th className="p-3 font-normal text-right">Subtotal</th>
                      <th className="p-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((it) => {
                      const pack = it.packSizeG ?? 0;
                      const units = pack > 0 ? Math.ceil(it.qtyG / pack) : 1;
                      const subtotal =
                        it.latestPrice != null && pack > 0 ? it.latestPrice * units : null;
                      return (
                        <tr
                          key={it.id}
                          className={`border-b border-border/50 last:border-b-0 hover:bg-muted/20 ${
                            it.excluded ? "opacity-40" : ""
                          }`}
                        >
                          <td className="p-3">
                            <ExcludeToggle id={it.id} excluded={it.excluded} />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {it.continenteUrl ? (
                                <Link
                                  href={it.continenteUrl}
                                  target="_blank"
                                  className="font-semibold transition-colors hover:text-primary"
                                >
                                  {it.namePt}
                                </Link>
                              ) : (
                                <span className="font-semibold">{it.namePt}</span>
                              )}
                              {it.source === "manual" && (
                                <span className="rounded-full border border-border bg-secondary px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                                  manual
                                </span>
                              )}
                              {it.needsReview && (
                                <span className="rounded-full border border-amber-600/40 bg-amber-500/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-amber-700">
                                  rever
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
                              {it.brand} · {it.kcalPer100 ?? "—"} kcal/100
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <QtyEdit id={it.id} initial={it.qtyG} unit={it.unit} />
                          </td>
                          <td className="p-3 font-mono text-xs tabular-nums text-muted-foreground">
                            {units}× · {pack} {it.unit}
                          </td>
                          <td className="p-3 font-mono tabular-nums">
                            {it.latestPrice != null ? (
                              <span className={it.promo ? "font-semibold text-primary" : ""}>
                                {fmtEur(it.latestPrice)}
                              </span>
                            ) : (
                              "—"
                            )}
                            {it.promo && (
                              <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-primary">
                                promo
                              </span>
                            )}
                            {it.priceSource === "manual" && (
                              <span className="ml-1 text-[9px] uppercase tracking-wider text-muted-foreground">
                                manual
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono tabular-nums text-muted-foreground">
                            {it.latestPricePerKg != null ? fmtEur(it.latestPricePerKg) : "—"}
                          </td>
                          <td className="p-3 text-right font-mono tabular-nums font-semibold">
                            {subtotal != null ? fmtEur(subtotal) : "—"}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-end gap-1">
                              <EditPriceButton
                                productId={it.productId}
                                name={it.namePt}
                                currentPrice={it.latestPrice}
                              />
                              <RemoveButton id={it.id} name={it.namePt} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </section>
        ))
      )}

      <AddProduct />
    </div>
  );
}
