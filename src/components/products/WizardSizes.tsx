import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SizeDraft } from "@/lib/adminProducts";
import { Field } from "./Field";

export function WizardSizes({
  sizes, setSizes,
}: {
  sizes: SizeDraft[];
  setSizes: React.Dispatch<React.SetStateAction<SizeDraft[]>>;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-body">
        Add at least one size. Mark one as the default.
      </p>
      {sizes.map((s, i) => (
        <div key={i} className="flex items-end gap-2 rounded-md border border-border/60 bg-muted/20 p-3">
          <Field label="Name" required>
            <Input
              value={s.name}
              onChange={(e) => setSizes(sizes.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
              placeholder="e.g. Medium"
              className="w-32"
            />
          </Field>
          <Field label="Price (EGP)" required>
            <Input
              type="number" step="0.01" min="0"
              value={s.price}
              onChange={(e) => setSizes(sizes.map((x, j) => j === i ? { ...x, price: e.target.value } : x))}
              placeholder="0"
              className="w-28"
            />
          </Field>
          <div className="flex items-center gap-1.5 pb-1">
            <input
              type="radio"
              name="sizeDefault"
              checked={s.isDefault}
              onChange={() => setSizes(sizes.map((x, j) => ({ ...x, isDefault: j === i })))}
              className="accent-primary"
              id={`size-default-${i}`}
            />
            <label htmlFor={`size-default-${i}`} className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground cursor-pointer">
              Default
            </label>
          </div>
          {sizes.length > 1 && (
            <Button
              type="button" variant="ghost" size="icon"
              onClick={() => setSizes(sizes.filter((_, j) => j !== i))}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 mb-0.5"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button" variant="outline" size="sm"
        onClick={() => setSizes([...sizes, { name: "", price: "", isDefault: false }])}
        className="gap-1.5 border-border/60 text-xs"
      >
        <Plus className="h-3.5 w-3.5" /> Add size
      </Button>
    </div>
  );
}
