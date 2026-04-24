"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveProfile } from "./actions";

type Profile = {
  sex: "M" | "F";
  birthdate: string;
  heightCm: string;
  activityLevel: "sedentary" | "light" | "moderate" | "heavy";
  targetWeightKg: string;
  deficitKcal: number;
} | null;

export default function PerfilForm({ profile }: { profile: Profile }) {
  const [pending, start] = useTransition();

  return (
    <form
      action={(fd) =>
        start(async () => {
          try {
            await saveProfile(fd);
            toast.success("Perfil actualizado", {
              description: "Alvos recalculados com o novo peso.",
            });
          } catch (e) {
            toast.error("Não guardou", {
              description: (e as Error).message,
            });
          }
        })
      }
      className="grid grid-cols-1 gap-5 md:grid-cols-2"
    >
      <div className="space-y-2">
        <Label>Sexo</Label>
        <select
          name="sex"
          defaultValue={profile?.sex ?? "M"}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <option value="M">Masculino</option>
          <option value="F">Feminino</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="birthdate">Nascimento</Label>
        <Input id="birthdate" name="birthdate" type="date" defaultValue={profile?.birthdate ?? ""} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="heightCm">Altura (cm)</Label>
        <Input
          id="heightCm"
          name="heightCm"
          type="number"
          step="1"
          min="120"
          max="230"
          placeholder="184"
          defaultValue={profile?.heightCm ?? ""}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Actividade</Label>
        <select
          name="activityLevel"
          defaultValue={profile?.activityLevel ?? "sedentary"}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <option value="sedentary">Sedentário (×1,2)</option>
          <option value="light">Ligeiro (×1,375)</option>
          <option value="moderate">Moderado (×1,55)</option>
          <option value="heavy">Intenso (×1,725)</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="targetWeightKg">Peso alvo (kg)</Label>
        <Input
          id="targetWeightKg"
          name="targetWeightKg"
          type="number"
          step="0.1"
          defaultValue={profile?.targetWeightKg ?? "80"}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="deficitKcal">Défice (kcal/dia)</Label>
        <Input
          id="deficitKcal"
          name="deficitKcal"
          type="number"
          defaultValue={profile?.deficitKcal ?? 300}
          required
        />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending} className="min-w-28">
          {pending ? "A guardar…" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
