import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createModifierOption,
  updateModifierOption,
  type ModifierOptionDraft,
  type ModifierOptionEditDraft,
} from "@/lib/adminProducts";

beforeEach(() => {
  vi.stubGlobal("localStorage", {
    getItem: () => JSON.stringify({ token: "test-token" }),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  });
});

describe("createModifierOption with isCountable", () => {
  it("sends isCountable: true to the API when creating a countable option", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 99, name: "Sugar", extraPrice: 5, isCountable: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await createModifierOption(10, {
      nameAr: "سكر",
      nameEn: "Sugar",
      extraPrice: 5,
      isCountable: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("admin/modifier-groups/10/options");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body.isCountable).toBe(true);
  });

  it("sends isCountable: false to the API when creating a non-countable option", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 100, name: "Large", extraPrice: 10, isCountable: false }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await createModifierOption(10, {
      nameAr: "كبير",
      nameEn: "Large",
      extraPrice: 10,
      isCountable: false,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.isCountable).toBe(false);
  });
});

describe("updateModifierOption with isCountable", () => {
  it("sends isCountable when updating a modifier option", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    await updateModifierOption(9, 33, {
      nameAr: "جرعة إضافية",
      nameEn: "Extra shot",
      extraPrice: 7,
      isCountable: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("admin/modifier-groups/9/options/33");
    expect(init.method).toBe("PUT");
    const body = JSON.parse(init.body);
    expect(body.isCountable).toBe(true);
  });
});
