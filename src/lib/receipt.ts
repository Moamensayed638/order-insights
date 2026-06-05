import { ORDER_TYPE, type AdminOrder } from "@/types/order";

const fmt = (n: number) => `${n.toFixed(2)} EGP`;

const fmtDate = (s: string) =>
  new Date(s).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);

  const amp = "\u0026";
  return str
    .replace(/&/g, amp + "amp;")
    .replace(/</g, amp + "lt;")
    .replace(/>/g, amp + "gt;")
    .replace(/"/g, amp + "quot;")
    .replace(/'/g, amp + "#39;");
}

export function buildReceiptHtml(order: AdminOrder) {
  const items = order.orderItems
    .map(
      (item) => `
        <div class="item">
          <div class="item-name">${escapeHtml(item.productName)}</div>
          <div class="item-line">Qty: ${item.quantity}</div>
          <div class="item-line">Unit: ${escapeHtml(fmt(item.unitPrice))}</div>
          <div class="item-line">Discount: ${escapeHtml(fmt(item.discountAmount))}</div>
          <div class="item-line">Total: ${escapeHtml(fmt(item.totalPrice))}</div>
        </div>
      `,
    )
    .join("");

  const orderTypeLabel = ORDER_TYPE[order.orderType] ?? "—";

  return `
    <html>
      <head>
        <title>Order Receipt #${order.id}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; width: 72mm; padding: 3mm; margin: 0; color: #111; font-size: 12px; }
          h1 { margin: 0 0 8px; font-size: 15px; text-align: center; }
          .meta { margin-bottom: 8px; line-height: 1.5; word-break: break-word; }
          .divider { border-top: 1px solid #000; margin: 8px 0; }
          .items { }
          .item { padding: 4px 0; }
          .item + .item { border-top: 1px dashed #999; }
          .item-name { font-weight: bold; word-break: break-word; }
          .item-line { padding-left: 4px; }
          .empty { text-align: center; padding: 8px 0; }
          .summary { margin-top: 8px; display: grid; gap: 4px; }
          .summary div { display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <h1>Order Receipt #${order.id}</h1>
        <div class="meta">
          <div><strong>Customer:</strong> ${escapeHtml(order.user?.fullName ?? "Unknown")}</div>
          <div><strong>Phone:</strong> ${escapeHtml(order.user?.phoneNumber ?? "—")}</div>
          <div><strong>Date:</strong> ${escapeHtml(fmtDate(order.createdAt))}</div>
          <div><strong>Type:</strong> ${escapeHtml(orderTypeLabel)}</div>
          <div><strong>Address:</strong> ${escapeHtml(order.shippingAddress ?? "—")}</div>
        </div>
        <div class="divider"></div>
        <div class="items">
          ${items || `<div class="empty">No items</div>`}
        </div>
        <div class="divider"></div>
        <div class="summary">
          <div><span>Subtotal</span><span>${escapeHtml(fmt(order.subTotal))}</span></div>
          <div><span>Discount</span><span>- ${escapeHtml(fmt(order.discountAmount))}</span></div>
          <div><span>Delivery fee</span><span>${escapeHtml(fmt(order.deliveryFee))}</span></div>
          <div><strong>Total</strong><strong>${escapeHtml(fmt(order.totalAmount))}</strong></div>
        </div>
      </body>
    </html>
  `;
}
