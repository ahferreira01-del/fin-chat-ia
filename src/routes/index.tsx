import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, PieChart, Target, Sparkle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo, LogoMark } from "@/components/fin/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FinanChat AI — Suas finanças, agora em forma de conversa" },
      { name: "description", content: "Organize receitas, despesas e metas conversando com o Fin, seu assistente financeiro com IA." },
      { property: "og:title", content: "FinanChat AI — Suas finanças em forma de conversa" },
      { property: "og:description", content: "Registre gastos, acompanhe metas e receba dicas conversando com o Fin." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Welcome,
});

const bubbles = [
  { me: true, text: "Gastei R$ 35 com almoço" },
  { me: false, text: "Anotado! Despesa de R$ 35,00 em Alimentação. Confirma? 🍽️" },
  { me: true, text: "Quero guardar R$ 5.000 para viajar" },
  { me: false, text: "Que meta incrível! Vou criar a meta Viagem para você." },
];

function Welcome() {
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pb-8 pt-6">
      <Logo />
      <section className="mt-10">
        <h1 className="text-[2rem] font-extrabold leading-tight tracking-tight">
          Suas finanças, agora em forma de <span className="text-primary">conversa.</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Esqueça planilhas. Conte ao Fin o que você gastou ou recebeu e ele organiza tudo para você.
        </p>
      </section>

      <div className="mt-8 space-y-2 rounded-3xl bg-card p-4 shadow-soft">
        {bubbles.map((b, i) => (
          <div key={i} className={`flex animate-fade-up ${b.me ? "justify-end" : "justify-start gap-2"}`} style={{ animationDelay: `${i * 180}ms` }}>
            {!b.me && <LogoMark className="h-6 w-6 shrink-0" />}
            <p
              className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                b.me ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted"
              }`}
            >
              {b.text}
            </p>
          </div>
        ))}
      </div>

      <ul className="mt-8 grid grid-cols-3 gap-3 text-center text-xs">
        {[
          { icon: MessageCircle, t: "Registre conversando" },
          { icon: Target, t: "Acompanhe metas" },
          { icon: PieChart, t: "Entenda seus gastos" },
        ].map(({ icon: I, t }) => (
          <li key={t} className="rounded-2xl bg-card p-3 shadow-soft">
            <I className="mx-auto mb-1.5 h-5 w-5 text-primary" />
            {t}
          </li>
        ))}
      </ul>

      <div className="mt-auto grid gap-3 pt-10">
        <Button asChild size="lg" className="h-12 rounded-xl text-base">
          <Link to="/auth" search={{ mode: "signup" }}>
            <Sparkle className="h-4 w-4" /> Começar
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-12 rounded-xl text-base">
          <Link to="/auth" search={{ mode: "login" }}>Entrar</Link>
        </Button>
      </div>
    </div>
  );
}
