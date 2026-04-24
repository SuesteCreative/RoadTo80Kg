"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateBiweekly } from "./actions";
import { fmtEur } from "@/lib/utils";

export default function GenerateButton() {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button
      type="button"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            toast.loading("A agregar ingredientes…", { id: "gen-list" });
            const r = await generateBiweekly();
            toast.success("Lista pronta", {
              id: "gen-list",
              description: `${r.itemCount} produtos · ${fmtEur(r.totalEur)}`,
            });
            router.push(`/compras/${r.listId}`);
          } catch (e) {
            toast.error("Não gerou", { id: "gen-list", description: (e as Error).message });
          }
        })
      }
    >
      {pending ? "A gerar…" : "Gerar próximas 2 semanas"}
    </Button>
  );
}
