"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Area, ComposedChart } from "recharts";

export default function WeightChart({ data }: { data: { date: string; kg: number }[] }) {
  const withRolling = data.map((row, i) => {
    const window = data.slice(Math.max(0, i - 6), i + 1);
    const avg = window.reduce((s, r) => s + r.kg, 0) / window.length;
    return { ...row, avg: Number(avg.toFixed(2)) };
  });

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <ComposedChart data={withRolling} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="date"
            fontSize={10}
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v.slice(5)}
          />
          <YAxis
            domain={["dataMin - 1", "dataMax + 1"]}
            fontSize={10}
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            width={38}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 6,
              fontSize: 12,
              fontFamily: "var(--font-mono)",
            }}
            labelStyle={{ color: "hsl(var(--muted-foreground))" }}
            formatter={(v: number, name) => [`${v.toFixed(2)} kg`, name === "kg" ? "pesagem" : "média 7d"]}
          />
          <Area type="monotone" dataKey="avg" stroke="none" fill="url(#avgGrad)" />
          <Line
            type="monotone"
            dataKey="kg"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1}
            dot={{ r: 2, fill: "hsl(var(--muted-foreground))", stroke: "none" }}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="avg"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
