import type { AdminProduct, ProductDraft } from "@/types/product";
import type { SizeDraft, ModifierGroupDraft } from "./adminProducts";

const STORAGE_KEY = "biscofa_product_drafts";

export function saveDraft(draft: ProductDraft): void {
  const drafts = getAllDrafts();
  const existingIndex = drafts.findIndex((d) => d.draftId === draft.draftId);

  if (existingIndex >= 0) {
    drafts[existingIndex] = draft;
  } else {
    drafts.push(draft);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function getAllDrafts(): ProductDraft[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored) as ProductDraft[];
  } catch {
    return [];
  }
}

export function getDraftById(id: string): ProductDraft | null {
  const drafts = getAllDrafts();
  return drafts.find((d) => d.draftId === id) ?? null;
}

export function deleteDraft(id: string): void {
  const drafts = getAllDrafts();
  const filtered = drafts.filter((d) => d.draftId !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function clearAllDrafts(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function createDraftFromProduct(product: AdminProduct): ProductDraft {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substr(2, 9);
  const draftId = `draft_${timestamp}_${randomStr}`;

  const sizes: SizeDraft[] = product.sizes.map((s) => ({
    nameAr: s.nameAr,
    nameEn: s.nameEn,
    price: String(s.price),
    isDefault: s.isDefault,
  }));

  const modifierGroups: ModifierGroupDraft[] = product.modifierGroups.map((g) => ({
    nameAr: g.nameAr,
    nameEn: g.nameEn,
    isRequired: g.isRequired,
    maxSelections: String(g.maxSelections),
    options: g.options.map((o) => ({
      nameAr: o.nameAr,
      nameEn: o.nameEn,
      extraPrice: String(o.extraPrice),
    })),
  }));

  return {
    isDraft: true,
    draftId,
    sourceProductId: product.id,
    createdAt: new Date().toISOString(),
    nameAr: product.nameAr + " (نسخة)",
    nameEn: product.nameEn + " (Copy)",
    descriptionAr: product.descriptionAr,
    descriptionEn: product.descriptionEn,
    price: product.price,
    categoryId: product.categoryId ?? 0,
    calories: product.calories,
    pointsReward: product.pointsReward,
    imageUrl: product.imageUrl,
    discountPercentage: product.discountPercentage,
    discountStart: product.discountStart,
    discountEnd: product.discountEnd,
    sizes,
    modifierGroups,
  };
}
