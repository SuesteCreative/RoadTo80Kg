"use client";
import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { triggerScrape } from "./actions";

export default function RunScrapeButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-3">
      {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setMsg(null);
            const r = await triggerScrape();
            setMsg(`${r.ok} actualizados, ${r.errors.length} falhas`);
          })
        }
      >
        {pending ? "A correr…" : "Correr scrape agora"}
      </Button>
    </div>
  );
}
