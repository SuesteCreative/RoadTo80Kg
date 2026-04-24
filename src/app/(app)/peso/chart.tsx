"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function WeightChart({ data }: { data: { date: string; kg: number }[] }) {
  const withRolling = data.map((row, i) => {
    const window = data.slice(Math.max(0, i - 6), i + 1);
    const avg = window.reduce((s, r) => s + r.kg, 0) / window.length;
    return { ...row, avg: Number(avg.toFixed(2)) };
  });

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={withRolling}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" fontSize={11} />
          <YAxis domain={["auto", "auto"]} fontSize={11} />
          <Tooltip />
          <Line type="monotone" dataKey="kg" stroke="hsl(var(--muted-foreground))" dot={false} />
          <Line type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
