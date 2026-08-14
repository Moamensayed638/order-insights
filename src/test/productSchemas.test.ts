import { describe, expect, it } from "vitest";
import {
  adminProductSchema,
  adminProductsResponseSchema,
  categoriesResponseSchema,
  topSellingResponseSchema,
} from "@/lib/productSchemas";

// Shapes below mirror what the bilingual admin API actually returns: every
// user-facing string is an Ar/En pair, and pre-migration rows can have nulls.
const realListSample = [
  {
    id: 27,
    nameAr: "موكا",
    nameEn: "mocha",
    descriptionAr: "موكا مجانية",
    descriptionEn: "free mocha",
    price: 250.0,
    calories: 12,
    pointsReward: 12,
    imageUrl: "https://biscofa.runasp.net/images/products/x.jpg",
    isAvailable: true,
    categoryName: "Turkish Coffee",
    sizes: [{ id: 29, nameAr: "وسط", nameEn: "medium", price: 250.0, isDefault: true }],
    modifierGroups: [],
    discountedPrice: 250.0,
    discountPercentage: 20.0,
    discountStart: "2026-04-30T07:35:00",
    discountEnd: "2026-05-05T07:35:00",
  },
  {
    id: 28,
    nameAr: "توست الصباح",
    nameEn: "rich morning toast",
    descriptionAr: "وصف",
    descriptionEn: "desc",
    price: 200.0,
    calories: 12,
    pointsReward: 10,
    imageUrl: "https://biscofa.runasp.net/images/products/y.jpg",
    isAvailable: true,
    categoryName: "Turkish Coffee",
    sizes: [{ id: 32, nameAr: "وسط", nameEn: "medium", price: 200.0, isDefault: true }],
    modifierGroups: [
      {
        id: 20,
        nameAr: "لبن",
        nameEn: "milk",
        isRequired: false,
        maxSelections: 1,
        options: [{ id: 22, nameAr: "لبن", nameEn: "milk", extraPrice: 10.0 }],
      },
    ],
    discountedPrice: 200.0,
    discountPercentage: null,
    discountStart: null,
    discountEnd: null,
  },
];

describe("adminProductSchema", () => {
  it("parses a real product list response", () => {
    const result = adminProductsResponseSchema.safeParse(realListSample);
    expect(result.success).toBe(true);
  });

  it("exposes a display name/description derived from English", () => {
    const parsed = adminProductSchema.parse(realListSample[0]);
    expect(parsed.name).toBe("mocha");
    expect(parsed.description).toBe("free mocha");
    expect(parsed.sizes[0].name).toBe("medium");
  });

  it("falls back to Arabic when the English side is missing", () => {
    const parsed = adminProductSchema.parse({
      ...realListSample[0],
      nameEn: null,
      descriptionEn: "",
    });
    expect(parsed.name).toBe("موكا");
    expect(parsed.description).toBe("موكا مجانية");
    // Both languages stay available for editing.
    expect(parsed.nameEn).toBe("");
    expect(parsed.nameAr).toBe("موكا");
  });

  it("tolerates nulls in the optional/nullable fields", () => {
    const parsed = adminProductSchema.parse({
      id: 40,
      nameAr: "قهوة تركي",
      nameEn: "Turkish coffee",
      descriptionAr: null,
      descriptionEn: null,
      price: 38,
      calories: null,
      pointsReward: null,
      imageUrl: null,
      isAvailable: true,
      categoryName: null,
      sizes: null,
      modifierGroups: null,
      discountedPrice: 38,
      discountPercentage: null,
    });
    expect(parsed.imageUrl).toBe("");
    expect(parsed.calories).toBe(0);
    expect(parsed.sizes).toEqual([]);
    expect(parsed.modifierGroups).toEqual([]);
    expect(parsed.discountPercentage).toBeUndefined();
  });

  it("rejects a product without an id", () => {
    expect(adminProductSchema.safeParse({ nameEn: "x" }).success).toBe(false);
  });

  it("rejects a product with wrong field types", () => {
    const bad = { ...realListSample[0], price: "expensive" };
    expect(adminProductSchema.safeParse(bad).success).toBe(false);
  });
});

describe("topSellingResponseSchema", () => {
  it("parses a real top-selling response with relative imageUrl", () => {
    const sample = [
      {
        id: 1091,
        name: "Red bull Espresso",
        price: 100,
        imageUrl: "/images/products/x.png",
        totalSold: 5,
      },
    ];
    expect(topSellingResponseSchema.safeParse(sample).success).toBe(true);
  });

  it("tolerates a null imageUrl", () => {
    const sample = [{ id: 1, name: "x", price: 1, imageUrl: null, totalSold: 2 }];
    const parsed = topSellingResponseSchema.parse(sample);
    expect(parsed[0].imageUrl).toBe("");
  });

  it("rejects entries missing an id", () => {
    const sample = [{ name: "x", price: 1, imageUrl: "/a.png", totalSold: 1 }];
    expect(topSellingResponseSchema.safeParse(sample).success).toBe(false);
  });
});

describe("categoriesResponseSchema", () => {
  it("parses a real categories response", () => {
    const sample = [
      {
        id: 12,
        nameAr: "قهوة تركي",
        nameEn: "Turkish Coffee",
        descriptionAr: "مشروبات",
        descriptionEn: "Coffee Drinks",
      },
      {
        id: 13,
        nameAr: "إسبريسو",
        nameEn: "Espresso",
        descriptionAr: null,
        descriptionEn: null,
      },
    ];
    const parsed = categoriesResponseSchema.parse(sample);
    expect(parsed.map((c) => c.name)).toEqual(["Turkish Coffee", "Espresso"]);
    expect(parsed[1].descriptionEn).toBe("");
  });
});
