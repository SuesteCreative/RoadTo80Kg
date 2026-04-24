"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  suggestRecipeAdjustment,
  saveAdjustedAsVariant,
  type AdjustedRecipeResult,
} from "@/lib/ai/recipe";

const QUICK = [
  "menos hidratos",
  "mais proteína (+30g)",
  "versão mais rápida (<15 min)",
  "sem lactose",
  "substitui arroz por batata doce",
];

export default function AiAdjustRecipe({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState("");
  const [result, setResult] = useState<AdjustedRecipeResult | null>(null);
  const [pending, start] = useTransition();
  const [saving, startSave] = useTransition();
  const router = useRouter();

  function submit() {
    if (!request.trim()) return;
    setResult(null);
    start(async () => {
      try {
        const r = await suggestRecipeAdjustment(slug, request.trim());
        setResult(r);
      } catch (e) {
        toast.error("Claude falhou", { description: (e as Error).message });
      }
    });
  }

  function accept() {
    if (!result) return;
    startSave(async () => {
      try {
        const r = await saveAdjustedAsVariant(slug, result);
        toast.success("Guardado como variante");
        setOpen(false);
        router.push(`/receitas/${r.slug}`);
      } catch (e) {
        toast.error("Não guardou", { description: (e as Error).message });
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setResult(null);
          setRequest("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="size-3.5" />
          Pedir ajuste
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajustar receita com IA</DialogTitle>
          <DialogDescription>
            Diz o que queres mudar. Ingredientes têm de ficar na pantry Continente.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="req">Pedido</Label>
              <Textarea
                id="req"
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                placeholder="ex: substitui frango por atum e mete mais vegetais"
                rows={3}
                disabled={pending}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setRequest(q)}
                  disabled={pending}
                  className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
            <Button onClick={submit} disabled={pending || !request.trim()} className="w-full">
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> A pensar…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" /> Gerar variante
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-paper/40 p-4 max-h-[50vh] overflow-y-auto space-y-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
                  Proposta
                </p>
                <h3 className="font-display text-xl font-medium">{result.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {result.meal_type} · {result.servings} dose(s) · {result.prep_min} min
                </p>
              </div>
              {result.notes && (
                <p className="text-sm italic text-muted-foreground border-l-2 border-primary/40 pl-3">
                  {result.notes}
                </p>
              )}
              <div>
                <p className="mb-1 text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
                  Ingredientes
                </p>
                <ul className="text-sm font-mono space-y-0.5">
                  {result.ingredients.map((i, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>{i.product_sku}</span>
                      <span className="tabular-nums text-muted-foreground">{i.qty_g} g</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
                  Preparação
                </p>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {result.instructions_md}
                </pre>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                }}
                disabled={saving}
                className="flex-1"
              >
                Descartar
              </Button>
              <Button onClick={accept} disabled={saving} className="flex-1">
                {saving ? "A guardar…" : "Guardar como variante"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
