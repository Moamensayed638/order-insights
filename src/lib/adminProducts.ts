import type {
  AdminProduct,
  Category,
  ProductFormInput,
  TopSellingProduct,
} from "@/types/product";

export function resolveEditCategoryId(
  product: AdminProduct,
  categories: Category[],
): string {
  if (typeof product.categoryId === "number") return String(product.categoryId);
  // The product payload only carries the legacy single-language category name,
  // so try it against either side of the bilingual category record.
  const match = categories.find(
    (c) =>
      c.nameEn === product.categoryName ||
      c.nameAr === product.categoryName ||
      c.name === product.categoryName,
  );
  if (!match) {
    if (categories.length > 0) {
      console.warn(
        `[admin-products] No category match for "${product.categoryName}" on product #${product.id}; admin must re-select.`,
      );
    }
    return "";
  }
  return String(match.id);
}

export function filterProductsBySearch(
  products: AdminProduct[],
  query: string,
): AdminProduct[] {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter((p) =>
    [
      String(p.id),
      p.nameEn,
      p.nameAr,
      p.categoryName,
      p.descriptionEn,
      p.descriptionAr,
    ].some((field) => (field ?? "").toLowerCase().includes(q)),
  );
}

export function formatDiscountTimestamp(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  // datetime-local emits "YYYY-MM-DDTHH:mm" (no seconds, no TZ).
  // The API's read response uses "YYYY-MM-DDTHH:mm:ss" (no TZ).
  // We match that format and explicitly do NOT convert to UTC, so the
  // admin's wall-clock entry round-trips intact.
  const hasSeconds = /T\d{2}:\d{2}:\d{2}/.test(value);
  return hasSeconds ? value : `${value}:00`;
}
import { apiUrl, getAuthHeaders } from "@/lib/auth";
import {
  adminProductSchema,
  adminProductsResponseSchema,
  categoriesResponseSchema,
  topSellingResponseSchema,
} from "@/lib/productSchemas";

const PRODUCTS_PATH = "admin/products";
const CATEGORIES_PATH = "admin/categories";
// Modifier options hang off the group, not off the product.
const MODIFIER_GROUPS_PATH = "admin/modifier-groups";

const API_ORIGIN = (() => {
  try {
    return new URL(apiUrl("")).origin;
  } catch {
    return "";
  }
})();

export function resolveImageUrl(url: string | undefined | null): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function parseJson(res: Response) {
  return res.json().catch(() => null);
}

async function ensureOk(res: Response) {
  if (res.ok) return;
  const payload = await parseJson(res);
  const message =
    payload && typeof payload === "object" && "message" in payload &&
    typeof (payload as Record<string, unknown>).message === "string"
      ? ((payload as Record<string, string>).message)
      : `Request failed: ${res.status}`;
  throw new Error(message);
}

export async function fetchProducts(): Promise<AdminProduct[]> {
  const res = await fetch(apiUrl(PRODUCTS_PATH), { headers: { ...getAuthHeaders() } });
  await ensureOk(res);
  const payload = await parseJson(res);
  const parsed = adminProductsResponseSchema.safeParse(payload);
  if (!parsed.success) throw new Error("Invalid products response shape");
  return parsed.data as AdminProduct[];
}

export async function fetchProductById(id: number): Promise<AdminProduct> {
  const res = await fetch(apiUrl(`${PRODUCTS_PATH}/${id}`), {
    headers: { ...getAuthHeaders() },
  });
  await ensureOk(res);
  const payload = await parseJson(res);
  const parsed = adminProductSchema.safeParse(payload);
  if (!parsed.success) throw new Error("Invalid product response shape");
  return parsed.data as AdminProduct;
}

export async function fetchTopSelling(
  count = 10,
  days = 30,
): Promise<TopSellingProduct[]> {
  const res = await fetch(
    apiUrl(`${PRODUCTS_PATH}/top-selling?count=${count}&days=${days}`),
    { headers: { ...getAuthHeaders() } },
  );
  await ensureOk(res);
  const payload = await parseJson(res);
  const parsed = topSellingResponseSchema.safeParse(payload);
  if (!parsed.success) throw new Error("Invalid top-selling response shape");
  return parsed.data as TopSellingProduct[];
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(apiUrl(CATEGORIES_PATH), { headers: { ...getAuthHeaders() } });
  await ensureOk(res);
  const payload = await parseJson(res);
  const parsed = categoriesResponseSchema.safeParse(payload);
  if (!parsed.success) throw new Error("Invalid categories response shape");
  return parsed.data as Category[];
}

