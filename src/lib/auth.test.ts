import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearToken,
  extractRefreshToken,
  extractToken,
  getAuthHeaders,
  getStoredRefreshToken,
  getStoredToken,
  logout,
  storeRefreshToken,
  storeToken,
} from "./auth";

beforeEach(() => {
  window.localStorage.clear();
});

describe("auth helpers", () => {
  it("stores and reads the admin token", () => {
    storeToken("abc123");
    expect(getStoredToken()).toBe("abc123");
  });

  it("builds bearer auth headers when a token exists", () => {
    storeToken("abc123");
    expect(getAuthHeaders()).toEqual({ Authorization: "Bearer abc123" });
  });

  it("extracts a token from common login responses", () => {
    expect(extractToken({ token: "a" })).toBe("a");
    expect(extractToken({ accessToken: "b" })).toBe("b");
    expect(extractToken({ jwtToken: "c" })).toBe("c");
  });

  it("extracts the refresh token from login responses", () => {
    expect(extractRefreshToken({ refreshToken: "refresh-123" })).toBe("refresh-123");
    expect(extractRefreshToken({ refresh_token: "refresh-234" })).toBe("refresh-234");
    expect(extractRefreshToken({ refresh: "refresh-345" })).toBe("refresh-345");
  });

  it("returns null when no token is present", () => {
    expect(extractToken({ ok: true })).toBeNull();
  });

  it("stores and reads the refresh token", () => {
    storeRefreshToken("refresh-123");
    expect(getStoredRefreshToken()).toBe("refresh-123");
  });

  it("posts the refresh token to the logout endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Logged out successfully" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(logout("refresh-123")).resolves.toEqual({ message: "Logged out successfully" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://biscofa.runasp.net/api/Auth/logout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: "refresh-123" }),
      },
    );
  });

  it("clears the stored token", () => {
    storeToken("abc123");
    storeRefreshToken("refresh-123");
    clearToken();
    expect(getStoredToken()).toBeNull();
    expect(getStoredRefreshToken()).toBeNull();
  });
});
