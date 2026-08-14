import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ModifierGroupDraft } from "@/lib/adminProducts";
import { Field } from "./Field";

export function WizardModifiers({
  modifierGroups, setModifierGroups,
}: {
  modifierGroups: ModifierGroupDraft[];
  setModifierGroups: React.Dispatch<React.SetStateAction<ModifierGroupDraft[]>>;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground font-body">
        Add at least one modifier group, each with at least one option.
      </p>
      {modifierGroups.map((g, gi) => (
        <div key={gi} className="rounded-md border border-border/60 bg-muted/20 p-3 space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <Field label={`Group #${gi + 1} name (EN)`} required>
              <Input
                value={g.nameEn}
                onChange={(e) => setModifierGroups(modifierGroups.map((x, j) => j === gi ? { ...x, nameEn: e.target.value } : x))}
                placeholder="e.g. Extras"
                className="w-40"
              />
            </Field>
            <Field label={`Group #${gi + 1} name (AR)`} required>
              <Input
                dir="rtl"
                value={g.nameAr}
                onChange={(e) => setModifierGroups(modifierGroups.map((x, j) => j === gi ? { ...x, nameAr: e.target.value } : x))}
                placeholder="مثال: إضافات"
                className="w-40"
              />
            </Field>
            <Field label="Max selections" required>
              <Input
                type="number" min="1"
                value={g.maxSelections}
                onChange={(e) => setModifierGroups(modifierGroups.map((x, j) => j === gi ? { ...x, maxSelections: e.target.value } : x))}
                className="w-24"
              />
            </Field>
            <div className="flex items-center gap-1.5 pb-1">
              <input
                type="checkbox"
                checked={g.isRequired}
                onChange={(e) => setModifierGroups(modifierGroups.map((x, j) => j === gi ? { ...x, isRequired: e.target.checked } : x))}
                className="accent-primary"
                id={`group-required-${gi}`}
              />
              <label htmlFor={`group-required-${gi}`} className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground cursor-pointer">
                Required
              </label>
            </div>
            {modifierGroups.length > 1 && (
              <Button
                type="button" variant="ghost" size="icon"
                onClick={() => setModifierGroups(modifierGroups.filter((_, j) => j !== gi))}
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 mb-0.5"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <div className="space-y-2 pl-2 border-l border-border/40">
            {g.options.map((o, oi) => (
              <div key={oi} className="flex flex-wrap items-end gap-2">
                <Field label={`Option #${oi + 1} name (EN)`} required>
                  <Input
                    value={o.nameEn}
                    onChange={(e) => setModifierGroups(modifierGroups.map((x, j) =>
                      j === gi ? { ...x, options: x.options.map((op, k) => k === oi ? { ...op, nameEn: e.target.value } : op) } : x,
                    ))}
                    placeholder="e.g. Sugar"
                    className="w-36"
                  />
                </Field>
                <Field label={`Option #${oi + 1} name (AR)`} required>
                  <Input
                    dir="rtl"
                    value={o.nameAr}
                    onChange={(e) => setModifierGroups(modifierGroups.map((x, j) =>
                      j === gi ? { ...x, options: x.options.map((op, k) => k === oi ? { ...op, nameAr: e.target.value } : op) } : x,
                    ))}
                    placeholder="مثال: سكر"
                    className="w-36"
                  />
                </Field>
                <Field label="Extra price (EGP)" required>
                  <Input
                    type="number" step="0.01" min="0"
                    value={o.extraPrice}
                    onChange={(e) => setModifierGroups(modifierGroups.map((x, j) =>
                      j === gi ? { ...x, options: x.options.map((op, k) => k === oi ? { ...op, extraPrice: e.target.value } : op) } : x,
                    ))}
                    className="w-28"
                    placeholder="0"
                  />
                </Field>
                {g.options.length > 1 && (
                  <Button
                    type="button" variant="ghost" size="icon"
                    onClick={() => setModifierGroups(modifierGroups.map((x, j) =>
                      j === gi ? { ...x, options: x.options.filter((_, k) => k !== oi) } : x,
                    ))}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 mb-0.5"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button" variant="outline" size="sm"
              onClick={() => setModifierGroups(modifierGroups.map((x, j) =>
                j === gi ? { ...x, options: [...x.options, { nameAr: "", nameEn: "", extraPrice: "0" }] } : x,
              ))}
              className="gap-1.5 border-border/60 text-xs"
            >
              <Plus className="h-3.5 w-3.5" /> Add option
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button" variant="outline" size="sm"
        onClick={() => setModifierGroups([...modifierGroups, { nameAr: "", nameEn: "", isRequired: false, maxSelections: "1", options: [{ nameAr: "", nameEn: "", extraPrice: "0" }] }])}
        className="gap-1.5 border-border/60 text-xs"
      >
        <Plus className="h-3.5 w-3.5" /> Add group
      </Button>
    </div>
  );
}
