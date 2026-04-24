"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { askCoach } from "@/lib/ai/coach";

const SUGGESTIONS = [
  "Como lidar com fim-de-semana sem sair do défice?",
  "Dicas para quebrar platô de 2 semanas",
  "Estratégia de hidratação para corrida em zona 2",
  "Como manter saciedade com 2160 kcal",
];

export default function CoachWidget() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(q: string = question) {
    const clean = q.trim();
    if (!clean) return;
    setAnswer(null);
    start(async () => {
      try {
        const a = await askCoach(clean);
        setAnswer(a);
      } catch (e) {
        toast.error("Claude falhou", { description: (e as Error).message });
      }
    });
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="topo pointer-events-none absolute inset-0 opacity-30" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          Pergunta ao coach
        </CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-3">
        <div className="flex gap-2">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="ex: como manter proteína sem lactose?"
            rows={2}
            className="resize-none"
            disabled={pending}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <Button
            onClick={() => submit()}
            disabled={pending || !question.trim()}
            size="icon"
            className="self-end"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>

        {!answer && !pending && (
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQuestion(s);
                  submit(s);
                }}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {answer && (
          <div className="rounded-md border border-border bg-paper/40 p-3">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{answer}</pre>
            <button
              type="button"
              onClick={() => setAnswer(null)}
              className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary"
            >
              outra pergunta →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
