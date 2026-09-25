import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { ArrowUp, Check, Pencil, Target, X, ArrowDownRight, ArrowUpRight, PiggyBank } from "lucide-react";
import { AppShell } from "@/components/fin/AppShell";
import { LogoMark } from "@/components/fin/Logo";
import { TxFields, type TxDraft } from "@/components/fin/TransactionDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, formatDate, todayISO, useGoals, useInvalidateFinance, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/finance";
import { contribute } from "@/lib/goals";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "Chat com o Fin — FinanChat AI" }] }),
  component: ChatPage,
});

function ChatPage() {
  const { user } = Route.useRouteContext();
  const history = useQuery({
    queryKey: ["chat", user.id],
    staleTime: Infinity,
    gcTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, message")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return { rowId: data?.id ?? null, messages: ((data?.message as unknown) ?? []) as UIMessage[] };
    },
  });

  return (
    <AppShell noPad>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-card/95 px-4 py-3 backdrop-blur">
        <LogoMark className="h-9 w-9" />
        <div>
          <p className="font-bold leading-tight">Fin</p>
          <p className="text-xs text-income">● seu assistente financeiro</p>
        </div>
      </header>
      {history.data ? (
        <ChatWindow userId={user.id} initial={history.data.messages} rowId={history.data.rowId} />
      ) : (
        <p className="p-6 text-center text-sm text-muted-foreground">Carregando conversa…</p>
      )}
    </AppShell>
  );
}

const SUGGESTIONS = [
  { label: "+ Gastei dinheiro", text: "Gastei " },
  { label: "+ Recebi dinheiro", text: "Recebi " },
  { label: "+ Criar meta", text: "Quero criar uma meta de " },
  { label: "+ Como estão meus gastos?", text: "Como estão meus gastos?", send: true },
];

function ChatWindow({ userId, initial, rowId }: { userId: string; initial: UIMessage[]; rowId: string | null }) {
  const [input, setInput] = useState("");
  const rowRef = useRef(rowId);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, addToolOutput, error } = useChat({
    id: `fin-${userId}`,
    messages: initial,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      headers: async () => {
        const { data } = await supabase.auth.getSession();
        return { Authorization: `Bearer ${data.session?.access_token ?? ""}` };
      },
      body: () => ({ today: todayISO() }),
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (status !== "ready" || messages.length === 0) return;
    const payload = JSON.parse(JSON.stringify(messages));
    (async () => {
      if (rowRef.current) {
        const { error } = await supabase.from("chat_messages").update({ message: payload }).eq("id", rowRef.current);
        if (error) console.error(error);
      } else {
        const { data, error } = await supabase.from("chat_messages").insert({ message: payload }).select("id").single();
        if (error) console.error(error);
        else rowRef.current = data.id;
      }
    })();
    inputRef.current?.focus();
  }, [status, messages, userId]);

  function submit(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-3 px-4 py-4">
        {messages.length === 0 && (
          <FinBubble>
            Olá! Eu sou o Fin 👋 Me conte seus gastos e recebimentos do jeito que você falaria com um amigo, por exemplo: <em>"Gastei R$ 35 com almoço"</em>.
          </FinBubble>
        )}
        {messages.map((m) => (
          <div key={m.id} className="space-y-2">
            {m.parts.map((p, i) => {
              if (p.type === "text") {
                if (!p.text.trim()) return null;
                return m.role === "user" ? (
                  <div key={i} className="flex animate-fade-up justify-end">
                    <p className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">{p.text}</p>
                  </div>
                ) : (
                  <FinBubble key={i}>
                    <ReactMarkdown>{p.text}</ReactMarkdown>
                  </FinBubble>
                );
              }
              if (p.type.startsWith("tool-")) {
                const tp = p as unknown as { type: string; toolCallId: string; state: string; input: any; output?: any };
                return <ToolCard key={tp.toolCallId} part={tp} onDone={(output) => addToolOutput({ tool: tp.type.slice(5) as never, toolCallId: tp.toolCallId, output })} />;
              }
              return null;
            })}
          </div>
        ))}
        {status === "submitted" && (
          <div className="flex items-center gap-2">
            <LogoMark className="h-7 w-7" />
            <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-card px-4 py-3 shadow-soft">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </div>
          </div>
        )}
        {error && <p className="rounded-xl bg-muted p-3 text-sm text-destructive">{error.message || "O Fin não conseguiu responder. Tente novamente."}</p>}
        <div ref={endRef} />
      </div>

      <div className="fixed inset-x-0 bottom-[68px] z-30 mx-auto max-w-md bg-background/95 px-3 pb-2 pt-2 backdrop-blur">
        <div className="-mx-3 mb-2 flex gap-2 overflow-x-auto px-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              onClick={() => (s.send ? submit(s.text) : (setInput(s.text), inputRef.current?.focus()))}
              className="shrink-0 rounded-full border border-primary/30 bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition active:scale-95"
            >
              {s.label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="flex items-center gap-2 rounded-full border bg-card p-1.5 pl-4 shadow-soft"
        >
          <input
            ref={inputRef}
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Converse com o Fin…"
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <Button type="submit" size="icon" className="h-9 w-9 shrink-0 rounded-full" disabled={busy || !input.trim()} aria-label="Enviar">
            <ArrowUp className="h-4 w-4" />
          </Button>
        </form>
      </div>
      <div className="h-28" />
    </div>
  );
}

function FinBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex animate-fade-up items-end gap-2">
      <LogoMark className="h-7 w-7 shrink-0" />
      <div className="prose prose-sm max-w-[80%] rounded-2xl rounded-bl-sm bg-card px-3.5 py-2 text-sm shadow-soft [&_p]:my-0.5 [&_ul]:my-1 [&_ul]:pl-4 [&_ul]:list-disc">
        {children}
      </div>
    </div>
  );
}

type ToolPart = { type: string; toolCallId: string; state: string; input: any; output?: any };

function ToolCard({ part, onDone }: { part: ToolPart; onDone: (o: unknown) => void }) {
  const name = part.type.slice(5);
  if (part.state === "input-streaming") return null;
  if (part.state === "output-available") {
    const ok = part.output?.status === "registrado";
    return (
      <div className="ml-9 flex">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${ok ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
          {ok ? `✅ ${part.output?.resumo ?? "Registrado"}` : "Registro cancelado"}
        </span>
      </div>
    );
  }
  if (name === "registrar_transacao") return <TxConfirm input={part.input} onDone={onDone} />;
  if (name === "criar_meta") return <GoalConfirm input={part.input} onDone={onDone} />;
  if (name === "aportar_meta") return <ContribConfirm input={part.input} onDone={onDone} />;
  return null;
}

function CardShell({ icon, title, children, actions }: { icon: React.ReactNode; title: string; children: React.ReactNode; actions: React.ReactNode }) {
  return (
    <div className="ml-9 max-w-[85%] animate-fade-up rounded-2xl border bg-card p-4 shadow-soft">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </div>
      {children}
      <div className="mt-4 flex gap-2">{actions}</div>
    </div>
  );
}

function TxConfirm({ input, onDone }: { input: any; onDone: (o: unknown) => void }) {
  const invalidate = useInvalidateFinance();
  const type = input?.tipo === "receita" ? "receita" : "despesa";
  const cats: readonly string[] = type === "receita" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const [draft, setDraft] = useState<TxDraft>({
    type,
    amount: Number(input?.valor) || 0,
    description: input?.descricao ?? "",
    category: cats.includes(input?.categoria) ? input.categoria : "Outros",
    occurred_on: /^\d{4}-\d{2}-\d{2}$/.test(input?.data ?? "") ? input.data : todayISO(),
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function confirm() {
    if (!(draft.amount > 0)) return toast.error("Informe um valor válido.");
    setSaving(true);
    const { data, error } = await supabase.from("transactions").insert(draft).select("id").single();
    setSaving(false);
    if (error) return toast.error("Não foi possível registrar.");
    invalidate();
    const label = draft.type === "receita" ? "Receita" : "Despesa";
    toast.success(`✅ ${label} registrada com sucesso`, {
      action: {
        label: "Desfazer",
        onClick: async () => {
          await supabase.from("transactions").delete().eq("id", data.id);
          invalidate();
          toast("Registro desfeito");
        },
      },
    });
    onDone({ status: "registrado", resumo: `${label} de ${formatBRL(draft.amount)} registrada`, ...draft });
  }

  const isIncome = draft.type === "receita";
  return (
    <CardShell
      icon={isIncome ? <ArrowUpRight className="h-4 w-4 text-income" /> : <ArrowDownRight className="h-4 w-4 text-expense" />}
      title="Confirme o registro"
      actions={
        <>
          <Button size="sm" className="flex-1" disabled={saving} onClick={confirm}>
            <Check className="h-4 w-4" /> Confirmar
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(!editing)}>
            <Pencil className="h-4 w-4" /> {editing ? "Ok" : "Editar"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDone({ status: "cancelado" })} aria-label="Cancelar">
            <X className="h-4 w-4" />
          </Button>
        </>
      }
    >
      {editing ? (
        <TxFields value={draft} onChange={setDraft} />
      ) : (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">Tipo</dt>
          <dd className={`font-medium capitalize ${isIncome ? "text-income" : "text-expense"}`}>{draft.type}</dd>
          <dt className="text-muted-foreground">Valor</dt>
          <dd className="tabular font-bold">{formatBRL(draft.amount)}</dd>
          <dt className="text-muted-foreground">Descrição</dt>
          <dd>{draft.description || "—"}</dd>
          <dt className="text-muted-foreground">Categoria</dt>
          <dd>
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{draft.category}</span>
          </dd>
          <dt className="text-muted-foreground">Data</dt>
          <dd>{formatDate(draft.occurred_on)}</dd>
        </dl>
      )}
    </CardShell>
  );
}

function GoalConfirm({ input, onDone }: { input: any; onDone: (o: unknown) => void }) {
  const invalidate = useInvalidateFinance();
  const [name, setName] = useState(input?.nome ?? "");
  const [value, setValue] = useState(String(input?.valor_objetivo ?? ""));
  const [editing, setEditing] = useState(false);
  async function confirm() {
    if (!name.trim() || !(Number(value) > 0)) return toast.error("Preencha nome e valor.");
    const { error } = await supabase.from("goals").insert({ name: name.trim(), target_amount: Number(value) });
    if (error) return toast.error("Não foi possível criar a meta.");
    invalidate();
    toast.success("🎯 Meta criada com sucesso");
    onDone({ status: "registrado", resumo: `Meta "${name}" criada`, nome: name, valor_objetivo: Number(value) });
  }
  return (
    <CardShell
      icon={<Target className="h-4 w-4 text-goal" />}
      title="Criar nova meta?"
      actions={
        <>
          <Button size="sm" className="flex-1" onClick={confirm}><Check className="h-4 w-4" /> Confirmar</Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(!editing)}><Pencil className="h-4 w-4" /> {editing ? "Ok" : "Editar"}</Button>
          <Button size="sm" variant="ghost" onClick={() => onDone({ status: "cancelado" })} aria-label="Cancelar"><X className="h-4 w-4" /></Button>
        </>
      }
    >
      {editing ? (
        <div className="grid gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
      ) : (
        <p className="text-sm">
          <span className="font-semibold">{name}</span> · objetivo <span className="tabular font-bold">{formatBRL(Number(value))}</span>
        </p>
      )}
    </CardShell>
  );
}

function ContribConfirm({ input, onDone }: { input: any; onDone: (o: unknown) => void }) {
  const goals = useGoals();
  const invalidate = useInvalidateFinance();
  const [goalId, setGoalId] = useState<string>(input?.meta_id ?? "");
  const [value, setValue] = useState(String(input?.valor ?? ""));
  const list = goals.data?.goals ?? [];
  const goal = list.find((g) => g.id === goalId);
  async function confirm() {
    if (!goal || !(Number(value) > 0)) return toast.error("Escolha a meta e um valor válido.");
    const id = await contribute(goal, Number(value), invalidate);
    if (id) onDone({ status: "registrado", resumo: `Aporte de ${formatBRL(Number(value))} em "${goal.name}"`, meta: goal.name, valor: Number(value) });
  }
  return (
    <CardShell
      icon={<PiggyBank className="h-4 w-4 text-goal" />}
      title="Registrar aporte"
      actions={
        <>
          <Button size="sm" className="flex-1" onClick={confirm}><Check className="h-4 w-4" /> Confirmar</Button>
          <Button size="sm" variant="ghost" onClick={() => onDone({ status: "cancelado" })} aria-label="Cancelar"><X className="h-4 w-4" /></Button>
        </>
      }
    >
      <div className="grid gap-2">
        <select className="h-9 rounded-md border bg-card px-2 text-sm" value={goalId} onChange={(e) => setGoalId(e.target.value)}>
          <option value="">Escolha a meta</option>
          {list.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
        {goal && (
          <p className="text-xs text-muted-foreground">
            Atual: {formatBRL(goal.saved)} de {formatBRL(goal.target_amount)} ({goal.pct}%)
          </p>
        )}
      </div>
    </CardShell>
  );
}
