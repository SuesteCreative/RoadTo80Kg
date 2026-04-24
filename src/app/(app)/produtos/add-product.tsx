"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addManualItem, searchProducts } from "./actions";

type Hit = { id: number; namePt: string; category: string | null; brand: string | null };

export default function AddProduct() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [selected, setSelected] = useState<Hit | null>(null);
  const [qty, setQty] = useState(500);
  const [searching, startSearch] = useTransition();
  const [adding, startAdd] = useTransition();

  function runSearch(v: string) {
    setQuery(v);
    if (v.trim().length < 2) {
      setHits([]);
      return;
    }
    startSearch(async () => {
      try {
        const r = await searchProducts(v);
        setHits(r);
      } catch {
        setHits([]);
      }
    });
  }

  function add() {
    if (!selected) return;
    startAdd(async () => {
      try {
        await addManualItem(selected.id, qty);
        toast.success("Adicionado", { description: selected.namePt });
        setSelected(null);
        setQuery("");
        setHits([]);
        setQty(500);
      } catch (e) {
        toast.error("Não adicionou", { description: (e as Error).message });
      }
    });
  }

  return (
    <div className="rounded-lg border border-dashed border-border bg-paper/30 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Plus className="size-4 text-primary" />
        Adicionar produto manual
      </div>

      {!selected ? (
        <div className="space-y-2">
          <Input
            value={query}
            onChange={(e) => runSearch(e.target.value)}
            placeholder="Procurar no catálogo (ex: frango, aveia)…"
          />
          {searching && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> a procurar…
            </p>
          )}
          {hits.length > 0 && (
            <ul className="max-h-48 divide-y divide-border/60 overflow-y-auto rounded-md border border-border bg-background">
              {hits.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(h)}
                    className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-secondary/60"
                  >
                    <span className="font-medium">{h.namePt}</span>
                    <span className="text-[11px] text-muted-foreground">{h.category}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {query.trim().length >= 2 && !searching && hits.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Sem resultados. (Ainda não é possível criar SKUs novos directo aqui.)
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-semibold">{selected.namePt}</p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-28"
            />
            <span className="text-sm text-muted-foreground">g</span>
            <Button onClick={add} disabled={adding} size="sm">
              {adding ? "A adicionar…" : "Adicionar"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
              ×
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
