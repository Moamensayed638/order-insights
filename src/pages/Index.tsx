import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, AlertCircle, Eye, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AdminOrder } from "@/types/order";
import { OrderDetailsDialog } from "@/components/orders/OrderDetailsDialog";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const POINTS_RATE = 20; // 20 EGP = 1 Pt

async function fetchOrders(): Promise<AdminOrder[]> {
  const res = await fetch(`${API_BASE}/AdminOrders`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

type StatusKey = "all" | "pending" | "accepted" | "rejected";

const STATUS_FILTERS: { key: StatusKey; label: string; tone: string }[] = [
  { key: "all", label: "All", tone: "bg-muted text-foreground hover:bg-muted/80" },
  { key: "pending", label: "Pending", tone: "bg-warning/20 text-warning-foreground hover:bg-warning/30" },
  { key: "accepted", label: "Accepted", tone: "bg-accent/20 text-accent hover:bg-accent/30" },
  { key: "rejected", label: "Rejected", tone: "bg-destructive/15 text-destructive hover:bg-destructive/25" },
];

function statusOf(o: AdminOrder): StatusKey {
  if (o.orderStatus === 0) return "pending";
  if (o.orderStatus === 1) return "accepted";
  return "rejected";
}

const Index = () => {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: fetchOrders,
  });

  const [filter, setFilter] = useState<StatusKey>("all");
  const [selected, setSelected] = useState<AdminOrder | null>(null);

  useEffect(() => {
    document.title = "Orders Dashboard | Biscofa";
  }, []);

  const orders = data ?? [];

  const stats = useMemo(() => {
    const totalPoints = orders.reduce((s, o) => s + o.pointsEarned, 0);
    const pending = orders.filter((o) => o.orderStatus === 0).length;
    const accepted = orders.filter((o) => o.orderStatus === 1).length;
    const rejected = orders.filter((o) => o.orderStatus !== 0 && o.orderStatus !== 1).length;
    return { count: orders.length, totalPoints, pending, accepted, rejected };
  }, [orders]);

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => statusOf(o) === filter);
  }, [orders, filter]);

  return (
    <div className="min-h-screen bg-gradient-surface">
      <main className="container space-y-8 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Orders Dashboard</h1>
          <Button onClick={() => refetch()} disabled={isFetching} className="bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90">
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </header>

        {/* Stats row */}
        <section className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile label="Total Orders" value={stats.count.toString()} />
          <StatTile label="Total Points" value={stats.totalPoints.toString()} />
          <StatTile label="Pending" value={stats.pending.toString()} labelColor="text-warning-foreground" accent="warning" />
          <StatTile label="Accepted" value={stats.accepted.toString()} labelColor="text-accent" accent="accent" />
          <StatTile label="Rejected" value={stats.rejected.toString()} labelColor="text-destructive" accent="destructive" />
          <StatTile label="Rate" value={`${POINTS_RATE} EGP = 1 Pt`} small />
        </section>

        {/* Filter chips */}
        <section className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-xl px-5 py-2.5 text-sm font-semibold transition-smooth border border-transparent",
                f.tone,
                filter === f.key && "ring-2 ring-primary/60 ring-offset-2 ring-offset-background shadow-soft scale-[1.02]"
              )}
            >
              {f.label}
            </button>
          ))}
        </section>

        {/* Table */}
        <Card className="overflow-hidden border-border/60 bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <Th>Customer</Th>
                  <Th>Total</Th>
                  <Th>Points</Th>
                  <Th>Status</Th>
                  <Th className="text-right pr-6">Action</Th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td colSpan={5} className="p-3"><Skeleton className="h-12 w-full" /></td>
                    </tr>
                  ))
                ) : isError ? (
                  <tr><td colSpan={5}>
                    <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
                      <AlertCircle className="h-10 w-10 text-destructive" />
                      <h3 className="text-lg font-semibold">Could not load orders</h3>
                      <p className="max-w-md text-sm text-muted-foreground">
                        The API may be unreachable, or your browser is blocking the request because the preview is HTTPS and the API is HTTP (mixed content).
                      </p>
                      <Button variant="outline" onClick={() => refetch()}>Retry</Button>
                    </div>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-sm text-muted-foreground">No orders match this filter.</td></tr>
                ) : (
                  filtered.map((o) => {
                    const s = statusOf(o);
                    const tone =
                      s === "pending" ? "bg-warning/20 text-warning-foreground border-warning/40" :
                      s === "accepted" ? "bg-accent/15 text-accent border-accent/30" :
                      "bg-destructive/15 text-destructive border-destructive/30";
                    return (
                      <tr key={o.id} className="border-t border-border/60 transition-smooth hover:bg-muted/30">
                        <td className="p-4">
                          <div className="font-medium text-foreground">{o.user?.fullName || "Unknown"}</div>
                          <div className="text-xs text-muted-foreground">Total Points: {o.pointsEarned}</div>
                        </td>
                        <td className="p-4 font-medium">{o.totalAmount.toFixed(0)} EGP</td>
                        <td className="p-4 font-semibold">{o.pointsEarned} pts</td>
                        <td className="p-4">
                          <Badge variant="outline" className={cn("border rounded-full px-3 py-0.5 capitalize", tone)}>
                            {s}
                          </Badge>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <Button
                            onClick={() => setSelected(o)}
                            className="bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-90"
                            size="sm"
                          >
                            <Eye className="mr-1.5 h-4 w-4" />
                            View
                            <Printer className="ml-1.5 h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      <OrderDetailsDialog order={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
};

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-4 text-xs font-bold uppercase tracking-wider text-foreground", className)}>{children}</th>;
}

function StatTile({
  label,
  value,
  labelColor,
  accent,
  small,
}: {
  label: string;
  value: string;
  labelColor?: string;
  accent?: "warning" | "accent" | "destructive";
  small?: boolean;
}) {
  const ring =
    accent === "warning" ? "before:bg-warning" :
    accent === "accent" ? "before:bg-accent" :
    accent === "destructive" ? "before:bg-destructive" :
    "before:bg-primary";
  return (
    <Card className={cn(
      "relative overflow-hidden p-5 shadow-soft transition-smooth hover:shadow-elegant hover:-translate-y-0.5",
      "before:absolute before:left-0 before:top-0 before:h-full before:w-1", ring,
    )}>
      <p className={cn("text-sm font-medium", labelColor || "text-muted-foreground")}>{label}</p>
      <p className={cn("mt-2 font-bold tracking-tight text-foreground", small ? "text-lg" : "text-3xl")}>{value}</p>
    </Card>
  );
}

export default Index;
