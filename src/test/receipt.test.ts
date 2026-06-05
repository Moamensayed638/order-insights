import { describe, expect, it, vi } from "vitest";
import { buildReceiptHtml } from "@/lib/receipt";
import type { AdminOrder } from "@/types/order";

const order: AdminOrder = {
  id: 42,
  userId: "user-1",
  user: {
    fullName: "Sara Ali",
    phoneNumber: "01000000000",
    email: "sara@example.com",
    customerCode: "C-1",
    id: "user-1",
  },
  subTotal: 120,
  discountAmount: 10,
  totalAmount: 110,
  pointsEarned: 3,
  pointsRedeemed: 0,
  createdAt: "2026-04-30T10:15:00.000Z",
  orderItems: [
    {
      id: 1,
      orderId: 42,
      productId: 7,
      productName: "Chicken Wrap",
      quantity: 2,
      unitPrice: 60,
      discountAmount: 10,
      totalPrice: 110,
      modifiers: [],
    },
  ],
  orderStatus: 1,
  paymentStatus: 1,
  paymentMethod: 0,
  shippingAddress: "123 Main St",
  orderType: 2,
  deliveryFee: 15,
  isRewardOrder: false,
};

describe("receipt helpers", () => {
  it("builds a receipt html summary for an order", () => {
    const html = buildReceiptHtml(order);

    expect(html).toContain("Order Receipt #42");
    expect(html).toContain("Sara Ali");
    expect(html).toContain("Chicken Wrap");
    expect(html).toContain("110.00 EGP");
  });

  it("lays out for an 80mm roll at 72mm printable width", () => {
    const html = buildReceiptHtml(order);

    expect(html).toMatch(/@page\s*\{[^}]*size:\s*80mm/);
    expect(html).toMatch(/width:\s*72mm/);
  });

  it("renders each item as five labeled lines", () => {
    const html = buildReceiptHtml(order);

    expect(html).toContain("Qty: 2");
    expect(html).toContain("Unit: 60.00 EGP");
    expect(html).toContain("Discount: 10.00 EGP");
    expect(html).toContain("Total: 110.00 EGP");
  });

  it("always shows the item discount line even when it is zero", () => {
    const html = buildReceiptHtml({
      ...order,
      orderItems: [{ ...order.orderItems[0], discountAmount: 0 }],
    });

    expect(html).toContain("Discount: 0.00 EGP");
  });

  it("does not include its own print/cancel buttons", () => {
    const html = buildReceiptHtml(order);

    expect(html).not.toContain("window.print()");
    expect(html).not.toContain("window.close()");
    expect(html).not.toContain("<button");
  });
});
