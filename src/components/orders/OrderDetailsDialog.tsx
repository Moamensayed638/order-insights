import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer } from "lucide-react";
import { AdminOrder, ORDER_TYPE, PAYMENT_METHOD, ORDER_STATUS, PAYMENT_STATUS } from "@/types/order";

const fmt = (n: number) => `${n.toFixed(2)} EGP`;

export function OrderDetailsDialog({
  order,
  onOpenChange,
}: {
  order: AdminOrder | null;
  onOpenChange: (open: boolean) => void;
}) {
  if (!order) return null;

  const handlePrint = () => window.print();

  const status = ORDER_STATUS[order.orderStatus] ?? ORDER_STATUS[0];
  const pay = PAYMENT_STATUS[order.paymentStatus] ?? PAYMENT_STATUS[0];

  return (
    <Dialog open={!!order} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Order #{order.id}</span>
            <Badge variant="outline" className={status.tone}>{status.label}</Badge>
            <Badge variant="outline" className={pay.tone}>{pay.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <section className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
            <Field label="Customer" value={order.user?.fullName} />
            <Field label="Phone" value={order.user?.phoneNumber} />
            <Field label="Email" value={order.user?.email} />
            <Field label="Address" value={order.shippingAddress} />
            <Field label="Order Type" value={ORDER_TYPE[order.orderType]} />
            <Field label="Payment" value={PAYMENT_METHOD[order.paymentMethod]} />
            <Field label="Created" value={new Date(order.createdAt).toLocaleString()} />
            <Field label="Reward Order" value={order.isRewardOrder ? "Yes" : "No"} />
          </section>

          <section>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Items</h4>
            {order.orderItems.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">No items</p>
            ) : (
              <div className="space-y-2">
                {order.orderItems.map((it) => (
                  <div key={it.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-background p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">{it.quantity}×</span>
                      <div>
                        <p className="text-sm font-medium">{it.productName}</p>
                        <p className="text-xs text-muted-foreground">{fmt(it.unitPrice)} / unit</p>
                      </div>
                    </div>
                    <span className="font-semibold">{fmt(it.totalPrice)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Money label="Subtotal" value={fmt(order.subTotal)} />
            <Money label="Discount" value={`- ${fmt(order.discountAmount)}`} />
            <Money label="Delivery" value={fmt(order.deliveryFee)} />
            <Money label="Total" value={fmt(order.totalAmount)} highlight />
          </section>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button onClick={handlePrint} className="bg-gradient-primary text-primary-foreground">
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground">{value || "—"}</p>
    </div>
  );
}

function Money({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? "border-transparent bg-gradient-primary text-primary-foreground" : "border-border/60 bg-background"}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-wider ${highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}