export function buildProductFormData(input: ProductFormInput): FormData {
  const form = new FormData();
  form.append("NameAr", input.nameAr);
  form.append("NameEn", input.nameEn);
  form.append("DescriptionAr", input.descriptionAr);
  form.append("DescriptionEn", input.descriptionEn);
  form.append("Price", String(input.price));
  form.append("CategoryId", String(input.categoryId));
  form.append("Calories", String(input.calories));
  form.append("PointsReward", String(input.pointsReward));
  if (input.image) form.append("Image", input.image);
  if (input.discountPercentage != null && !Number.isNaN(input.discountPercentage)) {
    form.append("DiscountPercentage", String(input.discountPercentage));
  }
  if (input.discountStart) form.append("DiscountStart", input.discountStart);
  if (input.discountEnd) form.append("DiscountEnd", input.discountEnd);
  return form;
}

export async function createProduct(input: ProductFormInput): Promise<AdminProduct> {
  const res = await fetch(apiUrl(PRODUCTS_PATH), {
    method: "POST",
    headers: { ...getAuthHeaders() },
    body: buildProductFormData(input),
  });
  await ensureOk(res);
  const payload = await parseJson(res);
  const parsed = adminProductSchema.safeParse(payload);
  if (parsed.success) return parsed.data as AdminProduct;
  return payload as AdminProduct;
}

export async function updateProduct(
  id: number,
  input: ProductFormInput,
): Promise<AdminProduct> {
  const res = await fetch(apiUrl(`${PRODUCTS_PATH}/${id}`), {
    method: "PUT",
    headers: { ...getAuthHeaders() },
    body: buildProductFormData(input),
  });
  await ensureOk(res);
  const payload = await parseJson(res);
  const parsed = adminProductSchema.safeParse(payload);
  if (parsed.success) return parsed.data as AdminProduct;
  return payload as AdminProduct;
}

export type ProductFormDraft = {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: string;
  categoryId: string;
  calories: string;
  pointsReward: string;
  discountPercentage: string;
};

export type SizeDraft = {
  nameAr: string;
  nameEn: string;
  price: string;
  isDefault: boolean;
};

export type ModifierOptionDraft = {
  nameAr: string;
  nameEn: string;
  extraPrice: string;
};

export type ModifierGroupDraft = {
  nameAr: string;
  nameEn: string;
  isRequired: boolean;
  maxSelections: string;
  options: ModifierOptionDraft[];
};

export function validateSizes(sizes: SizeDraft[]): string | null {
  if (sizes.length === 0) return "Add at least one size";
  for (let i = 0; i < sizes.length; i++) {
    const s = sizes[i];
    const n = i + 1;
    if (!s.nameEn.trim()) return `Size #${n}: English name is required`;
    if (!s.nameAr.trim()) return `Size #${n}: Arabic name is required`;
    const price = Number(s.price);
    if (!Number.isFinite(price) || price <= 0) return `Size #${n}: price must be greater than 0`;
  }
  const defaults = sizes.filter((s) => s.isDefault).length;
  if (defaults !== 1) return "Mark exactly one size as default";
  return null;
}

export function validateModifierGroups(groups: ModifierGroupDraft[]): string | null {
  if (groups.length === 0) return "Add at least one modifier group";
  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    const gn = gi + 1;
    if (!g.nameEn.trim()) return `Group #${gn}: English name is required`;
    if (!g.nameAr.trim()) return `Group #${gn}: Arabic name is required`;
    const max = Number(g.maxSelections);
    if (!Number.isFinite(max) || max < 1) return `Group #${gn}: max selections must be at least 1`;
    if (g.options.length === 0) return `Group #${gn}: add at least one option`;
    for (let oi = 0; oi < g.options.length; oi++) {
      const o = g.options[oi];
      const on = oi + 1;
      if (!o.nameEn.trim()) return `Group #${gn}, option #${on}: English name is required`;
      if (!o.nameAr.trim()) return `Group #${gn}, option #${on}: Arabic name is required`;
      const ep = Number(o.extraPrice);
      if (!Number.isFinite(ep) || ep < 0) return `Group #${gn}, option #${on}: extra price must be ≥ 0`;
    }
  }
  return null;
}

