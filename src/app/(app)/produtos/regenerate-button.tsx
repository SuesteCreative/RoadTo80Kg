"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { regeneratePlan } from "./actions";

export default function RegenerateButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            const r = await regeneratePlan();
            toast.success("Lista recalculada", {
              description: `+${r.inserted} · ~${r.updated} · −${r.removed}`,
            });
          } catch (e) {
            toast.error("Não recalculou", { description: (e as Error).message });
          }
        })
      }
    >
      <RotateCcw className={`size-3.5 ${pending ? "animate-spin" : ""}`} />
      {pending ? "A recalcular…" : "Recalcular do plano"}
    </Button>
  );
}
