"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Pause, RotateCcw } from "lucide-react";

function beep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
    setTimeout(() => ctx.close(), 300);
  } catch {}
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function Timer({ defaultMinutes }: { defaultMinutes: number }) {
  const total = defaultMinutes * 60;
  const [seconds, setSeconds] = useState(total);
  const [intervalSec, setIntervalSec] = useState(45);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 0) {
          beep();
          setRunning(false);
          return 0;
        }
        const next = s - 1;
        const elapsed = total - next;
        if (elapsed > 0 && elapsed % intervalSec === 0) beep();
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, intervalSec, total]);

  const pct = ((total - seconds) / total) * 100;
  const nearEnd = seconds <= 10 && seconds > 0 && running;

  return (
    <div className="space-y-5">
      <div className="relative grid place-items-center rounded-lg border border-border bg-paper/40 p-8">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-b-lg bg-muted/40"
        >
          <div
            className="h-full bg-primary transition-[width] duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p
          className={`font-display text-7xl font-medium leading-none tabular-nums tracking-tight transition-colors md:text-8xl ${
            nearEnd ? "text-primary" : "text-foreground"
          }`}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {fmt(seconds)}
        </p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {seconds === 0 ? "concluído" : running ? "em curso" : "pausado"}
        </p>
      </div>

      <div className="flex justify-center gap-2">
        <Button size="lg" onClick={() => setRunning((r) => !r)} className="min-w-32">
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
          {running ? "Pausar" : seconds === total ? "Iniciar" : "Retomar"}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            setRunning(false);
            setSeconds(total);
          }}
        >
          <RotateCcw className="size-4" />
          Repor
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bell">Beep a cada</Label>
        <div className="flex items-center gap-2">
          <Input
            id="bell"
            type="number"
            min={5}
            max={600}
            value={intervalSec}
            onChange={(e) => setIntervalSec(Math.max(5, Number(e.target.value) || 45))}
          />
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">seg</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Sinal ao fim do tempo + a cada intervalo (trocas de exercício).
        </p>
      </div>
    </div>
  );
}
