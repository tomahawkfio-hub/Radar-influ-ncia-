import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtCompact, fmtInt } from "@/lib/format";

export type Series = { key: string; label: string; points: { t: string; v: number | null }[] };

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

export function HistoryChart({ series, height = 300, valueLabel = "Seguidores" }: { series: Series[]; height?: number; valueLabel?: string }) {
  const map = new Map<string, Record<string, number | string | null>>();
  for (const s of series)
    for (const p of s.points) {
      const day = p.t.slice(0, 10);
      const row = map.get(day) ?? { day };
      row[s.key] = p.v;
      map.set(day, row);
    }
  const data = [...map.values()].sort((a, b) => String(a['day']).localeCompare(String(b['day'])));

  if (data.length < 2)
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground" style={{ height }}>
        Histórico insuficiente para o período (mínimo de 2 snapshots).
      </div>
    );

  return (
    <div style={{ height }} role="img" aria-label={`Gráfico de evolução de ${valueLabel.toLowerCase()}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={(d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" })}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            minTickGap={32}
          />
          <YAxis
            tickFormatter={(v: number) => fmtCompact(v)}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={52}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}
            labelFormatter={(d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("pt-BR", { timeZone: "UTC", dateStyle: "medium" })}
            formatter={(v: number, name: string) => [fmtInt(v), series.find((s) => s.key === name)?.label ?? name]}
          />
          {series.length > 1 && <Legend formatter={(k: string) => series.find((s) => s.key === k)?.label ?? k} wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s, i) => (
            <Line key={s.key} type="monotone" dataKey={s.key} stroke={COLORS[i % 4]} strokeWidth={2} dot={false} connectNulls isAnimationActive />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}