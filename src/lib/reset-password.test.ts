import { describe, expect, it } from "vitest";
import { buildResetPasswordBody } from "./reset-password";

describe("buildResetPasswordBody", () => {
  it("keeps the reset token and trims the email", () => {
    expect(buildResetPasswordBody("  admin@example.com ", "tok123", "NewPass!1")).toEqual({
      email: "admin@example.com",
      token: "tok123",
      newPassword: "NewPass!1",
    });
  });
});
