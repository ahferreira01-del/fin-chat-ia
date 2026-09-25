import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/fin/Logo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ mode: z.enum(["login", "signup"]).optional() }),
  head: () => ({
    meta: [
      { title: "Entrar — FinanChat AI" },
      { name: "description", content: "Crie sua conta ou entre no FinanChat AI para conversar com o Fin." },
      { property: "og:title", content: "Entrar — FinanChat AI" },
      { property: "og:description", content: "Acesse sua conta do FinanChat AI." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initial } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">(initial ?? "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: "/dashboard" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name }, emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        if (!data.session) toast.success("Conta criada! Confirme seu e-mail para entrar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      const msg = (err as Error).message;
      toast.error(msg.includes("Invalid login") ? "E-mail ou senha incorretos." : msg);
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Não foi possível entrar com o Google.");
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pt-6">
      <Logo />
      <h1 className="mt-10 text-2xl font-extrabold">{mode === "signup" ? "Crie sua conta" : "Bem-vindo de volta"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {mode === "signup" ? "Leva menos de um minuto." : "Entre para continuar sua conversa com o Fin."}
      </p>
      <form onSubmit={submit} className="mt-6 grid gap-4 rounded-2xl bg-card p-5 shadow-soft">
        {mode === "signup" && (
          <div className="grid gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        <div className="grid gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="pw">Senha</Label>
          <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading} className="h-11 rounded-xl">
          {mode === "signup" ? "Criar conta" : "Entrar"}
        </Button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
        </div>
        <Button type="button" variant="outline" onClick={google} className="h-11 rounded-xl">
          Continuar com Google
        </Button>
      </form>
      <button
        className="mt-5 text-sm text-muted-foreground"
        onClick={() => setMode(mode === "signup" ? "login" : "signup")}
      >
        {mode === "signup" ? "Já tem conta? " : "Ainda não tem conta? "}
        <span className="font-semibold text-primary">{mode === "signup" ? "Entrar" : "Cadastre-se"}</span>
      </button>
    </div>
  );
}
