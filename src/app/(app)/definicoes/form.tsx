"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Save, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveAiNotes } from "./actions";

const QUICK_LINES = [
  "Não gosto de lentilhas.",
  "Alergia a frutos secos.",
  "Sem lactose.",
  "Sem pimenta picante.",
  "Treinos: joelho direito sensível, evitar saltos.",
  "Preferência por receitas até 20 minutos.",
  "Não como porco.",
  "Café com leite todas as manhãs.",
];

export default function AiNotesForm({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [pending, start] = useTransition();

  function addLine(line: string) {
    setValue((v) => {
      const next = (v.trim() ? v.trim() + "\n" : "") + line;
      return next.slice(0, 4000);
    });
  }

  function submit(fd: FormData) {
    start(async () => {
      try {
        await saveAiNotes(fd);
        toast.success("Regras guardadas", {
          description: "Claude lerá em cada chamada de IA.",
        });
      } catch (e) {
        toast.error("Não guardou", { description: (e as Error).message });
      }
    });
  }

  return (
    <form action={submit} className="space-y-4">
      <Textarea
        name="aiNotes"
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, 4000))}
        rows={10}
        placeholder={`Uma regra por linha. Exemplos:\n- Não gosto de lentilhas.\n- Sem lactose.\n- Treinos sem saltos, joelho sensível.`}
        className="font-mono text-sm leading-relaxed"
      />
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="tabular-nums">{value.length} / 4000</span>
        <span>
          Cmd/Ctrl+Enter para guardar
        </span>
      </div>

      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.1em] font-medium text-muted-foreground">
          Sugestões (clica para acrescentar)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_LINES.map((line) => (
            <button
              key={line}
              type="button"
              onClick={() => addLine(line)}
              className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Plus className="size-3" />
              {line}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        <Save className="size-4" />
        {pending ? "A guardar…" : "Guardar regras"}
      </Button>
    </form>
  );
}
