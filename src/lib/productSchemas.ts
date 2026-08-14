import { z } from "zod";

/**
 * The admin API is bilingual: every user-facing string comes back as an
 * `…Ar` / `…En` pair, and any of them may be null for rows created before the
 * bilingual migration. We normalise here so the rest of the app can rely on a
 * plain `name` / `description` for display while still holding both languages
 * for editing.
 */
const text = z.preprocess((v) => (v == null ? "" : v), z.string());
const num = z.preprocess((v) => (v == null ? 0 : v), z.number());
const bool = z.preprocess((v) => (v == null ? false : v), z.boolean());

/** English is the admin panel's display language; fall back to Arabic. */
export function pickDisplay(en: string, ar: string): string {
  return en.trim() || ar.trim();
}

export const productSizeSchema = z
  .object({
    id: z.number(),
    nameAr: text,
    nameEn: text,
    price: num,
    isDefault: bool,
  })
  .transform((s) => ({ ...s, name: pickDisplay(s.nameEn, s.nameAr) }));

export const modifierOptionSchema = z
  .object({
    id: z.number(),
    nameAr: text,
    nameEn: text,
    extraPrice: num,
  })
  .transform((o) => ({ ...o, name: pickDisplay(o.nameEn, o.nameAr) }));

export const modifierGroupSchema = z
  .object({
    id: z.number(),
    nameAr: text,
    nameEn: text,
    isRequired: bool,
    maxSelections: num,
    options: z.preprocess((v) => v ?? [], z.array(modifierOptionSchema)),
  })
  .transform((g) => ({ ...g, name: pickDisplay(g.nameEn, g.nameAr) }));

export const adminProductSchema = z
  .object({
    id: z.number(),
    nameAr: text,
    nameEn: text,
    descriptionAr: text,
    descriptionEn: text,
    price: num,
    calories: num,
    pointsReward: num,
    imageUrl: text,
    isAvailable: bool,
    categoryName: text,
    categoryId: z.number().nullish().transform((v) => v ?? undefined),
    sizes: z.preprocess((v) => v ?? [], z.array(productSizeSchema)),
    modifierGroups: z.preprocess((v) => v ?? [], z.array(modifierGroupSchema)),
    discountedPrice: num,
    discountPercentage: z.number().nullish().transform((v) => v ?? undefined),
    discountStart: z.string().nullish().transform((v) => v ?? undefined),
    discountEnd: z.string().nullish().transform((v) => v ?? undefined),
  })
  .transform((p) => ({
    ...p,
    name: pickDisplay(p.nameEn, p.nameAr),
    description: pickDisplay(p.descriptionEn, p.descriptionAr),
  }));

export const adminProductsResponseSchema = z.array(adminProductSchema);

export const topSellingProductSchema = z.object({
  id: z.number(),
  name: text,
  price: num,
  imageUrl: text,
  totalSold: num,
});

export const topSellingResponseSchema = z.array(topSellingProductSchema);

export const categorySchema = z
  .object({
    id: z.number(),
    nameAr: text,
    nameEn: text,
    descriptionAr: text,
    descriptionEn: text,
  })
  .transform((c) => ({ ...c, name: pickDisplay(c.nameEn, c.nameAr) }));

export const categoriesResponseSchema = z.array(categorySchema);
