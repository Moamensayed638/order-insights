import { describe, expect, it } from "vitest";
import {
  validateSizes,
  validateModifierGroups,
  type SizeDraft,
  type ModifierGroupDraft,
} from "@/lib/adminProducts";

const validSize: SizeDraft = { nameAr: "وسط", nameEn: "Medium", price: "50", isDefault: true };
const validOption = { nameAr: "سكر", nameEn: "Sugar", extraPrice: "5" };
const validGroup: ModifierGroupDraft = {
  nameAr: "إضافات",
  nameEn: "Extras",
  isRequired: false,
  maxSelections: "1",
  options: [validOption],
};

describe("validateSizes", () => {
  it("returns null for a single valid size", () => {
    expect(validateSizes([validSize])).toBeNull();
  });

  it("returns null for multiple valid sizes with one default", () => {
    const sizes: SizeDraft[] = [
      { nameAr: "صغير", nameEn: "Small", price: "40", isDefault: false },
      { nameAr: "كبير", nameEn: "Large", price: "60", isDefault: true },
    ];
    expect(validateSizes(sizes)).toBeNull();
  });

  it("requires at least one size", () => {
    expect(validateSizes([])).toBe("Add at least one size");
  });

  it("rejects a size with an empty name in either language", () => {
    expect(validateSizes([{ ...validSize, nameEn: "  " }])).toBe(
      "Size #1: English name is required",
    );
    expect(validateSizes([{ ...validSize, nameAr: "  " }])).toBe(
      "Size #1: Arabic name is required",
    );
  });

  it("rejects a size with price of 0", () => {
    expect(validateSizes([{ ...validSize, price: "0" }])).toBe(
      "Size #1: price must be greater than 0",
    );
  });

  it("rejects a size with a negative price", () => {
    expect(validateSizes([{ ...validSize, price: "-10" }])).toBe(
      "Size #1: price must be greater than 0",
    );
  });

  it("rejects a size with a non-numeric price", () => {
    expect(validateSizes([{ ...validSize, price: "abc" }])).toBe(
      "Size #1: price must be greater than 0",
    );
  });

  it("requires exactly one default size", () => {
    const sizes: SizeDraft[] = [
      { nameAr: "صغير", nameEn: "Small", price: "40", isDefault: false },
      { nameAr: "كبير", nameEn: "Large", price: "60", isDefault: false },
    ];
    expect(validateSizes(sizes)).toBe("Mark exactly one size as default");
  });

  it("rejects multiple default sizes", () => {
    const sizes: SizeDraft[] = [
      { nameAr: "صغير", nameEn: "Small", price: "40", isDefault: true },
      { nameAr: "كبير", nameEn: "Large", price: "60", isDefault: true },
    ];
    expect(validateSizes(sizes)).toBe("Mark exactly one size as default");
  });
});

describe("validateModifierGroups", () => {
  it("returns null for a single valid group with one option", () => {
    expect(validateModifierGroups([validGroup])).toBeNull();
  });

  it("requires at least one group", () => {
    expect(validateModifierGroups([])).toBe("Add at least one modifier group");
  });

  it("rejects a group with an empty name in either language", () => {
    expect(
      validateModifierGroups([{ ...validGroup, nameEn: "  " }]),
    ).toBe("Group #1: English name is required");
    expect(
      validateModifierGroups([{ ...validGroup, nameAr: "  " }]),
    ).toBe("Group #1: Arabic name is required");
  });

  it("rejects a group with maxSelections of 0", () => {
    expect(
      validateModifierGroups([{ ...validGroup, maxSelections: "0" }]),
    ).toBe("Group #1: max selections must be at least 1");
  });

  it("rejects a group with a non-numeric maxSelections", () => {
    expect(
      validateModifierGroups([{ ...validGroup, maxSelections: "abc" }]),
    ).toBe("Group #1: max selections must be at least 1");
  });

  it("requires at least one option per group", () => {
    expect(
      validateModifierGroups([{ ...validGroup, options: [] }]),
    ).toBe("Group #1: add at least one option");
  });

  it("rejects an option with an empty name in either language", () => {
    expect(
      validateModifierGroups([
        { ...validGroup, options: [{ ...validOption, nameEn: "  " }] },
      ]),
    ).toBe("Group #1, option #1: English name is required");
    expect(
      validateModifierGroups([
        { ...validGroup, options: [{ ...validOption, nameAr: "  " }] },
      ]),
    ).toBe("Group #1, option #1: Arabic name is required");
  });

  it("rejects an option with a negative extraPrice", () => {
    expect(
      validateModifierGroups([
        { ...validGroup, options: [{ ...validOption, extraPrice: "-1" }] },
      ]),
    ).toBe("Group #1, option #1: extra price must be ≥ 0");
  });

  it("allows an option with extraPrice of 0", () => {
    expect(
      validateModifierGroups([
        { ...validGroup, options: [{ ...validOption, extraPrice: "0" }] },
      ]),
    ).toBeNull();
  });
});
