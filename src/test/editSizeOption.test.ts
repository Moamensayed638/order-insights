import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyDefaultSize,
  createModifierGroup,
  updateModifierGroup,
  updateModifierGroupNames,
  updateModifierOption,
  updateSize,
  deleteModifierGroup,
  validateModifierGroupEdit,
  validateModifierGroupNamesEdit,
  validateModifierOptionEdit,
  validateSizeEdit,
  type SizeEditDraft,
  type ModifierOptionEditDraft,
  type ModifierGroupNamesEditDraft,
} from "@/lib/adminProducts";

afterEach(() => {
  vi.unstubAllGlobals();
});

const validSize: SizeEditDraft = { nameAr: "وسط", nameEn: "Medium", price: "50", isDefault: true };
const validOption: ModifierOptionEditDraft = { nameAr: "سكر", nameEn: "Sugar", extraPrice: "5" };

describe("validateSizeEdit", () => {
  it("returns null for a valid size", () => {
    expect(validateSizeEdit(validSize)).toBeNull();
  });

  it("rejects an empty name in either language", () => {
    expect(validateSizeEdit({ ...validSize, nameEn: "  " })).toBe("English name is required");
    expect(validateSizeEdit({ ...validSize, nameAr: "  " })).toBe("Arabic name is required");
  });

  it("rejects a price of 0", () => {
    expect(validateSizeEdit({ ...validSize, price: "0" })).toBe(
      "Price must be greater than 0",
    );
  });

  it("rejects a negative price", () => {
    expect(validateSizeEdit({ ...validSize, price: "-5" })).toBe(
      "Price must be greater than 0",
    );
  });

  it("rejects a non-numeric price", () => {
    expect(validateSizeEdit({ ...validSize, price: "abc" })).toBe(
      "Price must be greater than 0",
    );
  });
});

describe("validateModifierOptionEdit", () => {
  it("returns null for a valid option", () => {
    expect(validateModifierOptionEdit(validOption)).toBeNull();
  });

  it("returns null when extraPrice is 0", () => {
    expect(validateModifierOptionEdit({ ...validOption, extraPrice: "0" })).toBeNull();
  });

  it("rejects an empty name in either language", () => {
    expect(validateModifierOptionEdit({ ...validOption, nameEn: "  " })).toBe(
      "English name is required",
    );
    expect(validateModifierOptionEdit({ ...validOption, nameAr: "  " })).toBe(
      "Arabic name is required",
    );
  });

  it("rejects a negative extra price", () => {
    expect(validateModifierOptionEdit({ ...validOption, extraPrice: "-1" })).toBe(
      "Extra price must be ≥ 0",
    );
  });

  it("rejects a non-numeric extra price", () => {
    expect(validateModifierOptionEdit({ ...validOption, extraPrice: "abc" })).toBe(
      "Extra price must be ≥ 0",
    );
  });
});

describe("validateModifierGroupEdit", () => {
  const tooLow = "Max selections must be a whole number of at least 1";

  it("returns null for a whole number of at least 1", () => {
    expect(validateModifierGroupEdit({ maxSelections: "1" })).toBeNull();
    expect(validateModifierGroupEdit({ maxSelections: "12" })).toBeNull();
  });

  it("rejects a blank counter", () => {
    expect(validateModifierGroupEdit({ maxSelections: "  " })).toBe(tooLow);
  });

  it("rejects 0 and negative counters", () => {
    expect(validateModifierGroupEdit({ maxSelections: "0" })).toBe(tooLow);
    expect(validateModifierGroupEdit({ maxSelections: "-2" })).toBe(tooLow);
  });

  it("rejects a fractional counter the int column could not take", () => {
    expect(validateModifierGroupEdit({ maxSelections: "1.5" })).toBe(tooLow);
  });

  it("rejects a non-numeric counter", () => {
    expect(validateModifierGroupEdit({ maxSelections: "abc" })).toBe(tooLow);
  });
});

describe("applyDefaultSize", () => {
  it("marks exactly one size as default", () => {
    const sizes = [
      { isDefault: true },
      { isDefault: false },
      { isDefault: false },
    ];
    const result = applyDefaultSize(sizes, 2);
    expect(result.map((s) => s.isDefault)).toEqual([false, false, true]);
  });

  it("does not mutate the input array", () => {
    const sizes = [{ isDefault: true }, { isDefault: false }];
    applyDefaultSize(sizes, 1);
    expect(sizes.map((s) => s.isDefault)).toEqual([true, false]);
  });

  it("preserves other fields on each item", () => {
    const sizes = [
      { name: "S", isDefault: true },
      { name: "L", isDefault: false },
    ];
    expect(applyDefaultSize(sizes, 1)).toEqual([
      { name: "S", isDefault: false },
      { name: "L", isDefault: true },
    ]);
  });
});

