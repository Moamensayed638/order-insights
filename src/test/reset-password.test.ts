import { describe, expect, it } from "vitest";
import { buildResetPasswordBody, validateNewPassword } from "@/lib/reset-password";

describe("buildResetPasswordBody", () => {
  it("keeps the reset token and trims the email", () => {
    expect(buildResetPasswordBody("  admin@example.com ", "tok123", "NewPass!1")).toEqual({
      email: "admin@example.com",
      token: "tok123",
      newPassword: "NewPass!1",
    });
  });
});

describe("validateNewPassword", () => {
  it("returns null when both passwords match and are long enough", () => {
    expect(validateNewPassword("NewPass!1", "NewPass!1")).toBeNull();
  });

  it("flags passwords shorter than 8 characters", () => {
    expect(validateNewPassword("short", "short")).toBe("Password must be at least 8 characters.");
  });

  it("flags mismatched passwords", () => {
    expect(validateNewPassword("NewPass!1", "NewPass!2")).toBe("Passwords do not match.");
  });

  it("checks length before match so a short mismatch reports length", () => {
    expect(validateNewPassword("abc", "xyz")).toBe("Password must be at least 8 characters.");
  });
});
