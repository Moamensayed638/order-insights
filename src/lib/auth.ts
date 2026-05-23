const TOKEN_KEY = "admin_token";
const REFRESH_TOKEN_KEY = "admin_refresh_token";
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "https://biscofa.runasp.net/api/";

export function apiUrl(path: string) {
  const base = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredRefreshToken() {
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function storeToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function storeRefreshToken(token: string) {
  window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getAuthHeaders() {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function extractToken(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const token = record.token ?? record.accessToken ?? record.jwtToken ?? record.jwt;
  return typeof token === "string" && token.trim() ? token : null;
}

export function extractRefreshToken(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const token =
    record.refreshToken ??
    record.refresh_token ??
    record.refresh ??
    record.refreshJwt;
  return typeof token === "string" && token.trim() ? token : null;
}

export async function logout(refreshToken: string) {
  const response = await fetch(apiUrl("Auth/logout"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : "Logout failed";
    throw new Error(message);
  }

  return payload;
}
