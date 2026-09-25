import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const EXPENSE_CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Lazer",
  "Saúde",
  "Educação",
  "Outros",
] as const;
export const INCOME_CATEGORIES = ["Salário", "Freelance", "Venda", "Outros"] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Alimentação: "var(--chart-3)",
  Transporte: "var(--chart-2)",
  Moradia: "var(--chart-5)",
  Lazer: "var(--chart-6)",
  Saúde: "var(--chart-4)",
  Educação: "var(--chart-1)",
  Outros: "var(--chart-7)",
};

export type TxType = "receita" | "despesa";
export type Transaction = {
  id: string;
  type: TxType;
  amount: number;
  description: string;
  category: string;
  occurred_on: string;
  created_at: string;
};
export type Goal = { id: string; name: string; target_amount: number; created_at: string };
export type Contribution = { id: string; goal_id: string; amount: number; created_at: string };
export type Profile = {
  id: string;
  name: string;
  monthly_income: number;
  initial_balance: number;
  control_type: string;
  onboarded: boolean;
};

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatBRL = (n: number) => brl.format(n || 0);

export function todayISO(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export const monthKey = (iso: string) => iso.slice(0, 7);
export function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
export function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

export async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const uid = await currentUserId();
      if (!uid) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (error) throw error;
      if (!data) {
        const { data: created, error: e2 } = await supabase
          .from("profiles")
          .insert({ id: uid })
          .select("*")
          .single();
        if (e2) throw e2;
        return normProfile(created);
      }
      return normProfile(data);
    },
  });
}
function normProfile(p: any): Profile {
  return {
    ...p,
    monthly_income: Number(p.monthly_income),
    initial_balance: Number(p.initial_balance),
  };
}

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("occurred_on", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((t) => ({ ...t, amount: Number(t.amount) })) as Transaction[];
    },
  });
}

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const [g, c] = await Promise.all([
        supabase.from("goals").select("*").order("created_at"),
        supabase.from("goal_contributions").select("*").order("created_at", { ascending: false }),
      ]);
      if (g.error) throw g.error;
      if (c.error) throw c.error;
      const contributions = (c.data ?? []).map((x) => ({ ...x, amount: Number(x.amount) })) as Contribution[];
      const goals = (g.data ?? []).map((x) => {
        const saved = contributions.filter((k) => k.goal_id === x.id).reduce((s, k) => s + k.amount, 0);
        const target = Number(x.target_amount);
        return {
          ...x,
          target_amount: target,
          saved,
          pct: Math.min(100, Math.round((saved / target) * 100)),
          done: saved >= target,
        };
      });
      return { goals, contributions };
    },
  });
}

export function useInvalidateFinance() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["goals"] });
    qc.invalidateQueries({ queryKey: ["profile"] });
  };
}

export function computeSummary(txs: Transaction[], initialBalance: number, month = monthKey(todayISO())) {
  let income = 0,
    expense = 0,
    mIncome = 0,
    mExpense = 0;
  const byCat: Record<string, number> = {};
  for (const t of txs) {
    const inMonth = monthKey(t.occurred_on) === month;
    if (t.type === "receita") {
      income += t.amount;
      if (inMonth) mIncome += t.amount;
    } else {
      expense += t.amount;
      if (inMonth) {
        mExpense += t.amount;
        byCat[t.category] = (byCat[t.category] ?? 0) + t.amount;
      }
    }
  }
  return {
    balance: initialBalance + income - expense,
    monthIncome: mIncome,
    monthExpense: mExpense,
    monthSavings: mIncome - mExpense,
    byCategory: Object.entries(byCat)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
  };
}
