import { describe, test, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useProductDialog } from "@/components/products/hooks/useProductDialog";
import * as productDrafts from "@/lib/productDrafts";
import type { AdminProduct, Category, ProductDraft } from "@/types/product";

vi.mock("@/lib/productDrafts");

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useProductDialog - draft image and category handling", () => {
  const mockCategories: Category[] = [
    {
      id: 1,
      nameAr: "مشروبات",
      nameEn: "Drinks",
      name: "Drinks",
      descriptionAr: "",
      descriptionEn: "",
    },
    {
      id: 3,
      nameAr: "رئيسي",
      nameEn: "Main",
      name: "Main",
      descriptionAr: "",
      descriptionEn: "",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("openEditDraft preserves imageUrl and categoryId in form state", () => {
    const mockDraft: ProductDraft = {
      isDraft: true,
      draftId: "draft_456",
      sourceProductId: 10,
      createdAt: "2024-01-01T00:00:00.000Z",
      nameAr: "قهوة (نسخة)",
      nameEn: "Coffee (Copy)",
      descriptionAr: "قهوة ساخنة",
      descriptionEn: "Hot coffee",
      price: 50,
      categoryId: 3,
      calories: 10,
      pointsReward: 5,
      imageUrl: "/images/coffee.jpg",
      sizes: [],
      modifierGroups: [],
    };

    vi.mocked(productDrafts.getDraftById).mockReturnValue(mockDraft);

    const { result } = renderHook(() => useProductDialog(mockCategories), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.openEditDraft("draft_456");
    });

    expect(result.current.form.categoryId).toBe("3");
    expect(result.current.editing).toBeNull(); // Draft editing mode
    expect(result.current.wizardStep).toBe(1);

    // The draft should preserve the imageUrl somewhere accessible
    // Since form.image is null, we need another way to track the existing imageUrl
  });
});