describe("updateSize", () => {
  it("PUTs the size payload to the product's sizes/{id} endpoint as JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await updateSize(7, 33, { nameAr: "كبير", nameEn: "Large", price: 60, isDefault: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://biscofa.runasp.net/api/admin/products/7/sizes/33");
    expect(init.method).toBe("PUT");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({
      nameAr: "كبير", nameEn: "Large", price: 60, isDefault: true,
    });
  });

  it("throws the API message when the response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: "Bad size" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      updateSize(7, 33, { nameAr: "س", nameEn: "x", price: 1, isDefault: false }),
    ).rejects.toThrow("Bad size");
  });
});

describe("updateModifierGroup", () => {
  it("PUTs the counter to the product's modifier-groups/{id} endpoint as JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await updateModifierGroup(7, 9, { maxSelections: 3 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://biscofa.runasp.net/api/admin/products/7/modifier-groups/9");
    expect(init.method).toBe("PUT");
    expect(init.headers["Content-Type"]).toBe("application/json");
    // Names and the required flag are omitted so the API leaves them alone.
    expect(JSON.parse(init.body)).toEqual({ maxSelections: 3 });
  });

  it("throws the API message when the response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: "Modifier group not found" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(updateModifierGroup(7, 9, { maxSelections: 3 })).rejects.toThrow(
      "Modifier group not found",
    );
  });
});

describe("updateModifierOption", () => {
  it("PUTs the option payload to the group's options/{id} endpoint as JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await updateModifierOption(9, 33, { nameAr: "جرعة إضافية", nameEn: "Extra shot", extraPrice: 7 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://biscofa.runasp.net/api/admin/modifier-groups/9/options/33");
    expect(init.method).toBe("PUT");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({
      nameAr: "جرعة إضافية", nameEn: "Extra shot", extraPrice: 7,
    });
  });

  it("throws the API message when the response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: "Bad option" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      updateModifierOption(9, 33, { nameAr: "س", nameEn: "x", extraPrice: 0 }),
    ).rejects.toThrow("Bad option");
  });
});

describe("validateModifierGroupNamesEdit", () => {
  const validGroupNames: ModifierGroupNamesEditDraft = {
    nameAr: "إضافات",
    nameEn: "Extras",
    isRequired: false,
  };

  it("returns null for valid group names", () => {
    expect(validateModifierGroupNamesEdit(validGroupNames)).toBeNull();
  });

  it("rejects empty English name", () => {
    expect(validateModifierGroupNamesEdit({ ...validGroupNames, nameEn: "  " })).toBe(
      "English name is required",
    );
  });

  it("rejects empty Arabic name", () => {
    expect(validateModifierGroupNamesEdit({ ...validGroupNames, nameAr: "  " })).toBe(
      "Arabic name is required",
    );
  });
});

describe("updateModifierGroupNames", () => {
  it("PUTs group names and isRequired to the product's modifier-groups/{id} endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await updateModifierGroupNames(7, 9, {
      nameAr: "سكريات",
      nameEn: "Sweeteners",
      isRequired: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://biscofa.runasp.net/api/admin/products/7/modifier-groups/9");
    expect(init.method).toBe("PUT");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({
      nameAr: "سكريات",
      nameEn: "Sweeteners",
      isRequired: true,
    });
  });

  it("throws the API message when the response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: "Group not found" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      updateModifierGroupNames(7, 9, { nameAr: "س", nameEn: "S", isRequired: false }),
    ).rejects.toThrow("Group not found");
  });
});

describe("deleteModifierGroup", () => {
  it("DELETEs the modifier group from the product's modifier-groups/{id} endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await deleteModifierGroup(7, 9);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://biscofa.runasp.net/api/admin/products/7/modifier-groups/9");
    expect(init.method).toBe("DELETE");
  });

  it("throws the API message when the response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: "Modifier group not found" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteModifierGroup(7, 9)).rejects.toThrow("Modifier group not found");
  });
});

describe("createModifierGroup", () => {
  it("POSTs a new modifier group to the product's modifier-groups endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 15 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createModifierGroup(7, {
      nameAr: "إضافات",
      nameEn: "Extras",
      isRequired: true,
      maxSelections: 2,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://biscofa.runasp.net/api/admin/products/7/modifier-groups");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({
      nameAr: "إضافات",
      nameEn: "Extras",
      isRequired: true,
      maxSelections: 2,
    });
    expect(result.id).toBe(15);
  });

  it("throws the API message when the response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: "Invalid group data" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createModifierGroup(7, { nameAr: "س", nameEn: "E", isRequired: false, maxSelections: 1 }),
    ).rejects.toThrow("Invalid group data");
  });
});
