import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { WizardModifiers } from "@/components/products/WizardModifiers";
import { ModifierEditList } from "@/components/products/ModifierEditList";

describe("WizardModifiers", () => {
  it("lets an admin mark an option as countable", () => {
    const setModifierGroups = vi.fn();

    render(
      <WizardModifiers
        modifierGroups={[{
          nameAr: "إضافات",
          nameEn: "Extras",
          isRequired: false,
          maxSelections: "1",
          options: [{ nameAr: "سكر", nameEn: "Sugar", extraPrice: "5", isCountable: false }],
        }]}
        setModifierGroups={setModifierGroups}
      />,
    );

    fireEvent.click(screen.getByLabelText("Countable"));

    expect(setModifierGroups).toHaveBeenCalledWith([{
      nameAr: "إضافات",
      nameEn: "Extras",
      isRequired: false,
      maxSelections: "1",
      options: [{ nameAr: "سكر", nameEn: "Sugar", extraPrice: "5", isCountable: true }],
    }]);
  });
});

describe("ModifierEditList", () => {
  it("shows and updates the countable setting for an existing option", () => {
    const setOptionEdits = vi.fn();

    render(
      <ModifierEditList
        optionEdits={[{
          groupId: 1,
          groupName: "Extras",
          groupNameAr: "إضافات",
          groupNameEn: "Extras",
          isRequired: false,
          maxSelections: "1",
          options: [{ id: 2, nameAr: "سكر", nameEn: "Sugar", extraPrice: "5", isCountable: true }],
        }]}
        setOptionEdits={setOptionEdits}
        rowError={null}
        groupError={null}
        onDeleteOption={vi.fn()}
        deletingOptionId={null}
        onAddOption={vi.fn()}
      />,
    );

    const countable = screen.getByLabelText("Countable");
    expect(countable).toBeChecked();
    fireEvent.click(countable);

    expect(setOptionEdits).toHaveBeenCalledWith([{
      groupId: 1,
      groupName: "Extras",
      groupNameAr: "إضافات",
      groupNameEn: "Extras",
      isRequired: false,
      maxSelections: "1",
      options: [{ id: 2, nameAr: "سكر", nameEn: "Sugar", extraPrice: "5", isCountable: false }],
    }]);
  });
});
