import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { scrapeRuns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { scrapeAll } from "@/lib/scrape/continente";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [run] = await db.insert(scrapeRuns).values({ status: "ok" }).returning();
  const r = await scrapeAll();
  await db
    .update(scrapeRuns)
    .set({
      finishedAt: new Date(),
      status: r.errors.length === 0 ? "ok" : r.ok > 0 ? "partial" : "failed",
      productsFound: r.ok,
      errors: r.errors,
    })
    .where(eq(scrapeRuns.id, run.id));

  return NextResponse.json({ runId: run.id, ok: r.ok, errors: r.errors.length });
}
