"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function beep() {
  try {
    const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
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
  const [seconds, setSeconds] = useState(defaultMinutes * 60);
  const [intervalSec, setIntervalSec] = useState(45);
  const [running, setRunning] = useState(false);
  const nextBeepRef = useRef<number>(intervalSec);

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
        const elapsed = defaultMinutes * 60 - next;
        if (elapsed > 0 && elapsed % intervalSec === 0) beep();
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, intervalSec, defaultMinutes]);

  useEffect(() => {
    nextBeepRef.current = intervalSec;
  }, [intervalSec]);

  return (
    <div className="space-y-4">
      <p className="text-center font-mono text-6xl tabular-nums">{fmt(seconds)}</p>
      <div className="flex justify-center gap-2">
        <Button onClick={() => setRunning((r) => !r)}>{running ? "Pausar" : "Iniciar"}</Button>
        <Button
          variant="outline"
          onClick={() => {
            setRunning(false);
            setSeconds(defaultMinutes * 60);
          }}
        >
          Repor
        </Button>
      </div>
      <div className="space-y-2">
        <Label>Beep a cada (s)</Label>
        <Input
          type="number"
          min={5}
          max={600}
          value={intervalSec}
          onChange={(e) => setIntervalSec(Math.max(5, Number(e.target.value) || 45))}
        />
        <p className="text-xs text-muted-foreground">
          Beep ao fim do tempo e a cada intervalo (útil para troca de exercícios).
        </p>
      </div>
    </div>
  );
}
