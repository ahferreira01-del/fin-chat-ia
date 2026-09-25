import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, TrendingDown, TrendingUp, PiggyBank, Target, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell, EmptyState } from "@/components/fin/AppShell";
import { CategoryDonut } from "@/components/fin/CategoryDonut";
import { TxList } from "@/components/fin/TxList";
import { LogoMark } from "@/components/fin/Logo";
import { computeSummary, formatBRL, useGoals, useProfile, useTransactions } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Início — FinanChat AI" }] }),
  component: Dashboard,
});

function Dashboard() {
  const profile = useProfile();
  const txs = useTransactions();
  const goals = useGoals();
  const s = computeSummary(txs.data ?? [], profile.data?.initial_balance ?? 0);
  const firstName = (profile.data?.name ?? "").split(" ")[0];
  const active = (goals.data?.goals ?? []).filter((g) => !g.done);

  return (
    <AppShell>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold">Olá{firstName ? `, ${firstName}` : ""} 👋</h1>
          <p className="text-sm text-muted-foreground">Vamos ver como estão suas finanças hoje.</p>
        </div>
        <LogoMark className="h-9 w-9" />
      </header>

      <section className="mt-5 rounded-3xl bg-hero p-5 text-primary-foreground shadow-soft">
        <p className="text-sm opacity-90">Saldo atual</p>
        <p className="tabular mt-1 text-3xl font-extrabold">{formatBRL(s.balance)}</p>
        <Button asChild variant="secondary" className="mt-4 w-full rounded-xl bg-card text-primary hover:bg-card/90">
          <Link to="/chat">
            <MessageCircle className="h-4 w-4" /> Conversar com o Fin
          </Link>
        </Button>
      </section>

      <section className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Receitas do mês" value={s.monthIncome} icon={<TrendingUp className="h-4 w-4 text-income" />} />
        <Stat label="Despesas do mês" value={s.monthExpense} icon={<TrendingDown className="h-4 w-4 text-expense" />} />
        <Stat label="Economia" value={s.monthSavings} icon={<PiggyBank className="h-4 w-4 text-goal" />} />
      </section>

      <h2 className="mb-2 mt-6 font-bold">Gastos por categoria</h2>
      {s.byCategory.length ? (
        <div className="rounded-2xl bg-card p-4 shadow-soft">
          <CategoryDonut data={s.byCategory} />
        </div>
      ) : (
        <EmptyState icon={<Receipt className="h-5 w-5" />} title="Nenhuma despesa registrada neste mês." />
      )}

      <div className="mb-2 mt-6 flex items-center justify-between">
        <h2 className="font-bold">Metas ativas</h2>
        <Link to="/metas" className="text-sm font-medium text-primary">Ver todas</Link>
      </div>
      {active.length ? (
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
          {active.map((g) => (
            <div key={g.id} className="w-44 shrink-0 snap-start rounded-2xl bg-card p-4 shadow-soft">
              <Target className="h-4 w-4 text-goal" />
              <p className="mt-2 truncate text-sm font-semibold">{g.name}</p>
              <p className="tabular text-xs text-muted-foreground">
                {formatBRL(g.saved)} de {formatBRL(g.target_amount)}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-goal transition-all" style={{ width: `${g.pct}%` }} />
              </div>
              <p className="mt-1 text-right text-xs font-semibold text-goal">{g.pct}%</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Target className="h-5 w-5" />}
          title="Você ainda não possui metas ativas."
          action={<Button asChild size="sm" variant="outline"><Link to="/metas">Criar Meta</Link></Button>}
        />
      )}

      <h2 className="mb-2 mt-6 font-bold">Últimas movimentações</h2>
      {txs.data?.length ? (
        <TxList items={txs.data.slice(0, 8)} />
      ) : (
        <EmptyState
          icon={<MessageCircle className="h-5 w-5" />}
          title="Você ainda não registrou movimentações."
          action={<Button asChild size="sm"><Link to="/chat">Conversar com o Fin</Link></Button>}
        />
      )}
    </AppShell>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card p-3 shadow-soft">
      {icon}
      <p className="mt-1.5 text-[11px] leading-tight text-muted-foreground">{label}</p>
      <p className="tabular mt-0.5 truncate text-sm font-bold">{formatBRL(value)}</p>
    </div>
  );
}
