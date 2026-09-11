import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithAuth, refreshAccessToken } from "@/lib/authFetch";
import * as auth from "@/lib/auth";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("refreshAccessToken", () => {
  it("calls the refresh endpoint with the stored refresh token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: "new-access-token", refreshToken: "new-refresh-token" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(auth, "getStoredRefreshToken").mockReturnValue("stored-refresh-token");

    await refreshAccessToken();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("Auth/refresh"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: "stored-refresh-token" }),
      }),
    );
  });

  it("stores the new access token and refresh token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: "new-access-token", refreshToken: "new-refresh-token" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(auth, "getStoredRefreshToken").mockReturnValue("old-refresh-token");
    const storeTokenSpy = vi.spyOn(auth, "storeToken");
    const storeRefreshTokenSpy = vi.spyOn(auth, "storeRefreshToken");

    await refreshAccessToken();

    expect(storeTokenSpy).toHaveBeenCalledWith("new-access-token");
    expect(storeRefreshTokenSpy).toHaveBeenCalledWith("new-refresh-token");
  });

  it("throws an error when refresh token is missing", async () => {
    vi.spyOn(auth, "getStoredRefreshToken").mockReturnValue(null);

    await expect(refreshAccessToken()).rejects.toThrow("No refresh token available");
  });

  it("throws an error when the refresh endpoint returns not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Invalid refresh token" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(auth, "getStoredRefreshToken").mockReturnValue("expired-refresh-token");

    await expect(refreshAccessToken()).rejects.toThrow("Invalid refresh token");
  });
});

describe("fetchWithAuth", () => {
  it("makes a successful request with the stored token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: "success" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(auth, "getStoredToken").mockReturnValue("valid-token");

    const response = await fetchWithAuth("https://api.example.com/data");

    expect(response.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/data",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer valid-token" }),
      }),
    );
  });

  it("refreshes token and retries when receiving 401", async () => {
    vi.spyOn(auth, "getStoredToken")
      .mockReturnValueOnce("expired-token")
      .mockReturnValueOnce("expired-token") // For refresh call check
      .mockReturnValueOnce("new-token"); // For retry
    vi.spyOn(auth, "getStoredRefreshToken").mockReturnValue("refresh-token");
    const storeTokenSpy = vi.spyOn(auth, "storeToken");
    const storeRefreshTokenSpy = vi.spyOn(auth, "storeRefreshToken");

    const fetchMock = vi.fn()
      // First call: 401 unauthorized
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Unauthorized" }),
      })
      // Second call: refresh endpoint success
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "new-token", refreshToken: "new-refresh-token" }),
      })
      // Third call: retry with new token succeeds
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: "success after refresh" }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const response = await fetchWithAuth("https://api.example.com/data");

    expect(response.ok).toBe(true);
    expect(storeTokenSpy).toHaveBeenCalledWith("new-token");
    expect(storeRefreshTokenSpy).toHaveBeenCalledWith("new-refresh-token");
    expect(fetchMock).toHaveBeenCalledTimes(3); // original + refresh + retry
  });

  it("clears tokens and throws when refresh fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Unauthorized" }),
      });
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(auth, "getStoredToken").mockReturnValue("expired-token");
    vi.spyOn(auth, "getStoredRefreshToken").mockReturnValue("invalid-refresh-token");
    const clearTokenSpy = vi.spyOn(auth, "clearToken");

    // Mock refresh endpoint failure
    fetchMock.mockImplementationOnce(async (url) => {
      if (url.includes("Auth/refresh")) {
        return {
          ok: false,
          status: 401,
          json: async () => ({ message: "Refresh token expired" }),
        };
      }
      return { ok: false, status: 401 };
    });

    await expect(fetchWithAuth("https://api.example.com/data")).rejects.toThrow("Refresh token expired");
    expect(clearTokenSpy).toHaveBeenCalled();
  });

  it("does not retry on non-401 errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: "Server error" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(auth, "getStoredToken").mockReturnValue("valid-token");

    const response = await fetchWithAuth("https://api.example.com/data");

    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
    expect(fetchMock).toHaveBeenCalledTimes(1); // No retry
  });
});
