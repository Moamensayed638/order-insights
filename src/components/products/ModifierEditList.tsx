import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Counter } from "./Counter";
import { Field } from "./Field";
import type { OptionGroupEdit, RowError } from "../../types/types";

export function ModifierEditList({
  optionEdits, setOptionEdits, rowError, groupError, onDeleteOption, deletingOptionId, onDeleteGroup, deletingGroupId, onAddGroup, onAddOption, addingGroup,
}: {
  optionEdits: OptionGroupEdit[];
  setOptionEdits: React.Dispatch<React.SetStateAction<OptionGroupEdit[]>>;
  rowError: RowError;
  groupError: RowError;
  onDeleteOption: (groupId: number, optionId: number) => void;
  deletingOptionId: number | null;
  onDeleteGroup?: (groupId: number) => void;
  deletingGroupId?: number | null;
  onAddGroup?: () => void;
  addingGroup?: boolean;
  onAddOption: (groupId: number) => void;
}) {
  return (
    <div className="space-y-3 rounded-md border border-border/60 bg-muted/10 p-3">
      {optionEdits.length === 0 && (
        <p className="text-xs text-muted-foreground font-body">This product has no modifier options.</p>
      )}
      {optionEdits.map((g, gi) => (
        <div key={g.groupId} className="space-y-2 rounded-md border border-border/40 bg-background/50 p-3">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Group Name (EN)" required>
              <Input
                value={g.groupNameEn}
                onChange={(e) => setOptionEdits(optionEdits.map((x, j) =>
                  j === gi ? { ...x, groupNameEn: e.target.value } : x,
                ))}
                className="w-36"
              />
            </Field>
            <Field label="Group Name (AR)" required>
              <Input
                dir="rtl"
                value={g.groupNameAr}
                onChange={(e) => setOptionEdits(optionEdits.map((x, j) =>
                  j === gi ? { ...x, groupNameAr: e.target.value } : x,
                ))}
                className="w-36"
              />
            </Field>
            <Field label="Max selections" required>
              <Counter
                value={g.maxSelections}
                onChange={(next) => setOptionEdits(optionEdits.map((x, j) =>
                  j === gi ? { ...x, maxSelections: next } : x,
                ))}
                label={`max selections for ${g.groupName}`}
              />
            </Field>
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id={`required-${g.groupId}`}
                checked={g.isRequired}
                onCheckedChange={(checked) => setOptionEdits(optionEdits.map((x, j) =>
                  j === gi ? { ...x, isRequired: checked === true } : x,
                ))}
              />
              <label
                htmlFor={`required-${g.groupId}`}
                className="text-xs font-medium text-foreground cursor-pointer"
              >
                Required
              </label>
            </div>
            {onDeleteGroup && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={deletingGroupId === g.groupId}
                onClick={() => onDeleteGroup(g.groupId)}
                aria-label={`Delete group ${g.groupNameEn || g.groupNameAr || g.groupName}`}
                className="mb-0.5 h-9 w-9 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          {groupError?.id === g.groupId && (
            <p className="text-[11px] text-destructive font-body">{groupError.msg}</p>
          )}
          <div className="space-y-2 pl-2 border-l border-border/40">
            {g.options.map((o, oi) => (
              <div key={o.id} className="space-y-1">
                <div className="flex flex-wrap items-end gap-2">
                  <Field label="Name (EN)" required>
                    <Input
                      value={o.nameEn}
                      onChange={(e) => setOptionEdits(optionEdits.map((x, j) =>
                        j === gi ? { ...x, options: x.options.map((op, k) => k === oi ? { ...op, nameEn: e.target.value } : op) } : x,
                      ))}
                      className="w-36"
                    />
                  </Field>
                  <Field label="Name (AR)" required>
                    <Input
                      dir="rtl"
                      value={o.nameAr}
                      onChange={(e) => setOptionEdits(optionEdits.map((x, j) =>
                        j === gi ? { ...x, options: x.options.map((op, k) => k === oi ? { ...op, nameAr: e.target.value } : op) } : x,
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
                  <div className="flex items-center gap-2 pb-2">
                    <Checkbox
                      id={`countable-${o.id}`}
                      checked={o.isCountable ?? true}
                      onCheckedChange={(checked) => setOptionEdits(optionEdits.map((x, j) =>
                        j === gi ? { ...x, options: x.options.map((op, k) => k === oi ? { ...op, isCountable: checked === true } : op) } : x,
                      ))}
                    />
                    <label htmlFor={`countable-${o.id}`} className="text-xs font-medium text-foreground cursor-pointer">
                      Countable
                    </label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={deletingOptionId === o.id}
                    onClick={() => onDeleteOption(g.groupId, o.id)}
                    aria-label={`Delete ${o.nameEn || o.nameAr || "option"}`}
                    className="mb-0.5 h-9 w-9 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {rowError?.id === o.id && (
                  <p className="text-[11px] text-destructive font-body">{rowError.msg}</p>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAddOption(g.groupId)}
              className="h-7 gap-1 border-border/60 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add option
            </Button>
          </div>
        </div>
      ))}
      {onAddGroup && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddGroup}
          disabled={addingGroup}
          className="h-8 gap-1.5 border-border/60 text-xs"
        >
          <Plus className="h-4 w-4" />
          {addingGroup ? "Adding group..." : "Add modifier group"}
        </Button>
      )}
    </div>
  );
}
