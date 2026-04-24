"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { removeItem, toggleExcluded, updateItemQty } from "./actions";

export function QtyEdit({
  id,
  initial,
  unit,
}: {
  id: number;
  initial: number;
  unit: "g" | "ml" | "un";
}) {
  const [value, setValue] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  function commit() {
    const n = Math.max(0, Math.round(value));
    if (n === initial) {
      setEditing(false);
      return;
    }
    start(async () => {
      try {
        await updateItemQty(id, n);
        toast.success(`${n} ${unit} guardado`);
        setEditing(false);
      } catch (e) {
        toast.error("Não guardou", { description: (e as Error).message });
        setValue(initial);
      }
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="font-mono tabular-nums hover:text-primary"
      >
        {initial} {unit}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setValue(initial);
            setEditing(false);
          }
        }}
        autoFocus
        disabled={pending}
        className="h-7 w-20 text-sm"
      />
      <Button size="icon" variant="ghost" className="size-7" onClick={commit} disabled={pending}>
        <Check className="size-3.5" />
      </Button>
    </div>
  );
}

export function RemoveButton({ id, name }: { id: number; name: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 text-muted-foreground hover:text-destructive"
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            await removeItem(id);
            toast.success("Removido", { description: name });
          } catch (e) {
            toast.error("Não removeu", { description: (e as Error).message });
          }
        })
      }
      aria-label={`Remover ${name}`}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}

export function ExcludeToggle({
  id,
  excluded,
}: {
  id: number;
  excluded: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <input
      type="checkbox"
      checked={!excluded}
      disabled={pending}
      onChange={() =>
        start(async () => {
          try {
            await toggleExcluded(id);
          } catch (e) {
            toast.error((e as Error).message);
          }
        })
      }
      className="size-4 accent-primary cursor-pointer"
    />
  );
}
