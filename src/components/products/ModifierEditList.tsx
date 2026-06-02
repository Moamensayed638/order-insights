import { Input } from "@/components/ui/input";
import { Field } from "./Field";
import type { OptionGroupEdit, RowError } from "../../types/types";

export function ModifierEditList({
  optionEdits, setOptionEdits, rowError,
}: {
  optionEdits: OptionGroupEdit[];
  setOptionEdits: React.Dispatch<React.SetStateAction<OptionGroupEdit[]>>;
  rowError: RowError;
}) {
  return (
    <div className="space-y-3 rounded-md border border-border/60 bg-muted/10 p-3">
      {optionEdits.length === 0 && (
        <p className="text-xs text-muted-foreground font-body">This product has no modifier options.</p>
      )}
      {optionEdits.map((g, gi) => (
        <div key={g.groupId} className="space-y-2">
          <p className="text-xs font-medium text-foreground">{g.groupName}</p>
          <div className="space-y-2 pl-2 border-l border-border/40">
            {g.options.map((o, oi) => (
              <div key={o.id} className="space-y-1">
                <div className="flex items-end gap-2">
                  <Field label="Name" required>
                    <Input
                      value={o.name}
                      onChange={(e) => setOptionEdits(optionEdits.map((x, j) =>
                        j === gi ? { ...x, options: x.options.map((op, k) => k === oi ? { ...op, name: e.target.value } : op) } : x,
                      ))}
                      className="w-36"
                    />
                  </Field>
                  <Field label="Extra price (EGP)" required>
                    <Input
                      type="number" step="0.01" min="0"
                      value={o.extraPrice}
                      onChange={(e) => setOptionEdits(optionEdits.map((x, j) =>
                        j === gi ? { ...x, options: x.options.map((op, k) => k === oi ? { ...op, extraPrice: e.target.value } : op) } : x,
                      ))}
                      className="w-28"
                    />
                  </Field>
                </div>
                {rowError?.id === o.id && (
                  <p className="text-[11px] text-destructive font-body">{rowError.msg}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
