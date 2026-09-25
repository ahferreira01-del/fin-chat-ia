import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-10 w-10", className)} aria-hidden>
      <path
        d="M8 6h32a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6H20l-9 7v-7H8a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6Z"
        fill="var(--primary)"
      />
      <path
        d="M11 27l7-7 5 4 9-10"
        fill="none"
        stroke="var(--primary-foreground)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M27 14h5v5" fill="none" stroke="var(--primary-foreground)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoMark className="h-8 w-8" />
      <span className="text-lg font-extrabold tracking-tight">
        FinanChat <span className="text-primary">AI</span>
      </span>
    </div>
  );
}
