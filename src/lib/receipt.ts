import { ORDER_TYPE, type AdminOrder } from "@/types/order";

const fmt = (n: number) => `${n.toFixed(2)} EGP`;

const fmtDate = (s: string) =>
  new Date(s).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function buildReceiptHtml(order: AdminOrder) {
  const rows = order.orderItems
    .map(
      (item) => `
        <tr>
          <td>${item.productName}</td>
          <td class="right">${item.quantity}</td>
          <td class="right">${fmt(item.unitPrice)}</td>
          <td class="right">${fmt(item.discountAmount)}</td>
          <td class="right">${fmt(item.totalPrice)}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <html>
      <head>
        <title>Order Receipt #${order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h1 { margin: 0 0 8px; font-size: 22px; }
          .meta { margin-bottom: 18px; font-size: 14px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border-bottom: 1px solid #ddd; padding: 8px 6px; text-align: left; font-size: 13px; }
          .right { text-align: right; }
          .actions { display: flex; gap: 10px; margin: 18px 0; }
          .actions button { border: 1px solid #ccc; background: #f8f8f8; padding: 8px 14px; border-radius: 8px; cursor: pointer; }
          .summary { margin-top: 18px; display: grid; gap: 6px; font-size: 14px; }
          .summary div { display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <h1>Order Receipt #${order.id}</h1>
        <div class="meta">
          <div><strong>Customer:</strong> ${order.user?.fullName ?? "Unknown"}</div>
          <div><strong>Phone:</strong> ${order.user?.phoneNumber ?? "—"}</div>
          <div><strong>Date:</strong> ${fmtDate(order.createdAt)}</div>
          <div><strong>Type:</strong> ${ORDER_TYPE[order.orderType] ?? "—"}</div>
          <div><strong>Address:</strong> ${order.shippingAddress ?? "—"}</div>
        </div>
        <div class="actions">
          <button type="button" onclick="window.print()">Print</button>
          <button type="button" onclick="window.close()">Cancel</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="right">Qty</th>
              <th class="right">Unit</th>
              <th class="right">Discount</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="5">No items</td></tr>`}
          </tbody>
        </table>
        <div class="summary">
          <div><span>Subtotal</span><span>${fmt(order.subTotal)}</span></div>
          <div><span>Discount</span><span>- ${fmt(order.discountAmount)}</span></div>
          <div><span>Delivery fee</span><span>${fmt(order.deliveryFee)}</span></div>
          <div><strong>Total</strong><strong>${fmt(order.totalAmount)}</strong></div>
        </div>
      </body>
    </html>
  `;
}
