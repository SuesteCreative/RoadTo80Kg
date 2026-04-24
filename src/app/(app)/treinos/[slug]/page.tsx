import { db } from "@/lib/db/client";
import { workouts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Timer from "./timer";

export default async function TreinoDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [w] = await db.select().from(workouts).where(eq(workouts.slug, slug));
  if (!w) notFound();

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>{w.namePt}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {w.mode === "indoor" ? "Em casa" : "Ar livre"} · {w.durationMin} min
            {w.equipment.length > 0 && ` · ${w.equipment.join(", ")}`}
          </p>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{w.instructionsMd}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cronómetro</CardTitle></CardHeader>
        <CardContent>
          <Timer defaultMinutes={w.durationMin} />
        </CardContent>
      </Card>
    </div>
  );
}
