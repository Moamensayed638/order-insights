import { describe, expect, it } from "vitest";
import {
  buildProductFormData,
  filterProductsBySearch,
  formatDiscountTimestamp,
  resolveEditCategoryId,
  resolveImageUrl,
  validateProductForm,
  type ProductFormDraft,
} from "@/lib/adminProducts";
import type { AdminProduct, Category } from "@/types/product";

const validDraft: ProductFormDraft = {
  nameAr: "موكا",
  nameEn: "Mocha",
  descriptionAr: "مشروب موكا غني",
  descriptionEn: "A rich mocha drink",
  price: "100",
  categoryId: "12",
  calories: "10",
  pointsReward: "1",
  discountPercentage: "",
};

describe("resolveImageUrl", () => {
  it("returns absolute URLs unchanged", () => {
    expect(resolveImageUrl("https://example.com/x.jpg")).toBe("https://example.com/x.jpg");
    expect(resolveImageUrl("http://example.com/x.jpg")).toBe("http://example.com/x.jpg");
  });

  it("prefixes relative URLs with the API origin", () => {
    const result = resolveImageUrl("/images/products/x.jpg");
    expect(result.startsWith("http")).toBe(true);
    expect(result.endsWith("/images/products/x.jpg")).toBe(true);
  });

  it("adds a leading slash if missing", () => {
    const result = resolveImageUrl("images/products/x.jpg");
    expect(result.endsWith("/images/products/x.jpg")).toBe(true);
  });

  it("returns empty string for null/undefined/empty", () => {
    expect(resolveImageUrl(null)).toBe("");
    expect(resolveImageUrl(undefined)).toBe("");
    expect(resolveImageUrl("")).toBe("");
  });
});

describe("validateProductForm", () => {
  it("returns null when all fields are valid (create with image)", () => {
    expect(validateProductForm(validDraft, { isEditing: false, hasImage: true })).toBeNull();
  });

  it("returns null when editing without a new image", () => {
    expect(validateProductForm(validDraft, { isEditing: true, hasImage: false })).toBeNull();
  });

  it("rejects an empty name in either language", () => {
    expect(
      validateProductForm({ ...validDraft, nameEn: "  " }, { isEditing: true, hasImage: false }),
    ).toBe("English name is required");
    expect(
      validateProductForm({ ...validDraft, nameAr: "  " }, { isEditing: true, hasImage: false }),
    ).toBe("Arabic name is required");
  });

  it("rejects an empty description in either language", () => {
    expect(
      validateProductForm({ ...validDraft, descriptionEn: "  " }, { isEditing: true, hasImage: false }),
    ).toBe("English description is required");
    expect(
      validateProductForm({ ...validDraft, descriptionAr: "  " }, { isEditing: true, hasImage: false }),
    ).toBe("Arabic description is required");
  });

  it("rejects a one-character name", () => {
    expect(
      validateProductForm({ ...validDraft, nameEn: "a" }, { isEditing: true, hasImage: false }),
    ).toBe("English name must be at least 2 characters");
    expect(
      validateProductForm({ ...validDraft, nameAr: "a" }, { isEditing: true, hasImage: false }),
    ).toBe("Arabic name must be at least 2 characters");
  });

  it("rejects a zero or negative price", () => {
    expect(
      validateProductForm({ ...validDraft, price: "0" }, { isEditing: true, hasImage: false }),
    ).toBe("Price must be greater than 0");
    expect(
      validateProductForm({ ...validDraft, price: "-5" }, { isEditing: true, hasImage: false }),
    ).toBe("Price must be greater than 0");
  });

  it("rejects a non-numeric price", () => {
    expect(
      validateProductForm({ ...validDraft, price: "abc" }, { isEditing: true, hasImage: false }),
    ).toBe("Price must be greater than 0");
  });

  it("rejects a missing category", () => {
    expect(
      validateProductForm({ ...validDraft, categoryId: "" }, { isEditing: true, hasImage: false }),
    ).toBe("Pick a category");
    expect(
      validateProductForm({ ...validDraft, categoryId: "0" }, { isEditing: true, hasImage: false }),
    ).toBe("Pick a category");
  });

  it("rejects negative calories", () => {
    expect(
      validateProductForm({ ...validDraft, calories: "-1" }, { isEditing: true, hasImage: false }),
    ).toBe("Calories must be ≥ 0");
  });

  it("rejects negative points reward", () => {
    expect(
      validateProductForm({ ...validDraft, pointsReward: "-1" }, { isEditing: true, hasImage: false }),
    ).toBe("Points reward must be ≥ 0");
  });

  it("allows an empty discount percentage", () => {
    expect(
      validateProductForm({ ...validDraft, discountPercentage: "" }, { isEditing: true, hasImage: false }),
    ).toBeNull();
  });

  it("rejects discount percentage > 100", () => {
    expect(
      validateProductForm({ ...validDraft, discountPercentage: "150" }, { isEditing: true, hasImage: false }),
    ).toBe("Discount percentage must be between 0 and 100");
  });

  it("rejects negative discount percentage", () => {
    expect(
      validateProductForm({ ...validDraft, discountPercentage: "-5" }, { isEditing: true, hasImage: false }),
    ).toBe("Discount percentage must be between 0 and 100");
  });

  it("requires an image when creating", () => {
    expect(
      validateProductForm(validDraft, { isEditing: false, hasImage: false }),
    ).toBe("Image is required when creating a product");
  });
});

