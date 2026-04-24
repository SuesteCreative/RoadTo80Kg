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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{all.length} produtos</p>
        <RunScrapeButton />
      </div>

      {[...byCategory.entries()].map(([cat, rows]) => (
        <section key={cat}>
          <h2 className="mb-2 text-lg font-semibold">{cat}</h2>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    <th className="p-3 font-medium">Produto</th>
                    <th className="p-3 font-medium">kcal/100</th>
                    <th className="p-3 font-medium">Pack</th>
                    <th className="p-3 font-medium">Preço</th>
                    <th className="p-3 font-medium">€/kg</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => {
                    const price = priceBy.get(p.id);
                    return (
                      <tr key={p.id} className="border-b last:border-b-0">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {p.continenteUrl ? (
                              <Link href={p.continenteUrl} target="_blank" className="hover:underline">{p.namePt}</Link>
                            ) : (
                              <span>{p.namePt}</span>
                            )}
                            {p.needsReview && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900">rever</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">{p.brand}</div>
                        </td>
                        <td className="p-3 tabular-nums">{p.kcalPer100 ?? "—"}</td>
                        <td className="p-3 tabular-nums">{Number(p.packSizeG)} {p.unit}</td>
                        <td className="p-3 tabular-nums">
                          {price ? fmtEur(Number(price.priceEur)) : "—"}
                          {price?.promo && <span className="ml-1 text-xs text-primary">promo</span>}
                          {price?.source === "manual" && <span className="ml-1 text-xs text-muted-foreground">manual</span>}
                        </td>
                        <td className="p-3 tabular-nums text-muted-foreground">
                          {price?.pricePerKgEur ? fmtEur(Number(price.pricePerKgEur)) : "—"}
                        </td>
                        <td className="p-3 text-right">
                          <EditPriceButton productId={p.id} name={p.namePt} currentPrice={price ? Number(price.priceEur) : null} />
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
