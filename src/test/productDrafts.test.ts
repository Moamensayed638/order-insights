import { describe, test, expect, beforeEach } from "vitest";
import {
  saveDraft,
  getAllDrafts,
  getDraftById,
  deleteDraft,
  clearAllDrafts,
  createDraftFromProduct,
} from "@/lib/productDrafts";
import type { AdminProduct } from "@/types/product";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("productDrafts", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  test("saves draft to localStorage", () => {
    const draft = {
      isDraft: true as const,
      draftId: "draft_123",
      sourceProductId: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      nameAr: "منتج",
      nameEn: "Product",
      descriptionAr: "وصف",
      descriptionEn: "Description",
      price: 100,
      categoryId: 1,
      calories: 200,
      pointsReward: 10,
      imageUrl: "/images/product.jpg",
      sizes: [{ nameAr: "كبير", nameEn: "Large", price: "100", isDefault: true }],
      modifierGroups: [],
    };

    saveDraft(draft);

    const stored = localStorage.getItem("biscofa_product_drafts");
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].draftId).toBe("draft_123");
  });

  test("retrieves all drafts from localStorage", () => {
    const draft1 = {
      isDraft: true as const,
      draftId: "draft_1",
      sourceProductId: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      nameAr: "منتج 1",
      nameEn: "Product 1",
      descriptionAr: "وصف",
      descriptionEn: "Description",
      price: 100,
      categoryId: 1,
      calories: 200,
      pointsReward: 10,
      imageUrl: "/images/1.jpg",
      sizes: [],
      modifierGroups: [],
    };

    const draft2 = {
      isDraft: true as const,
      draftId: "draft_2",
      sourceProductId: 2,
      createdAt: "2024-01-02T00:00:00.000Z",
      nameAr: "منتج 2",
      nameEn: "Product 2",
      descriptionAr: "وصف",
      descriptionEn: "Description",
      price: 150,
      categoryId: 1,
      calories: 300,
      pointsReward: 15,
      imageUrl: "/images/2.jpg",
      sizes: [],
      modifierGroups: [],
    };

    saveDraft(draft1);
    saveDraft(draft2);

    const drafts = getAllDrafts();
    expect(drafts).toHaveLength(2);
    expect(drafts[0].draftId).toBe("draft_1");
    expect(drafts[1].draftId).toBe("draft_2");
  });

  test("retrieves specific draft by ID", () => {
    const draft = {
      isDraft: true as const,
      draftId: "draft_abc",
      sourceProductId: 5,
      createdAt: "2024-01-01T00:00:00.000Z",
      nameAr: "منتج",
      nameEn: "Product",
      descriptionAr: "وصف",
      descriptionEn: "Description",
      price: 100,
      categoryId: 1,
      calories: 200,
      pointsReward: 10,
      imageUrl: "/images/product.jpg",
      sizes: [],
      modifierGroups: [],
    };

    saveDraft(draft);

    const retrieved = getDraftById("draft_abc");
    expect(retrieved).toBeTruthy();
    expect(retrieved?.draftId).toBe("draft_abc");
    expect(retrieved?.sourceProductId).toBe(5);
  });

  test("returns null when draft not found", () => {
    const result = getDraftById("nonexistent");
    expect(result).toBeNull();
  });

  test("deletes draft from localStorage", () => {
    const draft1 = {
      isDraft: true as const,
      draftId: "draft_1",
      sourceProductId: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      nameAr: "منتج 1",
      nameEn: "Product 1",
      descriptionAr: "وصف",
      descriptionEn: "Description",
      price: 100,
      categoryId: 1,
      calories: 200,
      pointsReward: 10,
      imageUrl: "/images/1.jpg",
      sizes: [],
      modifierGroups: [],
    };

    const draft2 = {
      isDraft: true as const,
      draftId: "draft_2",
      sourceProductId: 2,
      createdAt: "2024-01-02T00:00:00.000Z",
      nameAr: "منتج 2",
      nameEn: "Product 2",
      descriptionAr: "وصف",
      descriptionEn: "Description",
      price: 150,
      categoryId: 1,
      calories: 300,
      pointsReward: 15,
      imageUrl: "/images/2.jpg",
      sizes: [],
      modifierGroups: [],
    };

    saveDraft(draft1);
    saveDraft(draft2);

    deleteDraft("draft_1");

    const drafts = getAllDrafts();
    expect(drafts).toHaveLength(1);
    expect(drafts[0].draftId).toBe("draft_2");
  });

  test("clears all drafts from localStorage", () => {
    saveDraft({
      isDraft: true as const,
      draftId: "draft_1",
      sourceProductId: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      nameAr: "منتج",
      nameEn: "Product",
      descriptionAr: "وصف",
      descriptionEn: "Description",
      price: 100,
      categoryId: 1,
      calories: 200,
      pointsReward: 10,
      imageUrl: "/images/1.jpg",
      sizes: [],
      modifierGroups: [],
    });

    clearAllDrafts();

    const drafts = getAllDrafts();
    expect(drafts).toHaveLength(0);
  });

  test("creates draft from existing product with copy suffix", () => {
    const product: AdminProduct = {
      id: 42,
      nameAr: "بيتزا",
      nameEn: "Pizza",
      name: "Pizza",
      descriptionAr: "بيتزا لذيذة",
      descriptionEn: "Delicious pizza",
      description: "Delicious pizza",
      price: 150,
      calories: 500,
      pointsReward: 20,
      imageUrl: "/images/pizza.jpg",
      isAvailable: true,
      categoryName: "Main",
      categoryId: 3,
      discountedPrice: 150,
      sizes: [
        { id: 1, nameAr: "صغير", nameEn: "Small", name: "Small", price: 100, isDefault: false },
        { id: 2, nameAr: "كبير", nameEn: "Large", name: "Large", price: 150, isDefault: true },
      ],
      modifierGroups: [
        {
          id: 10,
          nameAr: "إضافات",
          nameEn: "Extras",
          name: "Extras",
          isRequired: false,
          maxSelections: 2,
          options: [
            { id: 100, nameAr: "جبن", nameEn: "Cheese", name: "Cheese", extraPrice: 10, isCountable: true },
            { id: 101, nameAr: "زيتون", nameEn: "Olives", name: "Olives", extraPrice: 5, isCountable: false },
          ],
        },
      ],
      discountPercentage: 10,
      discountStart: "2024-01-01T00:00:00",
      discountEnd: "2024-12-31T23:59:59",
    };

    const draft = createDraftFromProduct(product);

    expect(draft.isDraft).toBe(true);
    expect(draft.draftId).toMatch(/^draft_\d+_[a-z0-9]+$/);
    expect(draft.sourceProductId).toBe(42);
    expect(draft.nameEn).toBe("Pizza (Copy)");
    expect(draft.nameAr).toBe("بيتزا (نسخة)");
    expect(draft.descriptionEn).toBe("Delicious pizza");
    expect(draft.price).toBe(150);

    // Test that categoryId is copied correctly
    expect(draft.categoryId).toBe(3);

    // Test that imageUrl is copied correctly
    expect(draft.imageUrl).toBe("/images/pizza.jpg");

    expect(draft.sizes).toHaveLength(2);
    expect(draft.sizes[0].nameEn).toBe("Small");
    expect(draft.sizes[0].price).toBe("100");
    expect(draft.sizes[1].isDefault).toBe(true);
    expect(draft.modifierGroups).toHaveLength(1);
    expect(draft.modifierGroups[0].nameEn).toBe("Extras");
    expect(draft.modifierGroups[0].maxSelections).toBe("2");
    expect(draft.modifierGroups[0].options).toHaveLength(2);
    expect(draft.modifierGroups[0].options[0].extraPrice).toBe("10");
    expect(draft.modifierGroups[0].options[0].isCountable).toBe(true);
    expect(draft.discountPercentage).toBe(10);
    expect(draft.discountStart).toBe("2024-01-01T00:00:00");
    expect(draft.discountEnd).toBe("2024-12-31T23:59:59");
  });
});
