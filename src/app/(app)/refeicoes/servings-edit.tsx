"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateSlotServings } from "./actions";

type MealType = "breakfast" | "snack" | "lunch" | "dinner";

export default function ServingsEdit({
  day,
  mealType,
  initial,
}: {
  day: number;
  mealType: MealType;
  initial: number;
}) {
  const [value, setValue] = useState(initial);
  const [pending, start] = useTransition();

  function commit(n: number) {
    const next = Math.max(0, Math.min(20, Math.round(n)));
    if (next === value) return;
    setValue(next);
    start(async () => {
      try {
        await updateSlotServings(day, mealType, next);
      } catch (e) {
        toast.error("Não guardou", { description: (e as Error).message });
        setValue(initial);
      }
    });
  }

  return (
    <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
      <button
        type="button"
        onClick={() => commit(value - 1)}
        disabled={pending || value <= 0}
        className="flex size-4 items-center justify-center rounded-sm border border-transparent hover:border-border hover:bg-secondary/60 disabled:opacity-30"
        aria-label="Menos refeições"
      >
        −
      </button>
      <span className="min-w-[1.25rem] text-center tabular-nums font-semibold">{value}×</span>
      <button
        type="button"
        onClick={() => commit(value + 1)}
        disabled={pending || value >= 20}
        className="flex size-4 items-center justify-center rounded-sm border border-transparent hover:border-border hover:bg-secondary/60 disabled:opacity-30"
        aria-label="Mais refeições"
      >
        +
      </button>
    </div>
  );
}
