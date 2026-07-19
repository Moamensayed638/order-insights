import { z } from "zod";

export const orderUserSchema = z.object({
  fullName: z.string(),
  phoneNumber: z.string(),
  email: z.string(),
  customerCode: z.string().optional(),
  id: z.string(),
});

export const orderItemSchema = z.object({
  id: z.number(),
  orderId: z.number(),
  productId: z.number(),
  productName: z.string().optional(),
  productNameAr: z.string().optional(),
  productNameEn: z.string().optional(),
  productSizeId: z.number().optional(),
  quantity: z.number(),
  unitPrice: z.number(),
  discountAmount: z.number(),
  totalPrice: z.number(),
  modifiers: z.array(z.unknown()).optional(),
}).refine(
  (item) => [item.productNameEn, item.productNameAr, item.productName]
    .some((name) => Boolean(name?.trim())),
  { message: "A product name is required", path: ["productName"] },
).transform(({ productNameEn, productNameAr, productName, ...item }) => ({
  ...item,
  productName: [productNameEn, productNameAr, productName]
    .find((name) => Boolean(name?.trim()))
    ?.trim() ?? "",
}));

export const adminOrderSchema = z.object({
  id: z.number(),
  userId: z.string(),
  user: orderUserSchema.optional(),
  subTotal: z.number(),
  discountAmount: z.number(),
  totalAmount: z.number(),
  pointsEarned: z.number(),
  pointsRedeemed: z.number(),
  createdAt: z.string(),
  orderItems: z.array(orderItemSchema),
  orderStatus: z.number(),
  paymentStatus: z.number(),
  paymentMethod: z.number(),
  shippingAddress: z.string().optional(),
  orderType: z.number(),
  deliveryFee: z.number(),
  isRewardOrder: z.boolean(),
});

export const adminOrdersResponseSchema = z.union([
  z.array(adminOrderSchema),
  z.object({
    data: z.array(adminOrderSchema),
  }).strict(),
]);
