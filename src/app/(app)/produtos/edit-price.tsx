"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveManualPrice } from "./actions";

export default function EditPriceButton({
  productId,
  name,
  currentPrice,
}: {
  productId: number;
  name: string;
  currentPrice: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Editar
      </Button>
    );
  }

  return (
    <form
      action={(fd) =>
        start(async () => {
          try {
            await saveManualPrice(fd);
            toast.success("Preço guardado", { description: name });
            setOpen(false);
          } catch (e) {
            toast.error("Não guardou", { description: (e as Error).message });
          }
        })
      }
      className="flex items-center gap-2"
    >
      <input type="hidden" name="productId" value={productId} />
      <Label className="sr-only" htmlFor={`price-${productId}`}>
        Preço {name}
      </Label>
      <Input
        id={`price-${productId}`}
        name="priceEur"
        type="number"
        step="0.01"
        defaultValue={currentPrice ?? ""}
        className="h-8 w-24"
        autoFocus
        required
      />
      <Button type="submit" size="sm" disabled={pending}>
        OK
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
        ×
      </Button>
    </form>
  );
}
