import { describe, expect, it } from "vitest";
import {
  adminProductSchema,
  adminProductsResponseSchema,
  categoriesResponseSchema,
  topSellingResponseSchema,
} from "@/lib/productSchemas";

const realListSample = [
  {
    id: 27,
    name: "mocha",
    description: "free mocha",
    price: 250.0,
    calories: 12,
    pointsReward: 12,
    imageUrl: "https://biscofa.runasp.net/images/products/x.jpg",
    isAvailable: true,
    categoryName: "Turkish Coffee",
    sizes: [{ id: 29, name: "medium", price: 250.0, isDefault: true }],
    modifierGroups: [],
    discountedPrice: 250.0,
    discountPercentage: 20.0,
    discountStart: "2026-04-30T07:35:00",
    discountEnd: "2026-05-05T07:35:00",
  },
  {
    id: 28,
    name: "rich morning toast",
    description: "desc",
    price: 200.0,
    calories: 12,
    pointsReward: 10,
    imageUrl: "https://biscofa.runasp.net/images/products/y.jpg",
    isAvailable: true,
    categoryName: "Turkish Coffee",
    sizes: [{ id: 32, name: "medium", price: 200.0, isDefault: true }],
    modifierGroups: [
      {
        id: 20,
        name: "milk",
        isRequired: false,
        maxSelections: 1,
        options: [{ id: 22, name: "milk", extraPrice: 10.0 }],
      },
    ],
    discountedPrice: 200.0,
  },
];

describe("adminProductSchema", () => {
  it("parses a real product list response", () => {
    const result = adminProductsResponseSchema.safeParse(realListSample);
    expect(result.success).toBe(true);
  });

  it("parses a product with nested modifier groups", () => {
    const single = {
      id: 40,
      name: "Turkish coffee",
      description: "Plain",
      price: 38,
      calories: 10,
      pointsReward: 1,
      imageUrl: "https://x/y.jpg",
      isAvailable: true,
      categoryName: "Turkish Coffee",
      sizes: [
        { id: 71, name: "single", price: 38, isDefault: true },
        { id: 72, name: "double", price: 55, isDefault: false },
      ],
      modifierGroups: [
        {
          id: 32,
          name: "",
          isRequired: true,
          maxSelections: 1,
          options: [],
        },
      ],
      discountedPrice: 38,
      discountPercentage: 0,
    };
    expect(adminProductSchema.safeParse(single).success).toBe(true);
  });

  it("rejects a product missing required fields", () => {
    const bad = { id: 1, name: "x" };
    expect(adminProductSchema.safeParse(bad).success).toBe(false);
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

  it("rejects entries missing totalSold", () => {
    const sample = [{ id: 1, name: "x", price: 1, imageUrl: "/a.png" }];
    expect(topSellingResponseSchema.safeParse(sample).success).toBe(false);
  });
});

describe("categoriesResponseSchema", () => {
  it("parses a real categories response", () => {
    const sample = [
      { id: 12, name: "Turkish Coffee", description: "Coffee Drinks" },
      { id: 13, name: "Espresso", description: "coffee" },
    ];
    expect(categoriesResponseSchema.safeParse(sample).success).toBe(true);
  });
});
