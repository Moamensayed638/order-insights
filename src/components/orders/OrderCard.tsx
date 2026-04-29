import { useState } from "react";
import { ChevronDown, MapPin, Phone, User, Package, Gift, CreditCard, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminOrder, ORDER_STATUS, PAYMENT_STATUS, ORDER_TYPE, PAYMENT_METHOD } from "@/types/order";
import { cn } from "@/lib/utils";

const fmt = (n: number) => `${n.toFixed(2)} EGP`;
const date = (s: string) =>
  new Date(s).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function OrderCard({ order }: { order: AdminOrder }) {
  const [open, setOpen] = useState(false);
  const status = ORDER_STATUS[order.orderStatus] ?? ORDER_STATUS[0];
  const pay = PAYMENT_STATUS[order.paymentStatus] ?? PAYMENT_STATUS[0];

  return (
    <Card className="overflow-hidden border-border/60 bg-card shadow-soft transition-smooth hover:shadow-elegant">
      <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <span className="text-sm font-bold">#{order.id}</span>
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-foreground">{order.user?.fullName ?? "Unknown"}</h3>
              {order.isRewardOrder && (
                <Badge className="border border-primary/30 bg-primary/10 text-primary hover:bg-primary/15">
                  <Gift className="mr-1 h-3 w-3" /> Reward
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{date(order.createdAt)}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{order.user?.phoneNumber}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{order.shippingAddress}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          <div className="flex flex-col items-end">
            <span className="text-2xl font-bold text-foreground">{fmt(order.totalAmount)}</span>
            {order.discountAmount > 0 && (
              <span className="text-xs text-muted-foreground line-through">{fmt(order.subTotal)}</span>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className={cn("border", status.tone)}>{status.label}</Badge>
            <Badge variant="outline" className={cn("border", pay.tone)}>{pay.label}</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="shrink-0">
            <ChevronDown className={cn("h-5 w-5 transition-transform", open && "rotate-180")} />
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-muted/30 px-5 py-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Detail icon={<User className="h-3.5 w-3.5" />} label="Customer email" value={order.user?.email} />
            <Detail icon={<Truck className="h-3.5 w-3.5" />} label="Order type" value={ORDER_TYPE[order.orderType] ?? "—"} />
            <Detail icon={<CreditCard className="h-3.5 w-3.5" />} label="Payment" value={PAYMENT_METHOD[order.paymentMethod] ?? "—"} />
            <Detail icon={<Package className="h-3.5 w-3.5" />} label="Delivery fee" value={fmt(order.deliveryFee)} />
          </div>

          <div className="mt-5">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items ({order.orderItems.length})</h4>
            {order.orderItems.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-background/60 p-4 text-center text-sm text-muted-foreground">
                No items in this order
              </p>
            ) : (
              <div className="space-y-2">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-background p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                        {item.quantity}×
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{fmt(item.unitPrice)} / unit</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{fmt(item.totalPrice)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <Money label="Subtotal" value={fmt(order.subTotal)} />
            <Money label="Discount" value={`- ${fmt(order.discountAmount)}`} />
            <Money label="Points earned" value={`${order.pointsEarned}`} />
            <Money label="Total" value={fmt(order.totalAmount)} highlight />
          </div>
        </div>
      )}
    </Card>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <p className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </p>
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