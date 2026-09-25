import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AppShell } from "@/components/fin/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useInvalidateFinance, useProfile } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Perfil — FinanChat AI" }] }),
  component: Perfil,
});

function Perfil() {
  const profile = useProfile();
  const invalidate = useInvalidateFinance();
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const [form, setForm] = useState({ name: "", monthly_income: "", initial_balance: "", familiar: false });

  useEffect(() => {
    const p = profile.data;
    if (p) setForm({ name: p.name, monthly_income: String(p.monthly_income), initial_balance: String(p.initial_balance), familiar: p.control_type === "familiar" });
  }, [profile.data]);

  async function save() {
    if (!profile.data) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        name: form.name,
        monthly_income: Number(form.monthly_income) || 0,
        initial_balance: Number(form.initial_balance) || 0,
        control_type: form.familiar ? "familiar" : "pessoal",
      })
      .eq("id", profile.data.id);
    if (error) return toast.error("Não foi possível salvar.");
    invalidate();
    toast.success("Perfil atualizado");
  }

  async function clearChat() {
    await supabase.from("chat_messages").delete().eq("user_id", user.id);
    toast.success("Conversa com o Fin apagada");
  }

  return (
    <AppShell>
      <h1 className="text-xl font-extrabold">Perfil</h1>
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-lg font-bold text-accent-foreground">
          {(form.name || user.email || "?").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold">{form.name || "Sem nome"}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 rounded-2xl bg-card p-4 shadow-soft">
        <div className="grid gap-1.5">
          <Label>Nome</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label>Renda mensal (R$)</Label>
          <Input type="number" inputMode="decimal" value={form.monthly_income} onChange={(e) => setForm({ ...form, monthly_income: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label>Saldo inicial (R$)</Label>
          <Input type="number" inputMode="decimal" value={form.initial_balance} onChange={(e) => setForm({ ...form, initial_balance: e.target.value })} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Controle Familiar</p>
            <p className="text-xs text-muted-foreground">O Fin fala sobre as finanças da família.</p>
          </div>
          <Switch checked={form.familiar} onCheckedChange={(v) => setForm({ ...form, familiar: v })} />
        </div>
        <Button onClick={save}>Salvar</Button>
      </div>

      <div className="mt-4 grid gap-2">
        <Button variant="outline" onClick={clearChat}>Apagar conversa com o Fin</Button>
        <Button
          variant="ghost"
          className="text-destructive"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/" });
          }}
        >
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </div>
    </AppShell>
  );
}
