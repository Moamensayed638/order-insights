import { type ReactNode, useEffect, useMemo, useRef, useState, Fragment } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search, ShoppingBag, DollarSign, Users, TrendingUp, AlertCircle,
  ChevronDown, ChevronUp, ArrowUpDown, MapPin, Gift, CreditCard, Truck,
  User as UserIcon, MoreHorizontal, Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/orders/StatCard";
import {
  AdminOrder, ORDER_STATUS, PAYMENT_STATUS, ORDER_TYPE, PAYMENT_METHOD,
} from "@/types/order";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/AppHeader";
import { buildReceiptHtml } from "@/lib/receipt";
import { fetchOrders, updateOrderStatus } from "@/lib/adminOrders";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const fmt = (n: number) => `${n.toFixed(2)} EGP`;
const fmtDate = (s: string) =>
  new Date(s).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

type SortKey = "id" | "name" | "total" | "items" | "date";
type SortDir = "asc" | "desc";

const SAMPLE_RECEIPT_ORDER: AdminOrder = {
  id: 9999,
  userId: "sample",
  user: { fullName: "Sample Customer", phoneNumber: "01000000000", email: "sample@biscofa.test", id: "sample" },
  subTotal: 175,
  discountAmount: 15,
  totalAmount: 180,
  pointsEarned: 5,
  pointsRedeemed: 0,
  createdAt: new Date().toISOString(),
  orderItems: [
    { id: 1, orderId: 9999, productId: 1, productName: "Chocolate Croissant", quantity: 2, unitPrice: 45, discountAmount: 10, totalPrice: 80 },
    { id: 2, orderId: 9999, productId: 2, productName: "Iced Latte", quantity: 1, unitPrice: 85, discountAmount: 0, totalPrice: 85 },
  ],
  orderStatus: 0,
  paymentStatus: 0,
  paymentMethod: 1,
  shippingAddress: "12 Test Street, Cairo",
  orderType: 2,
  deliveryFee: 30,
  isRewardOrder: false,
};

