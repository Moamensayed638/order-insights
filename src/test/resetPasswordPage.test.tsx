import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ResetPassword from "@/pages/ResetPassword";
import { getStoredToken, getStoredRefreshToken, storeToken, storeRefreshToken } from "@/lib/auth";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

function renderResetPassword() {
  return render(
    <MemoryRouter initialEntries={["/reset-password?email=admin@example.com&token=tok123"]}>
      <ResetPassword />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  navigateMock.mockClear();
  vi.useRealTimers();
});

describe("ResetPassword page", () => {
  it("clears any stale session token on a successful reset", async () => {
    storeToken("stale-admin-jwt");
    storeRefreshToken("stale-refresh");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: "ok" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderResetPassword();

    fireEvent.change(screen.getByPlaceholderText("Minimum 8 characters"), {
      target: { value: "NewPass!1" },
    });
    fireEvent.change(screen.getByPlaceholderText("Re-enter your new password"), {
      target: { value: "NewPass!1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(getStoredToken()).toBeNull();
    expect(getStoredRefreshToken()).toBeNull();
  });
});
