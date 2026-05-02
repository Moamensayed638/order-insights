import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  accent?: "primary" | "accent" | "warning" | "muted";
  index?: number;
}

const accentConfig = {
  primary: {
    icon: "bg-primary/15 text-primary border border-primary/25",
    glow: "after:bg-primary/10",
    value: "text-primary",
    bar: "bg-gradient-primary",
  },
  accent: {
    icon: "bg-accent/15 text-accent border border-accent/25",
    glow: "after:bg-accent/10",
    value: "text-amber-300",
    bar: "bg-gradient-to-r from-accent to-amber-500",
  },
  warning: {
    icon: "bg-warning/15 text-warning border border-warning/25",
    glow: "after:bg-warning/10",
    value: "text-warning",
    bar: "bg-warning",
  },
  muted: {
    icon: "bg-muted text-muted-foreground border border-border",
    glow: "after:bg-white/5",
    value: "text-foreground",
    bar: "bg-muted-foreground/30",
  },
};

export function StatCard({ label, value, hint, icon, accent = "primary", index = 0 }: StatCardProps) {
  const cfg = accentConfig[accent];
  const delay = index * 80;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg panel transition-all duration-300",
        "hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-elegant",
        "animate-fade-up"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top accent bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-px", cfg.bar)} />

      {/* Corner glow */}
      <div
        className={cn(
          "absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100",
          cfg.glow
        )}
      />

      <div className="relative p-5 flex items-start justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <p className="text-[10px] font-mono font-medium uppercase tracking-[0.15em] text-muted-foreground truncate">
            {label}
          </p>
          <p className={cn("text-3xl font-display font-semibold tracking-tight", cfg.value)}>
            {value}
          </p>
          {hint && (
            <p className="text-[11px] text-muted-foreground/70">{hint}</p>
          )}
        </div>

        <div className={cn(
          "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110",
          cfg.icon
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}