import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Plus, Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AppShell, EmptyState } from "@/components/fin/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, useGoals, useInvalidateFinance } from "@/lib/finance";
import { contribute } from "@/lib/goals";

export const Route = createFileRoute("/_authenticated/metas")({
  head: () => ({ meta: [{ title: "Metas — FinanChat AI" }] }),
  component: Metas,
});

function Metas() {
  const goals = useGoals();
  const invalidate = useInvalidateFinance();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [aporte, setAporte] = useState<{ id: string } | null>(null);
  const [amount, setAmount] = useState("");
  const list = goals.data?.goals ?? [];
  const active = list.filter((g) => !g.done);
  const done = list.filter((g) => g.done);

  async function create() {
    if (!name.trim() || !(Number(target) > 0)) return toast.error("Preencha nome e valor.");
    const { error } = await supabase.from("goals").insert({ name: name.trim(), target_amount: Number(target) });
    if (error) return toast.error("Não foi possível criar a meta.");
    toast.success("🎯 Meta criada!");
    setName("");
    setTarget("");
    setCreating(false);
    invalidate();
  }

  async function doAporte() {
    const g = list.find((x) => x.id === aporte?.id);
    if (!g || !(Number(amount) > 0)) return toast.error("Informe um valor válido.");
    await contribute(g, Number(amount), invalidate);
    setAporte(null);
    setAmount("");
  }

  async function remove(id: string) {
    await supabase.from("goals").delete().eq("id", id);
    invalidate();
    toast("Meta excluída");
  }

  const Card = ({ g }: { g: (typeof list)[number] }) => (
    <li className="rounded-2xl bg-card p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${g.done ? "bg-accent text-income" : "bg-muted text-goal"}`}>
          {g.done ? <CheckCircle2 className="h-5 w-5 animate-pop" /> : <Target className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{g.name}</p>
          <p className="tabular text-sm text-muted-foreground">
            {formatBRL(g.saved)} / {formatBRL(g.target_amount)}
          </p>
        </div>
        <span className={`tabular text-lg font-extrabold ${g.done ? "text-income" : "text-goal"}`}>{g.pct}%</span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full transition-all duration-700 ${g.done ? "bg-income" : "bg-goal"}`} style={{ width: `${g.pct}%` }} />
      </div>
      <div className="mt-3 flex gap-2">
        {!g.done && (
          <Button size="sm" className="flex-1 rounded-lg" onClick={() => setAporte({ id: g.id })}>
            <Plus className="h-4 w-4" /> Novo aporte
          </Button>
        )}
        <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => remove(g.id)} aria-label="Excluir meta">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );

  return (
    <AppShell>
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Metas</h1>
        <Button size="sm" className="rounded-full" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Criar Meta
        </Button>
      </header>
      <p className="mt-1 text-sm text-muted-foreground">Dica: diga ao Fin "Guardei R$ 200 para a viagem".</p>

      {list.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Target className="h-5 w-5" />}
            title="Você ainda não possui metas cadastradas."
            action={<Button size="sm" onClick={() => setCreating(true)}>Criar Meta</Button>}
          />
        </div>
      ) : (
        <>
          <h2 className="mb-2 mt-6 font-bold">Ativas</h2>
          {active.length ? <ul className="grid gap-3">{active.map((g) => <Card key={g.id} g={g} />)}</ul> : <p className="text-sm text-muted-foreground">Nenhuma meta ativa.</p>}
          {done.length > 0 && (
            <>
              <h2 className="mb-2 mt-6 font-bold">Concluídas 🏆</h2>
              <ul className="grid gap-3">{done.map((g) => <Card key={g.id} g={g} />)}</ul>
            </>
          )}
        </>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>Nova meta</DialogTitle></DialogHeader>
          <Input placeholder="Nome (ex.: Viagem)" value={name} onChange={(e) => setName(e.target.value)} />
          <Input type="number" inputMode="decimal" placeholder="Valor objetivo (R$)" value={target} onChange={(e) => setTarget(e.target.value)} />
          <Button onClick={create}>Criar meta</Button>
        </DialogContent>
      </Dialog>
      <Dialog open={!!aporte} onOpenChange={(o) => !o && setAporte(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>Novo aporte</DialogTitle></DialogHeader>
          <Input autoFocus type="number" inputMode="decimal" placeholder="Valor (R$)" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Button onClick={doAporte}>Registrar aporte</Button>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
