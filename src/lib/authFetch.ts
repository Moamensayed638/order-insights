import { apiUrl, clearToken, getStoredRefreshToken, getStoredToken, storeRefreshToken, storeToken } from "./auth";

export async function refreshAccessToken(): Promise<void> {
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await fetch(apiUrl("Auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : "Token refresh failed";
    throw new Error(message);
  }

  const newAccessToken = payload?.token ?? payload?.accessToken;
  const newRefreshToken = payload?.refreshToken ?? payload?.refresh_token;

  if (newAccessToken) {
    storeToken(newAccessToken);
  }
  if (newRefreshToken) {
    storeRefreshToken(newRefreshToken);
  }
}

export async function fetchWithAuth(url: string, options?: RequestInit): Promise<Response> {
  const token = getStoredToken();
  const headers = {
    ...options?.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, { ...options, headers });

  // If 401, try to refresh token and retry once
  if (response.status === 401) {
    try {
      await refreshAccessToken();

      // Retry with new token
      const newToken = getStoredToken();
      const retryHeaders = {
        ...options?.headers,
        ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
      };

      return await fetch(url, { ...options, headers: retryHeaders });
    } catch (error) {
      // Refresh failed, clear tokens
      clearToken();
      throw error;
    }
  }

  return response;
}
