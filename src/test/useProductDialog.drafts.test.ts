import { describe, test, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
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

describe("useProductDialog with drafts", () => {
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

  test("openCopy creates draft from product and triggers refetch", async () => {
    const saveDraftMock = vi.fn();
    const refetchQueriesMock = vi.fn();

    vi.mocked(productDrafts.saveDraft).mockImplementation(saveDraftMock);
    vi.mocked(productDrafts.createDraftFromProduct).mockReturnValue({
      isDraft: true,
      draftId: "draft_123",
      sourceProductId: 42,
      createdAt: "2024-01-01T00:00:00.000Z",
      nameAr: "بيتزا (نسخة)",
      nameEn: "Pizza (Copy)",
      descriptionAr: "بيتزا لذيذة",
      descriptionEn: "Delicious pizza",
      price: 150,
      categoryId: 3,
      calories: 500,
      pointsReward: 20,
      imageUrl: "/images/pizza.jpg",
      sizes: [
        { nameAr: "كبير", nameEn: "Large", price: "150", isDefault: true },
      ],
      modifierGroups: [],
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.refetchQueries = refetchQueriesMock;

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useProductDialog(mockCategories), { wrapper });

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
        { id: 1, nameAr: "كبير", nameEn: "Large", name: "Large", price: 150, isDefault: true },
      ],
      modifierGroups: [],
    };

    act(() => {
      result.current.openCopy(product);
    });

    expect(productDrafts.createDraftFromProduct).toHaveBeenCalledWith(product);
    expect(saveDraftMock).toHaveBeenCalled();

    await waitFor(() => {
      expect(refetchQueriesMock).toHaveBeenCalledWith({ queryKey: ["admin-products"] });
    });
  });

  test("openEditDraft loads draft and opens dialog in create mode", () => {
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
      categoryId: 1,
      calories: 10,
      pointsReward: 5,
      imageUrl: "/images/coffee.jpg",
      sizes: [
        { nameAr: "صغير", nameEn: "Small", price: "50", isDefault: true },
      ],
      modifierGroups: [
        {
          nameAr: "سكر",
          nameEn: "Sugar",
          isRequired: false,
          maxSelections: "1",
          options: [
            { nameAr: "بدون", nameEn: "None", extraPrice: "0" },
          ],
        },
      ],
    };

    vi.mocked(productDrafts.getDraftById).mockReturnValue(mockDraft);

    const { result } = renderHook(() => useProductDialog(mockCategories), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.openEditDraft("draft_456");
    });

    expect(productDrafts.getDraftById).toHaveBeenCalledWith("draft_456");
    expect(result.current.dialogOpen).toBe(true);
    expect(result.current.editing).toBeNull();
    expect(result.current.wizardStep).toBe(1);
    expect(result.current.form.nameEn).toBe("Coffee (Copy)");
    expect(result.current.form.nameAr).toBe("قهوة (نسخة)");
    expect(result.current.form.price).toBe("50");
    expect(result.current.sizes).toHaveLength(1);
    expect(result.current.sizes[0].nameEn).toBe("Small");
    expect(result.current.modifierGroups).toHaveLength(1);
    expect(result.current.modifierGroups[0].nameEn).toBe("Sugar");
  });

  test("openEditDraft does nothing when draft not found", () => {
    vi.mocked(productDrafts.getDraftById).mockReturnValue(null);

    const { result } = renderHook(() => useProductDialog(mockCategories), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.openEditDraft("nonexistent");
    });

    expect(result.current.dialogOpen).toBe(false);
  });
});