describe("buildProductFormData", () => {
  function asObject(form: FormData): Record<string, string> {
    const out: Record<string, string> = {};
    form.forEach((value, key) => {
      out[key] = typeof value === "string" ? value : `[file:${(value as File).name}]`;
    });
    return out;
  }

  it("emits the exact field names the API expects (case-sensitive)", () => {
    const form = buildProductFormData({
      nameAr: "موكا",
      nameEn: "Mocha",
      descriptionAr: "غني",
      descriptionEn: "rich",
      price: 100,
      categoryId: 12,
      calories: 10,
      pointsReward: 1,
      image: null,
    });
    const obj = asObject(form);
    expect(obj.NameEn).toBe("Mocha");
    expect(obj.NameAr).toBe("موكا");
    expect(obj.DescriptionEn).toBe("rich");
    expect(obj.DescriptionAr).toBe("غني");
    expect(obj.Price).toBe("100");
    expect(obj.CategoryId).toBe("12");
    expect(obj.Calories).toBe("10");
    expect(obj.PointsReward).toBe("1");
  });

  it("does not emit lowercase aliases", () => {
    const form = buildProductFormData({
      nameAr: "س", nameEn: "x", descriptionAr: "", descriptionEn: "", price: 1, categoryId: 1,
      calories: 0, pointsReward: 0, image: null,
    });
    const obj = asObject(form);
    expect(obj.nameEn).toBeUndefined();
    expect(obj.Name).toBeUndefined();
    expect(obj.price).toBeUndefined();
    expect(obj.categoryId).toBeUndefined();
  });

  it("includes the image file when provided", () => {
    const file = new File(["bytes"], "photo.png", { type: "image/png" });
    const form = buildProductFormData({
      nameAr: "س", nameEn: "x", descriptionAr: "", descriptionEn: "", price: 1, categoryId: 1,
      calories: 0, pointsReward: 0, image: file,
    });
    const value = form.get("Image");
    expect(value).toBeInstanceOf(File);
    expect((value as File).name).toBe("photo.png");
  });

  it("omits Image when no file is provided", () => {
    const form = buildProductFormData({
      nameAr: "س", nameEn: "x", descriptionAr: "", descriptionEn: "", price: 1, categoryId: 1,
      calories: 0, pointsReward: 0, image: null,
    });
    expect(form.get("Image")).toBeNull();
  });

  it("omits discount fields when null/empty", () => {
    const form = buildProductFormData({
      nameAr: "س", nameEn: "x", descriptionAr: "", descriptionEn: "", price: 1, categoryId: 1,
      calories: 0, pointsReward: 0, image: null,
      discountPercentage: null, discountStart: null, discountEnd: null,
    });
    expect(form.get("DiscountPercentage")).toBeNull();
    expect(form.get("DiscountStart")).toBeNull();
    expect(form.get("DiscountEnd")).toBeNull();
  });

  it("emits discount fields when provided", () => {
    const form = buildProductFormData({
      nameAr: "س", nameEn: "x", descriptionAr: "", descriptionEn: "", price: 1, categoryId: 1,
      calories: 0, pointsReward: 0, image: null,
      discountPercentage: 10,
      discountStart: "2026-04-28T21:00:00Z",
      discountEnd: "2026-04-30T22:30:00Z",
    });
    expect(form.get("DiscountPercentage")).toBe("10");
    expect(form.get("DiscountStart")).toBe("2026-04-28T21:00:00Z");
    expect(form.get("DiscountEnd")).toBe("2026-04-30T22:30:00Z");
  });

  it("omits DiscountPercentage when value is NaN", () => {
    const form = buildProductFormData({
      nameAr: "س", nameEn: "x", descriptionAr: "", descriptionEn: "", price: 1, categoryId: 1,
      calories: 0, pointsReward: 0, image: null,
      discountPercentage: Number.NaN,
    });
    expect(form.get("DiscountPercentage")).toBeNull();
  });
});

