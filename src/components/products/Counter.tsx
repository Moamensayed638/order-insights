import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Whole-number stepper. The value stays a string so it drops straight into the
 * product form drafts, which keep every field as typed text until save.
 */
export function Counter({
  value, onChange, label, min = 1, max = 99, disabled, className,
}: {
  value: string;
  onChange: (next: string) => void;
  /** Drives the aria-labels — the visible caption comes from the wrapping <Field>. */
  label: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}) {
  const current = Number(value);
  const valid = value.trim() !== "" && Number.isFinite(current);

  function step(delta: number) {
    // A blank or half-typed field snaps back to the floor instead of stepping
    // off NaN.
    if (!valid) return onChange(String(min));
    onChange(String(Math.min(max, Math.max(min, Math.trunc(current) + delta))));
  }

  return (
    <div className={cn("flex items-stretch", className)}>
      <Button
        type="button" variant="outline" size="icon"
        onClick={() => step(-1)}
        disabled={disabled || (valid && current <= min)}
        aria-label={`Decrease ${label}`}
        className="h-10 w-9 shrink-0 rounded-r-none border-border/60"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <Input
        type="number" inputMode="numeric" step="1"
        min={min} max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={label}
        className="w-14 -mx-px rounded-none border-border/60 px-1 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Button
        type="button" variant="outline" size="icon"
        onClick={() => step(1)}
        disabled={disabled || (valid && current >= max)}
        aria-label={`Increase ${label}`}
        className="h-10 w-9 shrink-0 rounded-l-none border-border/60"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
