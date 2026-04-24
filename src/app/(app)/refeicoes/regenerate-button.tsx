"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { regenerateWeek } from "./actions";
import { Sparkles } from "lucide-react";

export default function RegenerateButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            const r = await regenerateWeek();
            toast.success("Nova semana gerada", {
              description: `${r.days} dias, média ${r.avgKcal} kcal/dia.`,
            });
          } catch (e) {
            toast.error("Não gerou", { description: (e as Error).message });
          }
        })
      }
    >
      <Sparkles className="size-3.5" />
      {pending ? "A gerar…" : "Regenerar semana"}
    </Button>
  );
}
