"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveWeight } from "./actions";

export default function PesoForm() {
  const [pending, start] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      action={(fd) =>
        start(async () => {
          try {
            const weight = Number(fd.get("weightKg"));
            await saveWeight(fd);
            toast.success(`${weight.toFixed(1)} kg registado`, {
              description: "Gráfico actualizado.",
            });
            (document.getElementById("peso-form") as HTMLFormElement | null)?.reset();
          } catch (e) {
            toast.error("Não guardou", { description: (e as Error).message });
          }
        })
      }
      id="peso-form"
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="loggedOn">Data</Label>
        <Input id="loggedOn" name="loggedOn" type="date" defaultValue={today} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="weightKg">Peso (kg)</Label>
        <Input
          id="weightKg"
          name="weightKg"
          type="number"
          step="0.1"
          placeholder="104,5"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="note">Nota</Label>
        <Input id="note" name="note" placeholder="manhã · após ginásio · …" />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "A guardar…" : "Registar"}
      </Button>
    </form>
  );
}
