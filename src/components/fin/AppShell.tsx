import { Link, Navigate, useLocation } from "@tanstack/react-router";
import { BarChart3, Home, MessageCircle, Target, User } from "lucide-react";
import type { ReactNode } from "react";
import { useProfile } from "@/lib/finance";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/dashboard", label: "Início", icon: Home },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/metas", label: "Metas", icon: Target },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function AppShell({ children, noPad }: { children: ReactNode; noPad?: boolean }) {
  const profile = useProfile();
  const loc = useLocation();
  if (profile.data && !profile.data.onboarded) return <Navigate to="/onboarding" />;

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col bg-background">
      <main key={loc.pathname} className={cn("flex-1 animate-fade-up pb-24", !noPad && "px-4 pt-5")}>
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t bg-card/95 backdrop-blur">
        <ul className="grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = loc.pathname.startsWith(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className={cn("rounded-full px-4 py-1 transition-colors", active && "bg-accent")}>
                    <Icon className="h-5 w-5" />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function EmptyState({ icon, title, action }: { icon: ReactNode; title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">{icon}</div>
      <p className="text-sm text-muted-foreground">{title}</p>
      {action}
    </div>
  );
}
