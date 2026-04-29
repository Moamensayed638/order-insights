import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, RefreshCw, ShoppingBag, DollarSign, Users, TrendingUp, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/orders/StatCard";
import { OrderCard } from "@/components/orders/OrderCard";
import { AdminOrder } from "@/types/order";

const API_URL = "https://biscofa.runasp.net/api/AdminOrders";

async function fetchOrders(): Promise<AdminOrder[]> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

const Index = () => {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: fetchOrders,
  });

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  useEffect(() => {
    document.title = "Admin Orders | Biscofa Dashboard";
  }, []);

  const orders = data ?? [];

  const stats = useMemo(() => {
    const revenue = orders.reduce((s, o) => s + o.totalAmount, 0);
    const customers = new Set(orders.map((o) => o.userId)).size;
    const items = orders.reduce((s, o) => s + o.orderItems.reduce((q, i) => q + i.quantity, 0), 0);
    return { revenue, customers, items, count: orders.length };
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (tab === "pending" && o.orderStatus !== 0) return false;
      if (tab === "completed" && o.orderStatus !== 1) return false;
      if (tab === "rewards" && !o.isRewardOrder) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        String(o.id).includes(q) ||
        o.user?.fullName?.toLowerCase().includes(q) ||
        o.user?.email?.toLowerCase().includes(q) ||
        o.user?.phoneNumber?.includes(q) ||
        o.shippingAddress?.toLowerCase().includes(q)
      );
    });
  }, [orders, search, tab]);

  return (
    <div className="min-h-screen bg-gradient-surface">
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-xl">
        <div className="container flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Live admin dashboard
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Orders</h1>
            <p className="text-sm text-muted-foreground">Monitor every order in real time across pickup, delivery and dine-in.</p>
          </div>
          <Button onClick={() => refetch()} disabled={isFetching} className="bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90">
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      <main className="container space-y-8 py-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total orders" value={stats.count.toString()} icon={<ShoppingBag className="h-5 w-5" />} accent="primary" />
          <StatCard label="Revenue" value={`${stats.revenue.toFixed(0)} EGP`} hint="Across all orders" icon={<DollarSign className="h-5 w-5" />} accent="accent" />
          <StatCard label="Customers" value={stats.customers.toString()} hint="Unique buyers" icon={<Users className="h-5 w-5" />} accent="warning" />
          <StatCard label="Items sold" value={stats.items.toString()} icon={<TrendingUp className="h-5 w-5" />} accent="primary" />
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="bg-card shadow-soft">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="rewards">Rewards</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by id, name, phone, address…"
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-12 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <h3 className="text-lg font-semibold text-foreground">Could not load orders</h3>
              <p className="max-w-md text-sm text-muted-foreground">
                The API at biscofa.runasp.net might be unreachable, or your browser is blocking it (CORS / mixed content). Try again in a moment.
              </p>
              <Button variant="outline" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/60 p-12 text-center">
              <p className="text-sm text-muted-foreground">No orders match your filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
