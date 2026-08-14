import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { AdminProduct, Category } from "@/types/product";
import { Field } from "./Field";
import type { FormState } from "../../types/types";

export function DetailsForm({
  form, setForm, categories, categoriesLoading, editing, onImageChange,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  categories: Category[];
  categoriesLoading: boolean;
  editing: AdminProduct | null;
  onImageChange: (file: File | null) => void;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name (EN)" required>
          <Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
        </Field>
        <Field label="Name (AR)" required>
          <Input
            dir="rtl"
            value={form.nameAr}
            onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" required>
          <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
            <SelectTrigger>
              <SelectValue placeholder={categoriesLoading ? "Loading…" : "Pick a category"} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Description (EN)" required>
          <Textarea
            value={form.descriptionEn}
            onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
            rows={3}
          />
        </Field>
        <Field label="Description (AR)" required>
          <Textarea
            dir="rtl"
            value={form.descriptionAr}
            onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
            rows={3}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Price (EGP)" required>
          <Input type="number" step="0.01" min="0" value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </Field>
        <Field label="Calories">
          <Input type="number" min="0" value={form.calories}
            onChange={(e) => setForm({ ...form, calories: e.target.value })} />
        </Field>
        <Field label="Points reward">
          <Input type="number" min="0" value={form.pointsReward}
            onChange={(e) => setForm({ ...form, pointsReward: e.target.value })} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Discount % (optional)">
          <Input type="number" min="0" max="100" step="0.01" value={form.discountPercentage}
            onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })} placeholder="—" />
        </Field>
        <Field label="Discount start (optional)">
          <Input type="datetime-local" value={form.discountStart}
            onChange={(e) => setForm({ ...form, discountStart: e.target.value })} />
        </Field>
        <Field label="Discount end (optional)">
          <Input type="datetime-local" value={form.discountEnd}
            onChange={(e) => setForm({ ...form, discountEnd: e.target.value })} />
        </Field>
      </div>

      <Field label={editing ? "Replace image (optional, ≤ 2 MB)" : "Image (required, ≤ 2 MB)"} required={!editing}>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => onImageChange(e.target.files?.[0] ?? null)}
        />
        {editing && editing.imageUrl && (
          <p className="mt-1 text-[10px] font-mono text-muted-foreground">
            Current: {editing.imageUrl.split("/").pop()}
          </p>
        )}
      </Field>
    </>
  );
}
