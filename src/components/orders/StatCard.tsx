import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  accent?: "primary" | "accent" | "warning";
}

const accentMap = {
  primary: "bg-gradient-primary text-primary-foreground shadow-glow",
  accent: "bg-accent text-accent-foreground",
  warning: "bg-warning text-warning-foreground",
};

export function StatCard({ label, value, hint, icon, accent = "primary" }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden border-border/60 bg-card p-6 shadow-soft transition-smooth hover:shadow-elegant hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${accentMap[accent]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}