import { beforeEach, describe, expect, it } from "vitest";
import { clearToken, extractToken, getAuthHeaders, getStoredToken, storeToken } from "./auth";

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

  it("returns null when no token is present", () => {
    expect(extractToken({ ok: true })).toBeNull();
  });

  it("clears the stored token", () => {
    storeToken("abc123");
    clearToken();
    expect(getStoredToken()).toBeNull();
  });
});
