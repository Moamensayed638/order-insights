import { z } from "zod";

export const productSizeSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  isDefault: z.boolean(),
});

export const modifierOptionSchema = z.object({
  id: z.number(),
  name: z.string(),
  extraPrice: z.number(),
});

export const modifierGroupSchema = z.object({
  id: z.number(),
  name: z.string(),
  isRequired: z.boolean(),
  maxSelections: z.number(),
  options: z.array(modifierOptionSchema),
});

export const adminProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  calories: z.number(),
  pointsReward: z.number(),
  imageUrl: z.string(),
  isAvailable: z.boolean(),
  categoryName: z.string(),
  categoryId: z.number().optional(),
  sizes: z.array(productSizeSchema).default([]),
  modifierGroups: z.array(modifierGroupSchema).default([]),
  discountedPrice: z.number(),
  discountPercentage: z.number().optional(),
  discountStart: z.string().optional(),
  discountEnd: z.string().optional(),
});

export const adminProductsResponseSchema = z.array(adminProductSchema);

export const topSellingProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  imageUrl: z.string(),
  totalSold: z.number(),
});

export const topSellingResponseSchema = z.array(topSellingProductSchema);

export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().default(""),
});

export const categoriesResponseSchema = z.array(categorySchema);
