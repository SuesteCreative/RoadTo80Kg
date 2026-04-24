"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { triggerScrape } from "./actions";

export default function RunScrapeButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          toast.loading("A contactar continente.pt…", { id: "scrape" });
          try {
            const r = await triggerScrape();
            if (r.errors.length === 0) {
              toast.success("Preços actualizados", {
                id: "scrape",
                description: `${r.ok} produtos sincronizados.`,
              });
            } else {
              toast.warning(`${r.ok} OK · ${r.errors.length} falhas`, {
                id: "scrape",
                description: "Produtos com falha ficam marcados como 'rever'.",
              });
            }
          } catch (e) {
            toast.error("Scrape falhou", { id: "scrape", description: (e as Error).message });
          }
        })
      }
    >
      <RefreshCw className={`size-3.5 ${pending ? "animate-spin" : ""}`} />
      {pending ? "A correr…" : "Actualizar preços"}
    </Button>
  );
}
