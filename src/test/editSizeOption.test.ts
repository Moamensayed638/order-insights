import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyDefaultSize,
  updateModifierOption,
  updateSize,
  validateModifierOptionEdit,
  validateSizeEdit,
  type SizeEditDraft,
  type ModifierOptionEditDraft,
} from "@/lib/adminProducts";

afterEach(() => {
  vi.unstubAllGlobals();
});

const validSize: SizeEditDraft = { name: "Medium", price: "50", isDefault: true };
const validOption: ModifierOptionEditDraft = { name: "Sugar", extraPrice: "5" };

describe("validateSizeEdit", () => {
  it("returns null for a valid size", () => {
    expect(validateSizeEdit(validSize)).toBeNull();
  });

  it("rejects an empty name", () => {
    expect(validateSizeEdit({ ...validSize, name: "  " })).toBe("Name is required");
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

  it("rejects an empty name", () => {
    expect(validateModifierOptionEdit({ ...validOption, name: "  " })).toBe(
      "Name is required",
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
  it("PUTs the size payload to the sizes/{id} endpoint as JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await updateSize(33, { name: "Large", price: 60, isDefault: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://biscofa.runasp.net/api/admin/products/sizes/33");
    expect(init.method).toBe("PUT");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({ name: "Large", price: 60, isDefault: true });
  });

  it("throws the API message when the response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: "Bad size" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      updateSize(33, { name: "x", price: 1, isDefault: false }),
    ).rejects.toThrow("Bad size");
  });
});

describe("updateModifierOption", () => {
  it("PUTs the option payload to the modifier-options/{id} endpoint as JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await updateModifierOption(33, { name: "Extra shot", extraPrice: 7 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://biscofa.runasp.net/api/admin/products/modifier-options/33");
    expect(init.method).toBe("PUT");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({ name: "Extra shot", extraPrice: 7 });
  });

  it("throws the API message when the response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: "Bad option" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      updateModifierOption(33, { name: "x", extraPrice: 0 }),
    ).rejects.toThrow("Bad option");
  });
});
