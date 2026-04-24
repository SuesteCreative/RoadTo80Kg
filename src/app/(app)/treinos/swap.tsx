"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { swapMode } from "./actions";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";

export default function SwapButton({ day, currentMode }: { day: number; currentMode: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-[11px]"
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            const fd = new FormData();
            fd.set("day", String(day));
            fd.set("mode", currentMode);
            await swapMode(fd);
            toast.success(`Trocado para ${currentMode === "indoor" ? "ar livre" : "sala"}`);
          } catch (e) {
            toast.error("Não trocou", { description: (e as Error).message });
          }
        })
      }
    >
      <ArrowRightLeft className="size-3" />
      {currentMode === "indoor" ? "Parque" : "Sala"}
    </Button>
  );
}
