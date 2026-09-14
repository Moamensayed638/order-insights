import { describe, test, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useProductsData } from "@/components/products/hooks/useProductsData";
import * as adminProducts from "@/lib/adminProducts";
import * as productDrafts from "@/lib/productDrafts";
import type { AdminProduct, ProductDraft } from "@/types/product";

vi.mock("@/lib/adminProducts");
vi.mock("@/lib/productDrafts");

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useProductsData with drafts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("merges drafts with products from API", async () => {
    const mockProducts: AdminProduct[] = [
      {
        id: 1,
        nameAr: "منتج 1",
        nameEn: "Product 1",
        name: "Product 1",
        descriptionAr: "وصف",
        descriptionEn: "Description",
        description: "Description",
        price: 100,
        calories: 200,
        pointsReward: 10,
        imageUrl: "/images/1.jpg",
        isAvailable: true,
        categoryName: "Category",
        categoryId: 1,
        discountedPrice: 100,
        sizes: [],
        modifierGroups: [],
      },
    ];

    const mockDrafts: ProductDraft[] = [
      {
        isDraft: true,
        draftId: "draft_123",
        sourceProductId: 1,
        createdAt: "2024-01-01T00:00:00.000Z",
        nameAr: "منتج مسودة",
        nameEn: "Draft Product",
        descriptionAr: "وصف",
        descriptionEn: "Description",
        price: 150,
        categoryId: 1,
        calories: 300,
        pointsReward: 15,
        imageUrl: "/images/draft.jpg",
        sizes: [],
        modifierGroups: [],
      },
    ];

    vi.mocked(adminProducts.fetchProducts).mockResolvedValue(mockProducts);
    vi.mocked(adminProducts.fetchCategories).mockResolvedValue([]);
    vi.mocked(adminProducts.fetchTopSelling).mockResolvedValue([]);
    vi.mocked(productDrafts.getAllDrafts).mockReturnValue(mockDrafts);

    const { result } = renderHook(() => useProductsData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.productsQuery.isSuccess).toBe(true);
    });

    const allProducts = result.current.allProductsWithDrafts;
    expect(allProducts).toHaveLength(2);

    const draftItem = allProducts.find((p) => "isDraft" in p && p.isDraft);
    expect(draftItem).toBeTruthy();
    if (draftItem && "isDraft" in draftItem) {
      expect(draftItem.nameEn).toBe("Draft Product");
    }
  });

  test("returns empty drafts when localStorage is empty", async () => {
    const mockProducts: AdminProduct[] = [
      {
        id: 1,
        nameAr: "منتج 1",
        nameEn: "Product 1",
        name: "Product 1",
        descriptionAr: "وصف",
        descriptionEn: "Description",
        description: "Description",
        price: 100,
        calories: 200,
        pointsReward: 10,
        imageUrl: "/images/1.jpg",
        isAvailable: true,
        categoryName: "Category",
        categoryId: 1,
        discountedPrice: 100,
        sizes: [],
        modifierGroups: [],
      },
    ];

    vi.mocked(adminProducts.fetchProducts).mockResolvedValue(mockProducts);
    vi.mocked(adminProducts.fetchCategories).mockResolvedValue([]);
    vi.mocked(adminProducts.fetchTopSelling).mockResolvedValue([]);
    vi.mocked(productDrafts.getAllDrafts).mockReturnValue([]);

    const { result } = renderHook(() => useProductsData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.productsQuery.isSuccess).toBe(true);
    });

    const allProducts = result.current.allProductsWithDrafts;
    expect(allProducts).toHaveLength(1);
    expect(allProducts[0]).toEqual(mockProducts[0]);
  });
});
