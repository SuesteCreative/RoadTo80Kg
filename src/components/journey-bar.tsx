type Props = {
  startKg: number;
  currentKg: number;
  targetKg: number;
};

export function JourneyBar({ startKg, currentKg, targetKg }: Props) {
  const losing = startKg > targetKg;
  const total = Math.max(0.01, Math.abs(startKg - targetKg));
  const done = losing
    ? Math.max(0, startKg - currentKg)
    : Math.max(0, currentKg - startKg);
  const pct = Math.max(0, Math.min(100, (done / total) * 100));
  const remaining = Math.max(0, losing ? currentKg - targetKg : targetKg - currentKg);
  // clamp marker position so the badge stays fully inside the bar
  const markerLeftPct = Math.max(4, Math.min(96, pct));

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between text-[11px] uppercase tracking-[0.08em] font-medium text-muted-foreground">
        <span><span className="tabular-nums">{startKg.toFixed(0)}</span> kg — partida</span>
        <span><span className="tabular-nums">{targetKg.toFixed(0)}</span> kg — alvo</span>
      </div>

      <div className="relative h-9 overflow-visible rounded-sm border border-border bg-muted/40">
        {/* milestones (every 5 kg between start and target) */}
        <div className="pointer-events-none absolute inset-0 flex justify-between overflow-hidden rounded-sm">
          {[...Array(Math.max(0, Math.floor(total / 5) + 1))].map((_, i) => (
            <span key={i} className="h-full w-px bg-border/70" />
          ))}
        </div>
        <div
          className="relative h-full overflow-hidden rounded-sm bg-primary/80 transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
        <div
          className="pointer-events-none absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 rounded-full border border-primary bg-background px-2 py-0.5 font-semibold text-primary shadow-[0_2px_8px_rgba(0,0,0,.08)]"
          style={{ left: `${markerLeftPct}%` }}
        >
          <span className="tabular-nums text-[12px]">{currentKg.toFixed(1)}</span>
          <span className="text-[10px] opacity-70">kg</span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        <span className="tabular-nums text-foreground">{remaining.toFixed(1)} kg</span>{" "}
        por {losing ? "perder" : "ganhar"} · <span className="tabular-nums">{pct.toFixed(0)}%</span> feito
      </p>
    </div>
  );
}
