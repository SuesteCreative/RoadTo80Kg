"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, Send, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  adjustWeekPlan,
  applyMealPlanAdjustments,
  type WeekAdjustResult,
  type SlotChange,
} from "@/lib/ai/meal-plan";

const DAY = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MEAL: Record<string, string> = {
  breakfast: "Pequeno-almoço",
  snack: "Snack",
  dinner: "Jantar",
};

const SUGGESTIONS = [
  "Todos os pequenos almoços: café com leite + algo",
  "Segunda-feira jantar mais leve",
  "Snacks da semana só fruta + proteína",
  "Fim-de-semana mais relaxado",
];

export default function AiWeekAdjust() {
  const [request, setRequest] = useState("");
  const [result, setResult] = useState<WeekAdjustResult | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const [applying, startApply] = useTransition();

  function submit(q: string = request) {
    const clean = q.trim();
    if (!clean) return;
    setResult(null);
    setExpanded(null);
    start(async () => {
      try {
        const r = await adjustWeekPlan(clean);
        setResult(r);
      } catch (e) {
        toast.error("Claude falhou", { description: (e as Error).message });
      }
    });
  }

  function apply() {
    if (!result) return;
    startApply(async () => {
      try {
        const r = await applyMealPlanAdjustments(result.changes);
        toast.success(`${r.applied} refeições ajustadas`, { description: result.summary });
        setResult(null);
        setRequest("");
      } catch (e) {
        toast.error("Não aplicou", { description: (e as Error).message });
      }
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-paper">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="size-4 text-primary" />
        Ajustar plano com IA
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Em vez de regenerar a semana ao acaso, diz o que queres mudar. Só os slots afectados são trocados.
      </p>

      <div className="mt-3 flex gap-2">
        <Textarea
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          placeholder="ex: Todos os pequenos almoços com café com leite + algo"
          rows={2}
          className="resize-none"
          disabled={pending || applying}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <Button
          onClick={() => submit()}
          disabled={pending || applying || !request.trim()}
          size="icon"
          className="self-end"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </div>

      {!result && !pending && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setRequest(s);
                submit(s);
              }}
              className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-3 rounded-md border border-primary/20 bg-paper/40 p-4">
          <p className="text-sm italic text-foreground">{result.summary}</p>
          <ul className="divide-y divide-border/60 text-sm">
            {result.changes.map((ch, idx) => (
              <SlotChangeRow
                key={idx}
                ch={ch}
                open={expanded === idx}
                onToggle={() => setExpanded(expanded === idx ? null : idx)}
              />
            ))}
          </ul>
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setResult(null)}
              disabled={applying}
            >
              <X className="size-4" />
              Descartar
            </Button>
            <Button className="flex-1" onClick={apply} disabled={applying}>
              {applying ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> A aplicar…
                </>
              ) : (
                <>
                  <Check className="size-4" />
                  Aplicar {result.changes.length}
                  {result.changes.length === 1 ? " mudança" : " mudanças"}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SlotChangeRow({
  ch,
  open,
  onToggle,
}: {
  ch: SlotChange;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="py-2">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-baseline justify-between gap-3 text-left"
      >
        <span className="flex items-baseline gap-2">
          <span className="min-w-16 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
            {DAY[ch.day]} · {MEAL[ch.meal_type]}
          </span>
          <span className="font-semibold">{ch.recipe.name}</span>
        </span>
        <span className="text-[11px] text-muted-foreground">
          {ch.recipe.prep_min} min · {open ? "fechar" : "ver"}
        </span>
      </button>
      {open && (
        <div className="mt-2 space-y-2 rounded-md bg-background/60 p-3 text-xs">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
              Ingredientes
            </p>
            <ul className="space-y-0.5">
              {ch.recipe.ingredients.map((i, idx) => (
                <li key={idx} className="flex justify-between font-mono">
                  <span>{i.product_sku}</span>
                  <span className="tabular-nums text-muted-foreground">{i.qty_g} g</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
              Preparação
            </p>
            <pre className="whitespace-pre-wrap font-sans leading-relaxed">
              {ch.recipe.instructions_md}
            </pre>
          </div>
        </div>
      )}
    </li>
  );
}
