import { describe, expect, it } from "vitest";
import type { OptionGroupEdit } from "@/types/types";

describe("OptionGroupEdit type structure", () => {
  it("includes groupNameAr and groupNameEn fields for editing", () => {
    const group: OptionGroupEdit = {
      groupId: 1,
      groupName: "Extras",
      groupNameAr: "إضافات",
      groupNameEn: "Extras",
      isRequired: false,
      maxSelections: "3",
      options: [],
    };

    expect(group.groupNameAr).toBe("إضافات");
    expect(group.groupNameEn).toBe("Extras");
    expect(group.isRequired).toBe(false);
  });
});
