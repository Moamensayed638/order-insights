import { useEffect, useMemo, useRef, useState, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, RefreshCw, ShoppingBag, DollarSign, Users, TrendingUp, AlertCircle,
  ChevronDown, ChevronUp, ArrowUpDown, Phone, MapPin, Gift, CreditCard, Truck, Package, User as UserIcon, MoreHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/orders/StatCard";
import { AdminOrder, ORDER_STATUS, PAYMENT_STATUS, ORDER_TYPE, PAYMENT_METHOD } from "@/types/order";
import { cn } from "@/lib/utils";
import { apiUrl, getAuthHeaders, getStoredToken } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { buildReceiptHtml } from "@/lib/receipt";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ORDERS_PATH = "adminorders";

async function fetchOrders(): Promise<AdminOrder[]> {
  const res = await fetch(apiUrl(ORDERS_PATH), {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

const fmt = (n: number) => `${n.toFixed(2)} EGP`;
const fmtDate = (s: string) =>
  new Date(s).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

type SortKey = "id" | "name" | "total" | "items" | "date";
type SortDir = "asc" | "desc";

const Index = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: fetchOrders,
  });

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<AdminOrder | null>(null);
  const receiptFrameRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    document.title = "Admin Orders | Biscofa Dashboard";
  }, []);

  useEffect(() => {
    if (!getStoredToken()) navigate("/login", { replace: true });
  }, [navigate]);

  const orders = data ?? [];

  const stats = useMemo(() => {
    const revenue = orders.reduce((s, o) => s + o.totalAmount, 0);
    const customers = new Set(orders.map((o) => o.userId)).size;
    const items = orders.reduce((s, o) => s + o.orderItems.reduce((q, i) => q + i.quantity, 0), 0);
    return { revenue, customers, items, count: orders.length };
  }, [orders]);

  const filtered = useMemo(() => {
    const list = orders.filter((o) => {
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
    const dir = sortDir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      switch (sortKey) {
        case "id": return (a.id - b.id) * dir;
        case "name": return (a.user?.fullName ?? "").localeCompare(b.user?.fullName ?? "") * dir;
        case "total": return (a.totalAmount - b.totalAmount) * dir;
        case "items":
          return (a.orderItems.reduce((s, i) => s + i.quantity, 0) - b.orderItems.reduce((s, i) => s + i.quantity, 0)) * dir;
        case "date": return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
      }
    });
  }, [orders, search, tab, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
  };

  const openReceiptPreview = (order: AdminOrder) => setReceiptOrder(order);

  const handlePrintReceipt = () => {
    const frameWindow = receiptFrameRef.current?.contentWindow;
    frameWindow?.focus();
    frameWindow?.print();
  };

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
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-12 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <h3 className="text-lg font-semibold text-foreground">Could not load orders</h3>
              <p className="max-w-md text-sm text-muted-foreground">
                The API at <code className="rounded bg-muted px-1">{import.meta.env.VITE_API_URL || "VITE_API_URL"}</code> might be unreachable, or your browser is blocking it (CORS / mixed content). Try again in a moment.
              </p>
              <Button variant="outline" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/60 p-12 text-center">
              <p className="text-sm text-muted-foreground">No orders match your filters.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-soft">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-10" />
                    <SortHead label="ID" k="id" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                    <SortHead label="Customer" k="name" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                    <TableHead>Phone</TableHead>
                    <SortHead label="Items" k="items" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="text-right" />
                    <SortHead label="Total" k="total" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="text-right" />
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Type</TableHead>
                    <SortHead label="Date" k="date" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                    <TableHead className="w-16 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o) => {
                    const status = ORDER_STATUS[o.orderStatus] ?? ORDER_STATUS[0];
                    const pay = PAYMENT_STATUS[o.paymentStatus] ?? PAYMENT_STATUS[0];
                    const itemCount = o.orderItems.reduce((s, i) => s + i.quantity, 0);
                    const isOpen = expanded === o.id;
                    return (
                      <Fragment key={o.id}>
                        <TableRow
                          className="cursor-pointer transition-smooth hover:bg-muted/40"
                          onClick={() => setExpanded(isOpen ? null : o.id)}
                        >
                          <TableCell>
                            {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </TableCell>
                          <TableCell className="font-mono font-semibold text-primary">#{o.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{o.user?.fullName ?? "Unknown"}</span>
                              {o.isRewardOrder && (
                                <Badge className="border border-primary/30 bg-primary/10 text-primary hover:bg-primary/15">
                                  <Gift className="mr-1 h-3 w-3" />Reward
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{o.user?.phoneNumber ?? "—"}</TableCell>
                          <TableCell className="text-right tabular-nums">{itemCount}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">{fmt(o.totalAmount)}</TableCell>
                          <TableCell><Badge variant="outline" className={cn("border", status.tone)}>{status.label}</Badge></TableCell>
                          <TableCell><Badge variant="outline" className={cn("border", pay.tone)}>{pay.label}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{ORDER_TYPE[o.orderType] ?? "—"}</TableCell>
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(o.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open order actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={() => openReceiptPreview(o)}>
                                  Print
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {isOpen && (
                          <TableRow className="bg-muted/20 hover:bg-muted/20">
                            <TableCell colSpan={11} className="p-0">
                              <div className="space-y-4 px-6 py-5">
                                <div className="grid gap-4 md:grid-cols-4">
                                  <Detail icon={<UserIcon className="h-3.5 w-3.5" />} label="Email" value={o.user?.email} />
                                  <Detail icon={<MapPin className="h-3.5 w-3.5" />} label="Shipping" value={o.shippingAddress} />
                                  <Detail icon={<CreditCard className="h-3.5 w-3.5" />} label="Payment method" value={PAYMENT_METHOD[o.paymentMethod] ?? "—"} />
                                  <Detail icon={<Truck className="h-3.5 w-3.5" />} label="Delivery fee" value={fmt(o.deliveryFee)} />
                                </div>
                                <div>
                                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Items ({o.orderItems.length})
                                  </h4>
                                  {o.orderItems.length === 0 ? (
                                    <p className="rounded-md border border-dashed border-border bg-background/60 p-3 text-center text-sm text-muted-foreground">No items</p>
                                  ) : (
                                    <div className="overflow-hidden rounded-md border border-border/60 bg-background">
                                      <Table>
                                        <TableHeader>
                                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                                            <TableHead>Product</TableHead>
                                            <TableHead className="text-right">Qty</TableHead>
                                            <TableHead className="text-right">Unit</TableHead>
                                            <TableHead className="text-right">Discount</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {o.orderItems.map((it) => (
                                            <TableRow key={it.id}>
                                              <TableCell className="font-medium">{it.productName}</TableCell>
                                              <TableCell className="text-right tabular-nums">{it.quantity}</TableCell>
                                              <TableCell className="text-right tabular-nums">{fmt(it.unitPrice)}</TableCell>
                                              <TableCell className="text-right tabular-nums">{fmt(it.discountAmount)}</TableCell>
                                              <TableCell className="text-right font-semibold tabular-nums">{fmt(it.totalPrice)}</TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                  <Money label="Subtotal" value={fmt(o.subTotal)} />
                                  <Money label="Discount" value={`- ${fmt(o.discountAmount)}`} />
                                  <Money label="Points earned" value={`${o.pointsEarned}`} />
                                  <Money label="Total" value={fmt(o.totalAmount)} highlight />
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </main>

      <Dialog open={Boolean(receiptOrder)} onOpenChange={(open) => !open && setReceiptOrder(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Receipt preview</DialogTitle>
            <DialogDescription>
              Review the receipt before printing.
            </DialogDescription>
          </DialogHeader>

          <div className="h-[70vh] overflow-hidden rounded-lg border border-border/60 bg-white">
            {receiptOrder && (
              <iframe
                ref={receiptFrameRef}
                title={`Receipt preview ${receiptOrder.id}`}
                className="h-full w-full"
                srcDoc={buildReceiptHtml(receiptOrder)}
              />
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptOrder(null)}>
              Cancel
            </Button>
            <Button onClick={handlePrintReceipt} disabled={!receiptOrder}>
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function SortHead({
  label, k, sortKey, sortDir, onClick, className,
}: {
  label: string; k: SortKey; sortKey: SortKey; sortDir: SortDir; onClick: (k: SortKey) => void; className?: string;
}) {
  const active = sortKey === k;
  return (
    <TableHead className={cn("cursor-pointer select-none", className)} onClick={() => onClick(k)}>
      <span className={cn("inline-flex items-center gap-1", active && "text-foreground")}>
        {label}
        {active ? (sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
      </span>
    </TableHead>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <p className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{icon}{label}</p>
      <p className="truncate text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}

function Money({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-lg border border-border/60 bg-background p-3", highlight && "bg-gradient-primary text-primary-foreground border-transparent shadow-glow")}>
      <p className={cn("text-[11px] font-medium uppercase tracking-wider", highlight ? "text-primary-foreground/80" : "text-muted-foreground")}>{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

export default Index;
