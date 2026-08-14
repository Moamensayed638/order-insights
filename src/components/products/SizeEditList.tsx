import { Input } from "@/components/ui/input";
import { Field } from "./Field";
import type { RowError, SizeEditRow } from "../../types/types";

export function SizeEditList({
  sizeEdits, setSizeEdits, onSelectDefault, rowError,
}: {
  sizeEdits: SizeEditRow[];
  setSizeEdits: React.Dispatch<React.SetStateAction<SizeEditRow[]>>;
  onSelectDefault: (index: number) => void;
  rowError: RowError;
}) {
  return (
    <div className="space-y-3 rounded-md border border-border/60 bg-muted/10 p-3">
      {sizeEdits.length === 0 && (
        <p className="text-xs text-muted-foreground font-body">This product has no sizes.</p>
      )}
      {sizeEdits.map((s, i) => (
        <div key={s.id} className="space-y-1">
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Name (EN)" required>
              <Input
                value={s.nameEn}
                onChange={(e) => setSizeEdits(sizeEdits.map((x, j) => j === i ? { ...x, nameEn: e.target.value } : x))}
                className="w-32"
              />
            </Field>
            <Field label="Name (AR)" required>
              <Input
                dir="rtl"
                value={s.nameAr}
                onChange={(e) => setSizeEdits(sizeEdits.map((x, j) => j === i ? { ...x, nameAr: e.target.value } : x))}
                className="w-32"
              />
            </Field>
            <Field label="Price (EGP)" required>
              <Input
                type="number" step="0.01" min="0"
                value={s.price}
                onChange={(e) => setSizeEdits(sizeEdits.map((x, j) => j === i ? { ...x, price: e.target.value } : x))}
                className="w-28"
              />
            </Field>
            <div className="flex items-center gap-1.5 pb-1">
              <input
                type="radio"
                name="editSizeDefault"
                checked={s.isDefault}
                onChange={() => onSelectDefault(i)}
                className="accent-primary"
                id={`edit-size-default-${s.id}`}
              />
              <label htmlFor={`edit-size-default-${s.id}`} className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground cursor-pointer">
                Default
              </label>
            </div>
          </div>
          {rowError?.id === s.id && (
            <p className="text-[11px] text-destructive font-body">{rowError.msg}</p>
          )}
        </div>
      ))}
    </div>
  );
}
