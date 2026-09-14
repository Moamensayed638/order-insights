import { describe, test, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useProductDialog } from "@/components/products/hooks/useProductDialog";
import * as productDrafts from "@/lib/productDrafts";
import * as adminProducts from "@/lib/adminProducts";
import type { Category, ProductDraft } from "@/types/product";

vi.mock("@/lib/productDrafts");
vi.mock("@/lib/adminProducts");

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useProductDialog - draft submission", () => {
  const mockCategories: Category[] = [
    {
      id: 1,
      nameAr: "مشروبات",
      nameEn: "Drinks",
      name: "Drinks",
      descriptionAr: "",
      descriptionEn: "",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("submitting draft deletes it from localStorage after successful API call", async () => {
    const mockDraft: ProductDraft = {
      isDraft: true,
      draftId: "draft_789",
      sourceProductId: 20,
      createdAt: "2024-01-01T00:00:00.000Z",
      nameAr: "قهوة (نسخة)",
      nameEn: "Coffee (Copy)",
      descriptionAr: "قهوة ساخنة",
      descriptionEn: "Hot coffee",
      price: 50,
      categoryId: 1,
      calories: 10,
      pointsReward: 5,
      imageUrl: "/images/coffee.jpg",
      sizes: [
        { nameAr: "صغير", nameEn: "Small", price: "50", isDefault: true },
      ],
      modifierGroups: [],
    };

    const mockCreatedProduct = {
      id: 100,
      nameAr: "قهوة (نسخة)",
      nameEn: "Coffee (Copy)",
      name: "Coffee (Copy)",
      descriptionAr: "قهوة ساخنة",
      descriptionEn: "Hot coffee",
      description: "Hot coffee",
      price: 50,
      calories: 10,
      pointsReward: 5,
      imageUrl: "/images/coffee.jpg",
      isAvailable: true,
      categoryName: "Drinks",
      categoryId: 1,
      discountedPrice: 50,
      sizes: [],
      modifierGroups: [],
    };

    vi.mocked(productDrafts.getDraftById).mockReturnValue(mockDraft);
    vi.mocked(adminProducts.createProduct).mockResolvedValue(mockCreatedProduct);
    vi.mocked(adminProducts.createSize).mockResolvedValue(undefined);
    vi.mocked(adminProducts.createModifierGroup).mockResolvedValue({ id: 1 });
    const deleteDraftMock = vi.fn();
    vi.mocked(productDrafts.deleteDraft).mockImplementation(deleteDraftMock);

    const { result } = renderHook(() => useProductDialog(mockCategories), {
      wrapper: createWrapper(),
    });

    // Open draft for editing
    act(() => {
      result.current.openEditDraft("draft_789");
    });

    // Move through wizard steps
    act(() => {
      result.current.setWizardStep(2);
    });

    act(() => {
      result.current.setWizardStep(3);
    });

    // Submit the form
    await act(async () => {
      const form = document.createElement("form");
      const event = new Event("submit", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "preventDefault", { value: vi.fn() });
      await result.current.handleSubmit(event as any);
    });

    await waitFor(() => {
      expect(result.current.saveMutation.isSuccess).toBe(true);
    });

    expect(adminProducts.createProduct).toHaveBeenCalled();
    expect(deleteDraftMock).toHaveBeenCalledWith("draft_789");
  });
});
