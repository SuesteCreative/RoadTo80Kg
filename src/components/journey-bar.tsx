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

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        <span>{startKg.toFixed(0)} kg — partida</span>
        <span>{targetKg.toFixed(0)} kg — alvo</span>
      </div>

      <div className="relative h-9 overflow-hidden rounded-sm border border-border bg-muted/40">
        {/* milestones (every 5 kg between start and target) */}
        <div className="absolute inset-0 flex justify-between px-0">
          {[...Array(Math.max(0, Math.floor(total / 5) + 1))].map((_, i) => (
            <span
              key={i}
              className="h-full w-px bg-border/70"
              style={{ marginLeft: i === 0 ? 0 : undefined }}
            />
          ))}
        </div>
        <div
          className="relative h-full bg-primary/80 transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        >
          <div className="absolute right-0 top-0 flex h-full w-[2px] bg-primary shadow-[0_0_0_2px_hsl(var(--background))]" />
        </div>
        <div
          className="absolute top-1/2 -translate-y-1/2 select-none rounded-full border border-primary bg-background px-2 py-0.5 font-mono text-[11px] font-semibold text-primary shadow-[0_2px_8px_rgba(0,0,0,.08)]"
          style={{ left: `calc(${pct}% - 1.75rem)` }}
        >
          {currentKg.toFixed(1)}
        </div>
      </div>

      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {remaining.toFixed(1)} kg por {losing ? "perder" : "ganhar"} — {pct.toFixed(0)}% feito
      </p>
    </div>
  );
}
