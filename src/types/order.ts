export interface OrderUser {
  fullName: string;
  phoneNumber: string;
  email: string;
  customerCode: string;
  id: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productSizeId?: number;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalPrice: number;
  modifiers: unknown[];
}

export interface AdminOrder {
  id: number;
  userId: string;
  user: OrderUser;
  subTotal: number;
  discountAmount: number;
  totalAmount: number;
  pointsEarned: number;
  pointsRedeemed: number;
  createdAt: string;
  orderItems: OrderItem[];
  orderStatus: number;
  paymentStatus: number;
  paymentMethod: number;
  shippingAddress: string;
  orderType: number;
  deliveryFee: number;
  isRewardOrder: boolean;
}

export const ORDER_STATUS: Record<number, { label: string; tone: string }> = {
  0: { label: "Pending",   tone: "bg-warning/15 text-warning border-warning/30" },
  1: { label: "Completed", tone: "bg-accent/15 text-accent border-accent/30" },
  2: { label: "Cancelled", tone: "bg-destructive/15 text-destructive border-destructive/30" },
};

export const PAYMENT_STATUS: Record<number, { label: string; tone: string }> = {
  0: { label: "Unpaid", tone: "bg-muted/80 text-muted-foreground border-border/60" },
  1: { label: "Paid",   tone: "bg-accent/15 text-accent border-accent/30" },
};

export const ORDER_TYPE: Record<number, string> = {
  0: "Dine-in",
  1: "Pickup",
  2: "Delivery",
};

export const PAYMENT_METHOD: Record<number, string> = {
  0: "Cash",
  1: "Card",
};