describe("formatDiscountTimestamp", () => {
  it("returns null for empty / null / undefined", () => {
    expect(formatDiscountTimestamp("")).toBeNull();
    expect(formatDiscountTimestamp(null)).toBeNull();
    expect(formatDiscountTimestamp(undefined)).toBeNull();
  });

  it("does NOT convert local wall-clock time to UTC", () => {
    // datetime-local emits "YYYY-MM-DDTHH:mm" — the user's wall-clock time.
    // Backend list response uses "2026-04-30T07:35:00" (no Z) — we match that.
    const result = formatDiscountTimestamp("2026-04-28T21:00");
    expect(result).toBe("2026-04-28T21:00:00");
    // Critically: NOT "2026-04-28T18:00:00.000Z" or any timezone-shifted value.
    expect(result).not.toMatch(/Z$/);
    expect(result).not.toMatch(/[+-]\d{2}:\d{2}$/);
  });

  it("preserves seconds when already present", () => {
    expect(formatDiscountTimestamp("2026-04-28T21:00:30")).toBe("2026-04-28T21:00:30");
  });
});

const sampleCategories: Category[] = [
  { id: 12, nameAr: "قهوة تركي", nameEn: "Turkish Coffee", name: "Turkish Coffee", descriptionAr: "", descriptionEn: "" },
  { id: 13, nameAr: "إسبريسو", nameEn: "Espresso", name: "Espresso", descriptionAr: "", descriptionEn: "" },
];

function makeProduct(extra: Partial<AdminProduct> = {}): AdminProduct {
  return {
    id: 1, nameAr: "ب", nameEn: "p", name: "p",
    descriptionAr: "", descriptionEn: "", description: "",
    price: 1, calories: 0, pointsReward: 0,
    imageUrl: "", isAvailable: true, categoryName: "Turkish Coffee",
    sizes: [], modifierGroups: [], discountedPrice: 1,
    ...extra,
  };
}

describe("resolveEditCategoryId", () => {
  it("prefers explicit categoryId when the API returns one", () => {
    const product = makeProduct({ categoryId: 99, categoryName: "Turkish Coffee" } as AdminProduct & { categoryId: number });
    expect(resolveEditCategoryId(product, sampleCategories)).toBe("99");
  });

  it("falls back to a name lookup when categoryId is absent", () => {
    const product = makeProduct({ categoryName: "Espresso" });
    expect(resolveEditCategoryId(product, sampleCategories)).toBe("13");
  });

  it("returns empty string when no match is found", () => {
    const product = makeProduct({ categoryName: "Nonexistent" });
    expect(resolveEditCategoryId(product, sampleCategories)).toBe("");
  });

  it("returns empty string when categories have not loaded yet", () => {
    const product = makeProduct({ categoryName: "Espresso" });
    expect(resolveEditCategoryId(product, [])).toBe("");
  });
});

describe("filterProductsBySearch", () => {
  const list: AdminProduct[] = [
    makeProduct({ id: 27, nameEn: "Mocha", nameAr: "موكا", descriptionEn: "free mocha", categoryName: "Turkish Coffee" }),
    makeProduct({ id: 28, nameEn: "Rich morning toast", descriptionEn: "fresh black coffee", categoryName: "Turkish Coffee" }),
    makeProduct({ id: 40, nameEn: "Espresso", descriptionEn: "double shot", categoryName: "Espresso" }),
  ];

  it("returns the full list when query is empty or whitespace", () => {
    expect(filterProductsBySearch(list, "")).toEqual(list);
    expect(filterProductsBySearch(list, "   ")).toEqual(list);
  });

  it("matches by name (case-insensitive)", () => {
    const result = filterProductsBySearch(list, "MOCHA");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(27);
  });

  it("matches by partial name", () => {
    const result = filterProductsBySearch(list, "toast");
    expect(result.map((p) => p.id)).toEqual([28]);
  });

  it("matches by id substring", () => {
    expect(filterProductsBySearch(list, "40").map((p) => p.id)).toEqual([40]);
  });

  it("matches by category name", () => {
    expect(filterProductsBySearch(list, "espresso").map((p) => p.id).sort()).toEqual([40]);
  });

  it("matches by description", () => {
    expect(filterProductsBySearch(list, "double shot").map((p) => p.id)).toEqual([40]);
  });

  it("matches by the Arabic name", () => {
    expect(filterProductsBySearch(list, "موكا").map((p) => p.id)).toEqual([27]);
  });

  it("returns empty array when no products match", () => {
    expect(filterProductsBySearch(list, "nonexistent-thing")).toEqual([]);
  });
});
