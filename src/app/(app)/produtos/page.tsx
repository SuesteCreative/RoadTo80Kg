import { db } from "@/lib/db/client";
import { products, productPrices } from "@/lib/db/schema";
import { asc, desc, eq, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fmtEur } from "@/lib/utils";
import Link from "next/link";
import EditPriceButton from "./edit-price";
import RunScrapeButton from "./run-scrape";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const all = await db.select().from(products).orderBy(asc(products.category), asc(products.namePt));

  const latestSub = db
    .select({
      productId: productPrices.productId,
      priceEur: productPrices.priceEur,
      pricePerKgEur: productPrices.pricePerKgEur,
      scrapedAt: productPrices.scrapedAt,
      promo: productPrices.promo,
      source: productPrices.source,
      rn: sql<number>`row_number() over (partition by ${productPrices.productId} order by ${productPrices.scrapedAt} desc)`.as("rn"),
    })
    .from(productPrices)
    .as("latest_sub");

  const latestPrices = await db
    .select()
    .from(latestSub)
    .where(eq(latestSub.rn, 1));

  const priceBy = new Map(latestPrices.map((p) => [p.productId, p]));

  const byCategory = new Map<string, typeof all>();
  for (const p of all) {
    const k = p.category ?? "Outro";
    const arr = byCategory.get(k) ?? [];
    arr.push(p);
    byCategory.set(k, arr);
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.1em] font-medium text-muted-foreground">
            Catálogo · Continente.pt
          </p>
          <h1 className="font-display text-3xl font-medium tracking-tight">Produtos</h1>
          <p className="text-xs text-muted-foreground">
            {all.length} produtos monitorizados
          </p>
        </div>
        <RunScrapeButton />
      </header>

      {[...byCategory.entries()].map(([cat, rows]) => (
        <section key={cat} className="space-y-3">
          <h2 className="font-display text-xl font-medium border-b border-border pb-2">{cat}</h2>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/30 text-left">
                  <tr className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
                    <th className="p-3 font-normal">Produto</th>
                    <th className="p-3 font-normal">kcal/100</th>
                    <th className="p-3 font-normal">Pack</th>
                    <th className="p-3 font-normal">Preço</th>
                    <th className="p-3 font-normal">€/kg</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => {
                    const price = priceBy.get(p.id);
                    return (
                      <tr key={p.id} className="border-b border-border/50 last:border-b-0 hover:bg-muted/20">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {p.continenteUrl ? (
                              <Link
                                href={p.continenteUrl}
                                target="_blank"
                                className="font-display text-[15px] transition-colors hover:text-primary"
                              >
                                {p.namePt}
                              </Link>
                            ) : (
                              <span className="font-display text-[15px]">{p.namePt}</span>
                            )}
                            {p.needsReview && (
                              <span className="rounded-full border border-amber-600/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-amber-700 dark:text-amber-300">
                                rever
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
                            {p.brand}
                          </div>
                        </td>
                        <td className="p-3 font-mono tabular-nums">{p.kcalPer100 ?? "—"}</td>
                        <td className="p-3 font-mono text-xs tabular-nums text-muted-foreground">
                          {Number(p.packSizeG)} {p.unit}
                        </td>
                        <td className="p-3 font-mono tabular-nums">
                          {price ? (
                            <span
                              className={price.promo ? "font-semibold text-primary" : ""}
                            >
                              {fmtEur(Number(price.priceEur))}
                            </span>
                          ) : (
                            "—"
                          )}
                          {price?.promo && (
                            <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary">
                              promo
                            </span>
                          )}
                          {price?.source === "manual" && (
                            <span className="ml-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                              manual
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono tabular-nums text-muted-foreground">
                          {price?.pricePerKgEur ? fmtEur(Number(price.pricePerKgEur)) : "—"}
                        </td>
                        <td className="p-3 text-right">
                          <EditPriceButton
                            productId={p.id}
                            name={p.namePt}
                            currentPrice={price ? Number(price.priceEur) : null}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>
      ))}
    </div>
  );
}
