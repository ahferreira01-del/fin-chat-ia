import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell, EmptyState } from "@/components/fin/AppShell";
import { CategoryDonut } from "@/components/fin/CategoryDonut";
import { computeSummary, formatBRL, monthKey, monthLabel, todayISO, useProfile, useTransactions } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — FinanChat AI" }] }),
  component: Relatorios,
});

function shift(key: string, n: number) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function Relatorios() {
  const txs = useTransactions();
  const profile = useProfile();
  const [month, setMonth] = useState(monthKey(todayISO()));
  const all = txs.data ?? [];
  const s = computeSummary(all, profile.data?.initial_balance ?? 0, month);
  const prev = computeSummary(all, 0, shift(month, -1));

  const series = useMemo(() => {
    let running = profile.data?.initial_balance ?? 0;
    const months = Array.from({ length: 6 }, (_, i) => shift(month, i - 5));
    const before = all.filter((t) => monthKey(t.occurred_on) < months[0]);
    for (const t of before) running += t.type === "receita" ? t.amount : -t.amount;
    return months.map((m) => {
      const r = computeSummary(all, 0, m);
      running += r.monthIncome - r.monthExpense;
      return { m: monthLabel(m), Receitas: r.monthIncome, Despesas: r.monthExpense, Saldo: running };
    });
  }, [all, month, profile.data?.initial_balance]);

  const diff = prev.monthExpense ? ((s.monthExpense - prev.monthExpense) / prev.monthExpense) * 100 : null;

  return (
    <AppShell>
      <h1 className="text-xl font-extrabold">Relatórios</h1>
      {all.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={<BarChart3 className="h-5 w-5" />} title="Registre movimentações para visualizar relatórios." />
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-card p-2 shadow-soft">
            <button className="rounded-full p-2 hover:bg-muted" onClick={() => setMonth(shift(month, -1))} aria-label="Mês anterior">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold capitalize">
              {new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </span>
            <button className="rounded-full p-2 hover:bg-muted" onClick={() => setMonth(shift(month, 1))} aria-label="Próximo mês">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-card p-3 shadow-soft">
              <p className="text-xs text-muted-foreground">Receitas</p>
              <p className="tabular font-bold text-income">{formatBRL(s.monthIncome)}</p>
            </div>
            <div className="rounded-2xl bg-card p-3 shadow-soft">
              <p className="text-xs text-muted-foreground">Despesas</p>
              <p className="tabular font-bold text-expense">{formatBRL(s.monthExpense)}</p>
            </div>
          </div>
          {diff !== null && (
            <p className={`mt-3 rounded-xl p-3 text-sm ${diff > 0 ? "bg-muted text-alert" : "bg-accent text-accent-foreground"}`}>
              {diff > 0 ? "⚠️ " : "👏 "}Suas despesas {diff > 0 ? "subiram" : "caíram"} {Math.abs(Math.round(diff))}% em relação ao mês anterior.
            </p>
          )}

          <h2 className="mb-2 mt-6 font-bold">Gastos por categoria</h2>
          <div className="rounded-2xl bg-card p-4 shadow-soft">
            {s.byCategory.length ? <CategoryDonut data={s.byCategory} /> : <p className="text-sm text-muted-foreground">Sem despesas neste mês.</p>}
          </div>

          <h2 className="mb-2 mt-6 font-bold">Comparação mensal</h2>
          <div className="h-56 rounded-2xl bg-card p-3 shadow-soft">
            <ResponsiveContainer>
              <BarChart data={series}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis hide />
                <Tooltip formatter={(v) => formatBRL(Number(v))} />
                <Bar dataKey="Receitas" fill="var(--income)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Despesas" fill="var(--expense)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <h2 className="mb-2 mt-6 font-bold">Evolução do saldo</h2>
          <div className="h-48 rounded-2xl bg-card p-3 shadow-soft">
            <ResponsiveContainer>
              <LineChart data={series}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis hide />
                <Tooltip formatter={(v) => formatBRL(Number(v))} />
                <Line type="monotone" dataKey="Saldo" stroke="var(--primary)" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </AppShell>
  );
}
