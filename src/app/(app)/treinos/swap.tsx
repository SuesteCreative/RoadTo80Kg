"use client";
import { swapMode } from "./actions";
import { Button } from "@/components/ui/button";

export default function SwapButton({ day, currentMode }: { day: number; currentMode: string }) {
  return (
    <form action={swapMode}>
      <input type="hidden" name="day" value={day} />
      <input type="hidden" name="mode" value={currentMode} />
      <Button type="submit" variant="ghost" size="sm" className="px-2 text-xs">
        Trocar {currentMode === "indoor" ? "→ parque" : "→ casa"}
      </Button>
    </form>
  );
}
