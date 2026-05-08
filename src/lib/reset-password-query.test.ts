import { describe, expect, it } from "vitest";
import { getRawResetTokenFromSearch } from "./reset-password";

describe("getRawResetTokenFromSearch", () => {
  it("preserves the encoded reset token from the query string", () => {
    const search = "?email=admin@example.com&token=CfDJ8LKXfY1K9%2BlAmY28f98jW1ht%2Fabc%2B123";

    expect(getRawResetTokenFromSearch(search)).toBe("CfDJ8LKXfY1K9%2BlAmY28f98jW1ht%2Fabc%2B123");
  });
});