const Index = () => {
  const queryClient = useQueryClient();
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

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: number }) =>
      updateOrderStatus(orderId, status),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData<AdminOrder[]>(["admin-orders"], (current = []) =>
        current.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)),
      );
      toast.success(`Order #${updatedOrder.id} status updated`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update order status");
    },
  });

  useEffect(() => { document.title = "Biscofa — Admin Orders"; }, []);

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
        case "items": return (
          a.orderItems.reduce((s, i) => s + i.quantity, 0) -
          b.orderItems.reduce((s, i) => s + i.quantity, 0)
        ) * dir;
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
    receiptFrameRef.current?.contentWindow?.focus();
    receiptFrameRef.current?.contentWindow?.print();
  };

  function handleStatusChange(orderId: number, value: string) {
    statusMutation.mutate({ orderId, status: Number(value) });
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onRefresh={() => refetch()} isRefreshing={isFetching} />

      <main className="container space-y-8 py-8">

        {/* ── Page title ── */}
        <div className="animate-fade-up space-y-1">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Orders
          </h1>
          <p className="text-sm text-muted-foreground font-body">
            Monitor every order in real time across pickup, delivery and dine‑in.
          </p>
          {import.meta.env.DEV && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReceiptOrder(SAMPLE_RECEIPT_ORDER)}
              className="mt-2 border-dashed border-border/60 text-xs font-mono"
            >
              Test print (dev)
            </Button>
          )}
        </div>

        {/* ── Stat cards ── */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total orders"
            value={stats.count.toString()}
            icon={<ShoppingBag className="h-5 w-5" />}
            accent="primary"
            index={0}
          />
          <StatCard
            label="Revenue"
            value={`${stats.revenue.toFixed(0)} EGP`}
            hint="Across all orders"
            icon={<DollarSign className="h-5 w-5" />}
            accent="accent"
            index={1}
          />
          <StatCard
            label="Customers"
            value={stats.customers.toString()}
            hint="Unique buyers"
            icon={<Users className="h-5 w-5" />}
            accent="warning"
            index={2}
          />
          <StatCard
            label="Items sold"
            value={stats.items.toString()}
            icon={<TrendingUp className="h-5 w-5" />}
            accent="muted"
            index={3}
          />
        </section>

        {/* ── Filters ── */}
        <section
          className="space-y-4 animate-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Tabs value={tab} onValueChange={setTab} className="w-full md:w-auto">
              <TabsList className="bg-muted/60 border border-border/60 h-9 p-1 gap-0.5 w-full md:w-auto flex">
                {["all", "pending", "completed", "rewards"].map((t) => (
                  <TabsTrigger
                    key={t}
                    value={t}
                    className="flex-1 md:flex-none px-2 md:px-4 h-7 text-[10px] sm:text-xs font-mono uppercase tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none rounded-md"
                  >
                    {t}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders…"
                className="pl-9 h-9 bg-muted/40 border-border/60 text-sm font-body placeholder:text-muted-foreground/50 focus-visible:border-primary/50 focus-visible:ring-primary/20"
              />
            </div>
          </div>

          {/* ── Table states ── */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-12 w-full rounded-md bg-muted/50"
                  style={{ opacity: 1 - i * 0.12 }}
                />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-14 text-center">
              <div className="h-12 w-12 rounded-full border border-destructive/30 bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">Could not load orders</h3>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  The API at{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    {import.meta.env.VITE_API_URL || "VITE_API_URL"}
                  </code>{" "}
                  may be unreachable or blocked by CORS / mixed content.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="border-destructive/30 text-destructive hover:bg-destructive/10">
                Try again
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-14 text-center">
              <Package className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No orders match your filters.</p>
            </div>
          ) : (

            /* ── Orders table ── */
            <div className="overflow-x-auto rounded-lg border border-border/60 bg-card shadow-card">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/60 bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-10 py-3" />
                    <SortHead label="ID" k="id" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                    <SortHead label="Customer" k="name" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                    <TableHead className="text-[11px] font-mono uppercase tracking-wider py-3 text-muted-foreground">Phone</TableHead>
                    <SortHead label="Items" k="items" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="text-right" />
                    <SortHead label="Total" k="total" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="text-right" />
                    <TableHead className="text-[11px] font-mono uppercase tracking-wider py-3 text-muted-foreground">Status</TableHead>
                    <TableHead className="text-[11px] font-mono uppercase tracking-wider py-3 text-muted-foreground">Payment</TableHead>
                    <TableHead className="text-[11px] font-mono uppercase tracking-wider py-3 text-muted-foreground">Type</TableHead>
                    <SortHead label="Date" k="date" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                    <TableHead className="w-12 py-3" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.map((o, rowIdx) => {
                    const status = ORDER_STATUS[o.orderStatus] ?? ORDER_STATUS[0];
                    const pay = PAYMENT_STATUS[o.paymentStatus] ?? PAYMENT_STATUS[0];
                    const itemCount = o.orderItems.reduce((s, i) => s + i.quantity, 0);
                    const isOpen = expanded === o.id;

                    return (
                      <Fragment key={o.id}>
                        <TableRow
                          className={cn(
                            "cursor-pointer border-b border-border/40 transition-colors duration-150",
                            "hover:bg-primary/5",
                            isOpen && "bg-primary/8 border-primary/20",
                            rowIdx % 2 === 0 ? "bg-card" : "bg-muted/10"
                          )}
                          onClick={() => setExpanded(isOpen ? null : o.id)}
                        >
                          <TableCell className="py-3 pl-4 pr-2">
                            <div className={cn(
                              "h-5 w-5 rounded flex items-center justify-center transition-colors",
                              isOpen ? "bg-primary/20 text-primary" : "text-muted-foreground/40"
                            )}>
                              {isOpen
                                ? <ChevronUp className="h-3.5 w-3.5" />
                                : <ChevronDown className="h-3.5 w-3.5" />
                              }
                            </div>
                          </TableCell>

                          <TableCell className="py-3">
                            <span className="font-mono text-sm font-medium text-primary">
                              #{o.id}
                            </span>
                          </TableCell>

                          <TableCell className="py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground text-sm">
                                {o.user?.fullName ?? "Unknown"}
                              </span>
                              {o.isRewardOrder && (
                                <Badge className="h-4 px-1.5 text-[9px] font-mono uppercase tracking-wide bg-primary/15 text-primary border border-primary/25 hover:bg-primary/20">
                                  <Gift className="mr-0.5 h-2.5 w-2.5" />
                                  Reward
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                            {o.user?.phoneNumber ?? "—"}
                          </TableCell>

                          <TableCell className="py-3 text-right font-mono text-sm tabular-nums text-foreground/80">
                            {itemCount}
                          </TableCell>

                          <TableCell className="py-3 text-right font-mono text-sm font-medium tabular-nums text-foreground">
                            {fmt(o.totalAmount)}
                          </TableCell>

                          <TableCell className="py-3">
                            <Select
                              value={String(o.orderStatus)}
                              onValueChange={(value) => handleStatusChange(o.id, value)}
                              disabled={statusMutation.isPending}
                            >
                              <SelectTrigger
                                className={cn(
                                  "h-8 min-w-[138px] border-border/60 bg-background/70 px-2.5 text-[10px] font-mono uppercase tracking-wide",
                                  status.tone
                                )}
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Order ${o.id} status`}
                              >
                                <SelectValue placeholder={status.label} />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(ORDER_STATUS).map(([value, option]) => (
                                  <SelectItem key={value} value={value} className="text-[10px] font-mono uppercase">
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>

                          <TableCell className="py-3">
                            <StatusBadge tone={pay.tone} label={pay.label} />
                          </TableCell>

                          <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                            {ORDER_TYPE[o.orderType] ?? "—"}
                          </TableCell>

                          <TableCell className="py-3 whitespace-nowrap font-mono text-xs text-muted-foreground">
                            {fmtDate(o.createdAt)}
                          </TableCell>

                          <TableCell className="py-3 pr-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                  <span className="sr-only">Order actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-card border-border/60 text-foreground min-w-[120px]">
                                <DropdownMenuItem
                                  className="text-xs font-mono cursor-pointer hover:bg-primary/10 hover:text-primary"
                                  onClick={() => openReceiptPreview(o)}
                                >
                                  Print receipt
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>

                        {/* Expanded detail row */}
                        {isOpen && (
                          <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-primary/10">
                            <TableCell colSpan={11} className="p-0">
                              <div className="px-6 py-5 space-y-5 border-l-2 border-primary/30 ml-4">
                                {/* Detail grid */}
                                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                                  <Detail icon={<UserIcon className="h-3.5 w-3.5" />} label="Email" value={o.user?.email} />
                                  <Detail icon={<MapPin className="h-3.5 w-3.5" />} label="Shipping" value={o.shippingAddress} />
                                  <Detail icon={<CreditCard className="h-3.5 w-3.5" />} label="Payment method" value={PAYMENT_METHOD[o.paymentMethod] ?? "—"} />
                                  <Detail icon={<Truck className="h-3.5 w-3.5" />} label="Delivery fee" value={fmt(o.deliveryFee)} />
                                </div>

                                {/* Items table */}
                                <div>
                                  <p className="mb-2.5 text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                                    Items ({o.orderItems.length})
                                  </p>
                                  {o.orderItems.length === 0 ? (
                                    <p className="rounded border border-dashed border-border/60 bg-background/40 p-4 text-center text-xs text-muted-foreground font-mono">
                                      No items
                                    </p>
                                  ) : (
                                    <div className="overflow-hidden rounded-md border border-border/50">
                                      <Table>
                                        <TableHeader>
                                          <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/50">
                                            {["Product", "Qty", "Unit", "Discount", "Total"].map((h) => (
                                              <TableHead key={h} className={cn(
                                                "text-[10px] font-mono uppercase tracking-wider py-2 text-muted-foreground",
                                                h !== "Product" && "text-right"
                                              )}>
                                                {h}
                                              </TableHead>
                                            ))}
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {o.orderItems.map((it) => (
                                            <TableRow key={it.id} className="border-b border-border/30 hover:bg-primary/5">
                                              <TableCell className="py-2 text-sm font-medium">{it.productName}</TableCell>
                                              <TableCell className="py-2 text-right font-mono text-xs tabular-nums">{it.quantity}</TableCell>
                                              <TableCell className="py-2 text-right font-mono text-xs tabular-nums">{fmt(it.unitPrice)}</TableCell>
                                              <TableCell className="py-2 text-right font-mono text-xs tabular-nums text-muted-foreground">{fmt(it.discountAmount)}</TableCell>
                                              <TableCell className="py-2 text-right font-mono text-sm font-semibold tabular-nums text-primary">{fmt(it.totalPrice)}</TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  )}
                                </div>

                                {/* Money summary */}
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                  <Money label="Subtotal" value={fmt(o.subTotal)} />
                                  <Money label="Discount" value={`− ${fmt(o.discountAmount)}`} />
                                  <Money label="Points earned" value={`${o.pointsEarned} pts`} />
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

          {/* Row count */}
          {!isLoading && !isError && filtered.length > 0 && (
            <p className="text-right text-[11px] font-mono text-muted-foreground/60">
              {filtered.length} order{filtered.length !== 1 ? "s" : ""}
            </p>
          )}
        </section>
      </main>

      {/* ── Receipt dialog ── */}
      <Dialog open={Boolean(receiptOrder)} onOpenChange={(open) => !open && setReceiptOrder(null)}>
        <DialogContent className="max-w-[360px] bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Receipt Preview</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
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
            <Button
              variant="outline"
              onClick={() => setReceiptOrder(null)}
              className="border-border/60 hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePrintReceipt}
              disabled={!receiptOrder}
              className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-elegant"
            >
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ── Sub-components ── */

function SortHead({
  label, k, sortKey, sortDir, onClick, className,
}: {
  label: string; k: SortKey; sortKey: SortKey; sortDir: SortDir;
  onClick: (k: SortKey) => void; className?: string;
}) {
  const active = sortKey === k;
  return (
    <TableHead
      className={cn("cursor-pointer select-none py-3 text-[11px] font-mono uppercase tracking-wider", className)}
      onClick={() => onClick(k)}
    >
      <span className={cn(
        "inline-flex items-center gap-1 transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground/70"
      )}>
        {label}
        {active
          ? (sortDir === "asc"
            ? <ChevronUp className="h-3 w-3" />
            : <ChevronDown className="h-3 w-3" />)
          : <ArrowUpDown className="h-2.5 w-2.5 opacity-40" />
        }
      </span>
    </TableHead>
  );
}

function StatusBadge({ tone, label }: { tone: string; label: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wide border",
      tone
    )}>
      {label}
    </span>
  );
}

function Detail({ icon, label, value }: { icon: ReactNode; label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <p className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="truncate text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}

function Money({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn(
      "rounded-md border p-3",
      highlight
        ? "bg-gradient-primary border-transparent shadow-glow"
        : "bg-background/60 border-border/50"
    )}>
      <p className={cn(
        "text-[10px] font-mono font-semibold uppercase tracking-[0.12em]",
        highlight ? "text-primary-foreground/70" : "text-muted-foreground"
      )}>
        {label}
      </p>
      <p className={cn(
        "mt-1 font-mono text-sm font-semibold tabular-nums",
        highlight ? "text-primary-foreground" : "text-foreground"
      )}>
        {value}
      </p>
    </div>
  );
}

export default Index;
