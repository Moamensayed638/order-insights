import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  applyDefaultSize, createModifierGroup, createModifierOption, createProduct,
  createSize, deleteModifierOption, fetchProductById, formatDiscountTimestamp,
  resolveEditCategoryId, updateModifierOption, updateProduct, updateSize,
  validateModifierGroups, validateModifierOptionEdit, validateProductForm,
  validateSizeEdit, validateSizes,
} from "@/lib/adminProducts";
import type { ModifierGroupDraft, SizeDraft } from "@/lib/adminProducts";
import type { AdminProduct, Category, ProductFormInput } from "@/types/product";
import { emptyForm, MAX_IMAGE_BYTES } from "../constants/constants";
import type {
  EditTab, FormState, OptionGroupEdit, RowError, SizeEditRow,
} from "@/types/types";

const blankSizes: SizeDraft[] = [{ name: "", price: "", isDefault: true }];
const blankGroups: ModifierGroupDraft[] = [
  { name: "", isRequired: false, maxSelections: "1", options: [{ name: "", extraPrice: "0" }] },
];

export function useProductDialog(categories: Category[]) {
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [editTab, setEditTab] = useState<EditTab>("details");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [sizes, setSizes] = useState<SizeDraft[]>(blankSizes);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroupDraft[]>(blankGroups);
  const [formError, setFormError] = useState<string | null>(null);
  const [sizeEdits, setSizeEdits] = useState<SizeEditRow[]>([]);
  const [optionEdits, setOptionEdits] = useState<OptionGroupEdit[]>([]);
  const [sizeRowError, setSizeRowError] = useState<RowError>(null);
  const [optionRowError, setOptionRowError] = useState<RowError>(null);
  const [savingSizes, setSavingSizes] = useState(false);
  const [savingOptions, setSavingOptions] = useState(false);
  const [deletingOptionId, setDeletingOptionId] = useState<number | null>(null);
  // New, unsaved option rows get a temporary negative id until the server
  // assigns a real one on save.
  const tempIdRef = useRef(-1);

  function resetForm() {
    setForm(emptyForm);
    setEditing(null);
    setFormError(null);
    setWizardStep(1);
    setSizes(blankSizes);
    setModifierGroups(blankGroups);
    setSizeEdits([]);
    setOptionEdits([]);
    setSizeRowError(null);
    setOptionRowError(null);
    setSavingSizes(false);
    setSavingOptions(false);
    setEditTab("details");
  }

  function seedEdits(product: AdminProduct) {
    setSizeEdits(product.sizes.map((s) => ({
      id: s.id, name: s.name, price: String(s.price), isDefault: s.isDefault,
    })));
    setOptionEdits(product.modifierGroups.map((g) => ({
      groupId: g.id, groupName: g.name,
      options: g.options.map((o) => ({ id: o.id, name: o.name, extraPrice: String(o.extraPrice) })),
    })));
    setSizeRowError(null);
    setOptionRowError(null);
  }

  function openCreate() {
    resetForm();
    setDialogOpen(true);
  }

  function openEdit(product: AdminProduct) {
    setEditing(product);
    setFormError(null);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      categoryId: resolveEditCategoryId(product, categories),
      calories: String(product.calories),
      pointsReward: String(product.pointsReward),
      discountPercentage:
        product.discountPercentage != null ? String(product.discountPercentage) : "",
      discountStart: product.discountStart ? product.discountStart.slice(0, 16) : "",
      discountEnd: product.discountEnd ? product.discountEnd.slice(0, 16) : "",
      image: null,
    });
    seedEdits(product);
    setEditTab("details");
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    resetForm();
  }

  const saveMutation = useMutation({
    mutationFn: async (input: { id?: number; payload: ProductFormInput }) => {
      if (input.id != null) return updateProduct(input.id, input.payload);
      const product = await createProduct(input.payload);
      await Promise.all(sizes.map((s) =>
        createSize(product.id, { name: s.name.trim(), price: Number(s.price), isDefault: s.isDefault }),
      ));
      for (const g of modifierGroups) {
        const group = await createModifierGroup(product.id, {
          name: g.name.trim(),
          isRequired: g.isRequired,
          maxSelections: Number(g.maxSelections),
        });
        if (group?.id) {
          await Promise.all(g.options.map((o) =>
            createModifierOption(group.id, { name: o.name.trim(), extraPrice: Number(o.extraPrice) }),
          ));
        }
      }
      return product;
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.id != null ? "Product updated" : "Product created");
      setDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-top-selling"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Failed to save product"),
  });

  function selectDefaultSize(index: number) {
    setSizeEdits((rows) => applyDefaultSize(rows, index));
  }

  async function saveAllSizes() {
    setSizeRowError(null);
    for (const row of sizeEdits) {
      const err = validateSizeEdit(row);
      if (err) return setSizeRowError({ id: row.id, msg: err });
    }
    setSavingSizes(true);
    try {
      await Promise.all(sizeEdits.map((s) =>
        updateSize(s.id, { name: s.name.trim(), price: Number(s.price), isDefault: s.isDefault }),
      ));
      setEditing((prev) => prev && {
        ...prev,
        sizes: prev.sizes.map((s) => {
          const edited = sizeEdits.find((e) => e.id === s.id);
          return edited ? { ...s, name: edited.name.trim(), price: Number(edited.price), isDefault: edited.isDefault } : s;
        }),
      });
      toast.success("Sizes saved");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save sizes");
    } finally {
      setSavingSizes(false);
    }
  }

  function addOption(groupId: number) {
    setOptionRowError(null);
    setOptionEdits((groups) => groups.map((g) =>
      g.groupId === groupId
        ? { ...g, options: [...g.options, { id: tempIdRef.current--, name: "", extraPrice: "0" }] }
        : g,
    ));
  }

  async function saveAllOptions() {
    setOptionRowError(null);
    for (const row of optionEdits.flatMap((g) => g.options)) {
      const err = validateModifierOptionEdit(row);
      if (err) return setOptionRowError({ id: row.id, msg: err });
    }
    setSavingOptions(true);
    try {
      await Promise.all(optionEdits.flatMap((g) => g.options.map((o) =>
        o.id < 0
          ? createModifierOption(g.groupId, { name: o.name.trim(), extraPrice: Number(o.extraPrice) })
          : updateModifierOption(o.id, { name: o.name.trim(), extraPrice: Number(o.extraPrice) }),
      )));
      // Some rows were newly created and lack real ids — reseed from the server.
      if (editing) {
        const fresh = await fetchProductById(editing.id);
        setEditing(fresh);
        seedEdits(fresh);
      }
      toast.success("Modifiers saved");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save modifiers");
    } finally {
      setSavingOptions(false);
    }
  }

  async function deleteOption(optionId: number) {
    setOptionRowError(null);
    // Unsaved rows (temp negative id) only exist locally — just drop them.
    if (optionId < 0) {
      setOptionEdits((groups) =>
        groups.map((g) => ({ ...g, options: g.options.filter((o) => o.id !== optionId) })));
      return;
    }
    setDeletingOptionId(optionId);
    try {
      await deleteModifierOption(optionId);
      setOptionEdits((groups) =>
        groups.map((g) => ({ ...g, options: g.options.filter((o) => o.id !== optionId) })));
      setEditing((prev) => prev && {
        ...prev,
        modifierGroups: prev.modifierGroups.map((g) => ({
          ...g,
          options: g.options.filter((o) => o.id !== optionId),
        })),
      });
      toast.success("Modifier option deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete option");
    } finally {
      setDeletingOptionId(null);
    }
  }

  function handleImageChange(file: File | null) {
    if (file && file.size > MAX_IMAGE_BYTES) {
      setFormError("Image must be 2 MB or less");
      return;
    }
    setFormError(null);
    setForm((f) => ({ ...f, image: file }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (wizardStep === 1) {
      const err = validateProductForm(
        {
          name: form.name,
          description: form.description,
          price: form.price,
          categoryId: form.categoryId,
          calories: form.calories,
          pointsReward: form.pointsReward,
          discountPercentage: form.discountPercentage,
        },
        { isEditing: Boolean(editing), hasImage: Boolean(form.image) },
      );
      if (err) return setFormError(err);
      // When editing, sizes/modifiers are managed via their own tabs, not the
      // create wizard. Skip the wizard size/modifier validation and submit the
      // product details directly.
      if (!editing) return setWizardStep(2);
    }

    if (!editing) {
      if (wizardStep === 2) {
        const err = validateSizes(sizes);
        if (err) return setFormError(err);
        return setWizardStep(3);
      }

      const err3 = validateModifierGroups(modifierGroups);
      if (err3) return setFormError(err3);
    }

    const discountPercentage =
      form.discountPercentage.trim() === "" ? null : Number(form.discountPercentage);

    const payload: ProductFormInput = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      categoryId: Number(form.categoryId),
      calories: Number(form.calories),
      pointsReward: Number(form.pointsReward),
      image: form.image,
      discountPercentage,
      discountStart: formatDiscountTimestamp(form.discountStart),
      discountEnd: formatDiscountTimestamp(form.discountEnd),
    };

    saveMutation.mutate({ id: editing?.id, payload });
  }

  return {
    dialogOpen, setDialogOpen,
    wizardStep, setWizardStep,
    editing, editTab, setEditTab,
    form, setForm,
    sizes, setSizes,
    modifierGroups, setModifierGroups,
    formError,
    sizeEdits, setSizeEdits,
    optionEdits, setOptionEdits,
    sizeRowError, optionRowError,
    savingSizes, savingOptions, deletingOptionId,
    saveMutation,
    openCreate, openEdit, closeDialog,
    selectDefaultSize, saveAllSizes, saveAllOptions, deleteOption, addOption,
    handleImageChange, handleSubmit,
  };
}

export type ProductDialogController = ReturnType<typeof useProductDialog>;
