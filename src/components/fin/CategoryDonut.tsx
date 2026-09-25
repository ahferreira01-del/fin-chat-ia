import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { CATEGORY_COLORS, formatBRL } from "@/lib/finance";

export function CategoryDonut({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-36 w-36 shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={44} outerRadius={66} paddingAngle={2} stroke="none">
              {data.map((d) => (
                <Cell key={d.name} fill={CATEGORY_COLORS[d.name] ?? "var(--chart-7)"} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] text-muted-foreground">Total</span>
          <span className="tabular text-xs font-bold">{formatBRL(total)}</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5 text-xs">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_COLORS[d.name] }} />
            <span className="flex-1 truncate">{d.name}</span>
            <span className="tabular text-muted-foreground">{Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
