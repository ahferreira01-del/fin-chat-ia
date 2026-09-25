import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai/run-id.server";

const EXP = ["Alimentação", "Transporte", "Moradia", "Lazer", "Saúde", "Educação", "Outros"];
const INC = ["Salário", "Freelance", "Venda", "Outros"];

export const finTools = {
  registrar_transacao: tool({
    description:
      "Propõe o registro de uma receita ou despesa. O usuário confirmará em um card antes de salvar. Use somente quando o valor estiver claro.",
    inputSchema: z.object({
      tipo: z.enum(["receita", "despesa"]),
      valor: z.number().describe("Valor em reais, positivo"),
      descricao: z.string(),
      categoria: z.string().describe(`Despesa: ${EXP.join(", ")}. Receita: ${INC.join(", ")}.`),
      data: z.string().describe("Data no formato AAAA-MM-DD"),
    }),
  }),
  criar_meta: tool({
    description: "Propõe criar uma nova meta financeira. O usuário confirmará antes de salvar.",
    inputSchema: z.object({ nome: z.string(), valor_objetivo: z.number() }),
  }),
  aportar_meta: tool({
    description: "Propõe registrar um aporte (valor guardado) em uma meta existente. Use o id exato da meta.",
    inputSchema: z.object({ meta_id: z.string(), meta_nome: z.string(), valor: z.number() }),
  }),
};

const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });
        const sb = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
        });
        const { data: u, error: ue } = await sb.auth.getUser(token);
        if (ue || !u.user) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as { messages: UIMessage[]; today?: string };
        const today = /^\d{4}-\d{2}-\d{2}$/.test(body.today ?? "") ? body.today! : new Date().toISOString().slice(0, 10);

        const [p, t, g, c] = await Promise.all([
          sb.from("profiles").select("*").eq("id", u.user.id).maybeSingle(),
          sb.from("transactions").select("*").order("occurred_on", { ascending: false }).limit(400),
          sb.from("goals").select("*"),
          sb.from("goal_contributions").select("*"),
        ]);
        const profile = p.data;
        const txs = (t.data ?? []).map((x) => ({ ...x, amount: Number(x.amount) }));
        const initial = Number(profile?.initial_balance ?? 0);
        const month = today.slice(0, 7);
        const prevDate = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 2, 1);
        const prev = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
        const agg = (m: string) => {
          const r = { receitas: 0, despesas: 0, cat: {} as Record<string, number> };
          for (const x of txs) {
            if (x.occurred_on.slice(0, 7) !== m) continue;
            if (x.type === "receita") r.receitas += x.amount;
            else {
              r.despesas += x.amount;
              r.cat[x.category] = (r.cat[x.category] ?? 0) + x.amount;
            }
          }
          return r;
        };
        const cur = agg(month);
        const old = agg(prev);
        const totalIn = txs.filter((x) => x.type === "receita").reduce((s, x) => s + x.amount, 0);
        const totalOut = txs.filter((x) => x.type === "despesa").reduce((s, x) => s + x.amount, 0);
        const goals = (g.data ?? []).map((x) => {
          const saved = (c.data ?? []).filter((k) => k.goal_id === x.id).reduce((s, k) => s + Number(k.amount), 0);
          return `- [id ${x.id}] ${x.name}: ${fmt(saved)} de ${fmt(Number(x.target_amount))}`;
        });
        const catLines = (r: typeof cur) =>
          Object.entries(r.cat).map(([k, v]) => `${k}: ${fmt(v)}`).join("; ") || "nenhuma";

        const familiar = profile?.control_type === "familiar";
        const instructions = `Você é o Fin, assistente financeiro do app FinanChat AI. Responda sempre em português do Brasil, de forma amigável, educada, didática, motivadora, positiva e objetiva. Frases curtas, estilo conversa de mensageiro. Use no máximo 1 emoji por mensagem.
${familiar ? "O usuário faz controle FAMILIAR: fale em termos de 'as finanças da sua família', 'os gastos da casa'." : "O usuário faz controle PESSOAL."}

REGRA DE OURO: NUNCA invente valores, datas, saldos, receitas, despesas, metas ou comparações. Use apenas os DADOS abaixo e o que o usuário disser. Se faltar informação para responder, diga: "Ainda não possuo informações suficientes para responder essa pergunta." Se faltar informação para registrar (ex.: valor), pergunte objetivamente antes.

REGISTROS:
- Quando o usuário relatar um gasto ou recebimento com valor, chame registrar_transacao (não diga que já registrou; o usuário confirmará no card). Depois da chamada, não escreva texto extra.
- Categorias de despesa: ${EXP.join(", ")}. De receita: ${INC.join(", ")}. Na dúvida use "Outros".
- Datas: hoje é ${today}. Resolva "ontem", "anteontem", "dia 15" (mês atual) etc. Sem data, use hoje.
- "Quero economizar X para Y" → criar_meta. "Guardei X para Y" → aportar_meta com o id da meta correspondente; se não existir meta parecida, pergunte se deseja criá-la.
- Quando receber o resultado de uma ferramenta: se "registrado", confirme brevemente e, se útil, dê uma dica curta baseada nos dados; se "cancelado", responda com leveza.

DADOS DO USUÁRIO (fonte única de verdade):
Nome: ${profile?.name || "não informado"}
Renda mensal estimada: ${fmt(Number(profile?.monthly_income ?? 0))}
Saldo inicial: ${fmt(initial)}
Saldo atual: ${fmt(initial + totalIn - totalOut)}
Mês atual (${month}): receitas ${fmt(cur.receitas)}, despesas ${fmt(cur.despesas)}, economia ${fmt(cur.receitas - cur.despesas)}. Despesas por categoria: ${catLines(cur)}
Mês anterior (${prev}): receitas ${fmt(old.receitas)}, despesas ${fmt(old.despesas)}. Despesas por categoria: ${catLines(old)}
Metas:
${goals.join("\n") || "nenhuma meta cadastrada"}
Últimas movimentações:
${txs.slice(0, 30).map((x) => `- ${x.occurred_on} ${x.type} ${fmt(x.amount)} ${x.category} "${x.description}"`).join("\n") || "nenhuma"}`;

        const apiKey = process.env.LOVABLE_API_KEY!;
        const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: runIdFetch.fetch,
        });
        const result = streamText({
          model: provider.responses("openai/gpt-6-astra"),
          instructions,
          messages: await convertToModelMessages(body.messages, { tools: finTools, ignoreIncompleteToolCalls: true }),
          tools: finTools,
          abortSignal: request.signal,
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
        });
        return withLovableAiGatewayRunIdHeader(
          result.toUIMessageStreamResponse({
            originalMessages: body.messages,
            onError: (e: unknown) => {
              console.error(e);
              const s = (e as { statusCode?: number })?.statusCode;
              if (s === 429) return "Muitas mensagens em pouco tempo. Tente novamente em instantes.";
              if (s === 402) return "Os créditos de IA acabaram. Adicione créditos para continuar conversando com o Fin.";
              return "O Fin teve um problema para responder. Tente novamente.";
            },
          }),
          runIdFetch,
        );
      },
    },
  },
});
