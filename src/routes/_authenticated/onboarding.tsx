import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { LogoMark } from "@/components/fin/Logo";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId, useInvalidateFinance } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Primeiros passos — FinanChat AI" }] }),
  component: Onboarding,
});

function Onboarding() {
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState("");
  const [balance, setBalance] = useState("");
  const [control, setControl] = useState<"pessoal" | "familiar">("pessoal");
  const [goalName, setGoalName] = useState("");
  const [goalValue, setGoalValue] = useState("");
  const navigate = useNavigate();
  const invalidate = useInvalidateFinance();

  const steps = [
    {
      q: "Qual é sua renda mensal estimada?",
      hint: "Isso me ajuda a dar dicas mais certeiras.",
      body: <Input autoFocus type="number" inputMode="decimal" placeholder="R$ 0,00" value={income} onChange={(e) => setIncome(e.target.value)} />,
    },
    {
      q: "Quanto você tem disponível em conta hoje?",
      hint: "Opcional. Se pular, começamos com R$ 0,00.",
      body: <Input type="number" inputMode="decimal" placeholder="R$ 0,00" value={balance} onChange={(e) => setBalance(e.target.value)} />,
    },
    {
      q: "Como você quer organizar suas finanças?",
      hint: "Isso adapta o jeito que eu converso com você.",
      body: (
        <div className="grid grid-cols-2 gap-3">
          {[
            { v: "pessoal" as const, l: "Controle Pessoal", I: User },
            { v: "familiar" as const, l: "Controle Familiar", I: Users },
          ].map(({ v, l, I }) => (
            <button
              key={v}
              onClick={() => setControl(v)}
              className={`rounded-2xl border-2 p-4 text-sm font-medium transition ${
                control === v ? "border-primary bg-accent text-accent-foreground" : "bg-card"
              }`}
            >
              <I className="mx-auto mb-2 h-6 w-6" />
              {l}
            </button>
          ))}
        </div>
      ),
    },
    {
      q: "Quer criar sua primeira meta?",
      hint: "Opcional. Ex.: Viagem, Reserva de emergência.",
      body: (
        <div className="grid gap-3">
          <Input placeholder="Nome da meta" value={goalName} onChange={(e) => setGoalName(e.target.value)} />
          <Input type="number" inputMode="decimal" placeholder="Valor objetivo (R$)" value={goalValue} onChange={(e) => setGoalValue(e.target.value)} />
        </div>
      ),
    },
  ];

  async function finish() {
    const uid = await currentUserId();
    if (!uid) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        monthly_income: Number(income) || 0,
        initial_balance: Number(balance) || 0,
        control_type: control,
        onboarded: true,
      })
      .eq("id", uid);
    if (error) return toast.error("Não foi possível salvar.");
    if (goalName.trim() && Number(goalValue) > 0) {
      await supabase.from("goals").insert({ name: goalName.trim(), target_amount: Number(goalValue) });
    }
    invalidate();
    toast.success("Tudo pronto! Vamos começar 🎉");
    navigate({ to: "/dashboard" });
  }

  const s = steps[step];
  const last = step === steps.length - 1;
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pb-8 pt-6">
      <Progress value={((step + 1) / steps.length) * 100} className="h-1.5" />
      <div key={step} className="mt-10 animate-fade-up">
        <div className="flex items-start gap-3">
          <LogoMark className="h-9 w-9 shrink-0" />
          <div className="rounded-2xl rounded-tl-sm bg-card p-4 shadow-soft">
            <p className="font-semibold">{s.q}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.hint}</p>
          </div>
        </div>
        <div className="mt-6">{s.body}</div>
      </div>
      <div className="mt-auto grid gap-2 pt-10">
        <Button
          className="h-12 rounded-xl"
          disabled={step === 0 && !(Number(income) > 0)}
          onClick={() => (last ? finish() : setStep(step + 1))}
        >
          {last ? "Concluir" : "Continuar"}
        </Button>
        {(step === 1 || last) && (
          <Button variant="ghost" onClick={() => (last ? (setGoalName(""), finish()) : setStep(step + 1))}>
            Pular
          </Button>
        )}
        {step > 0 && (
          <Button variant="link" className="text-muted-foreground" onClick={() => setStep(step - 1)}>
            Voltar
          </Button>
        )}
      </div>
    </div>
  );
}
