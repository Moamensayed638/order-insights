import { describe, expect, it } from "vitest";
import { buildForgotPasswordBody } from "./forgot-password";

describe("buildForgotPasswordBody", () => {
  it("trims the email before sending", () => {
    expect(buildForgotPasswordBody("  admin@example.com ")).toEqual({ email: "admin@example.com" });
  });
});