export function validateProductForm(
  draft: ProductFormDraft,
  opts: { isEditing: boolean; hasImage: boolean },
): string | null {
  if (!draft.nameEn.trim()) return "English name is required";
  if (draft.nameEn.trim().length < 2) return "English name must be at least 2 characters";
  if (!draft.nameAr.trim()) return "Arabic name is required";
  if (draft.nameAr.trim().length < 2) return "Arabic name must be at least 2 characters";
  if (!draft.descriptionEn.trim()) return "English description is required";
  if (!draft.descriptionAr.trim()) return "Arabic description is required";

  const price = Number(draft.price);
  if (!Number.isFinite(price) || price <= 0) return "Price must be greater than 0";

  const categoryId = Number(draft.categoryId);
  if (!categoryId) return "Pick a category";

  const calories = Number(draft.calories);
  if (!Number.isFinite(calories) || calories < 0) return "Calories must be ≥ 0";

  const pointsReward = Number(draft.pointsReward);
  if (!Number.isFinite(pointsReward) || pointsReward < 0) return "Points reward must be ≥ 0";

  if (draft.discountPercentage.trim() !== "") {
    const dp = Number(draft.discountPercentage);
    if (!Number.isFinite(dp) || dp < 0 || dp > 100) {
      return "Discount percentage must be between 0 and 100";
    }
  }

  if (!opts.isEditing && !opts.hasImage) return "Image is required when creating a product";

  return null;
}

export async function createSize(
  productId: number,
  input: { nameAr: string; nameEn: string; price: number; isDefault: boolean },
): Promise<void> {
  const res = await fetch(apiUrl(`${PRODUCTS_PATH}/${productId}/sizes`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(input),
  });
  await ensureOk(res);
}

export async function createModifierGroup(
  productId: number,
  input: { nameAr: string; nameEn: string; isRequired: boolean; maxSelections: number },
): Promise<{ id: number }> {
  const res = await fetch(apiUrl(`${PRODUCTS_PATH}/${productId}/modifier-groups`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(input),
  });
  await ensureOk(res);
  const payload = await parseJson(res);
  return payload as { id: number };
}

export async function createModifierOption(
  groupId: number,
  input: { nameAr: string; nameEn: string; extraPrice: number },
): Promise<void> {
  const res = await fetch(apiUrl(`${MODIFIER_GROUPS_PATH}/${groupId}/options`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(input),
  });
  await ensureOk(res);
}

export type SizeEditDraft = {
  nameAr: string;
  nameEn: string;
  price: string;
  isDefault: boolean;
};

export type ModifierOptionEditDraft = {
  nameAr: string;
  nameEn: string;
  extraPrice: string;
};

export function validateSizeEdit(draft: SizeEditDraft): string | null {
  if (!draft.nameEn.trim()) return "English name is required";
  if (!draft.nameAr.trim()) return "Arabic name is required";
  const price = Number(draft.price);
  if (!Number.isFinite(price) || price <= 0) return "Price must be greater than 0";
  return null;
}

export function validateModifierOptionEdit(draft: ModifierOptionEditDraft): string | null {
  if (!draft.nameEn.trim()) return "English name is required";
  if (!draft.nameAr.trim()) return "Arabic name is required";
  const extraPrice = Number(draft.extraPrice);
  if (!Number.isFinite(extraPrice) || extraPrice < 0) return "Extra price must be ≥ 0";
  return null;
}

export function applyDefaultSize<T extends { isDefault: boolean }>(
  sizes: T[],
  index: number,
): T[] {
  return sizes.map((s, i) => ({ ...s, isDefault: i === index }));
}

export async function updateSize(
  productId: number,
  sizeId: number,
  input: { nameAr: string; nameEn: string; price: number; isDefault: boolean },
): Promise<void> {
  const res = await fetch(apiUrl(`${PRODUCTS_PATH}/${productId}/sizes/${sizeId}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(input),
  });
  await ensureOk(res);
}

export async function updateModifierOption(
  groupId: number,
  optionId: number,
  input: { nameAr: string; nameEn: string; extraPrice: number },
): Promise<void> {
  const res = await fetch(apiUrl(`${MODIFIER_GROUPS_PATH}/${groupId}/options/${optionId}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(input),
  });
  await ensureOk(res);
}

export async function deleteModifierOption(
  groupId: number,
  optionId: number,
): Promise<void> {
  const res = await fetch(apiUrl(`${MODIFIER_GROUPS_PATH}/${groupId}/options/${optionId}`), {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  await ensureOk(res);
}

export async function deleteProduct(id: number): Promise<void> {
  const res = await fetch(apiUrl(`${PRODUCTS_PATH}/${id}`), {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  await ensureOk(res);
}
