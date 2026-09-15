import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  applyDefaultSize, createModifierGroup, createModifierOption, createProduct,
  createSize, deleteModifierOption, deleteModifierGroup, fetchProductById, formatDiscountTimestamp,
  resolveEditCategoryId, updateModifierGroup, updateModifierGroupNames, updateModifierOption, updateProduct,
  updateSize, validateModifierGroupEdit, validateModifierGroupNamesEdit, validateModifierGroups,
  validateModifierOptionEdit, validateProductForm, validateSizeEdit, validateSizes,
} from "@/lib/adminProducts";
import type { ModifierGroupDraft, SizeDraft } from "@/lib/adminProducts";
import { createDraftFromProduct, saveDraft, getDraftById, deleteDraft } from "@/lib/productDrafts";
import { pickDisplay } from "@/lib/productSchemas";
import type { AdminProduct, Category, ProductFormInput } from "@/types/product";
import { emptyForm, MAX_IMAGE_BYTES } from "../constants/constants";
import type {
  EditTab, FormState, OptionGroupEdit, RowError, SizeEditRow,
} from "@/types/types";

const blankSizes: SizeDraft[] = [{ nameAr: "", nameEn: "", price: "", isDefault: true }];
const blankGroups: ModifierGroupDraft[] = [
  {
    nameAr: "",
    nameEn: "",
    isRequired: false,
    maxSelections: "1",
    options: [{ nameAr: "", nameEn: "", extraPrice: "0", isCountable: true }],
  },
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
  // Group-level errors are keyed by group id, so they get their own slot rather
  // than sharing the option rows' id space.
  const [groupRowError, setGroupRowError] = useState<RowError>(null);
  const [savingSizes, setSavingSizes] = useState(false);
  const [savingOptions, setSavingOptions] = useState(false);
  const [deletingOptionId, setDeletingOptionId] = useState<number | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<number | null>(null);
  const [addingGroup, setAddingGroup] = useState(false);
  // New, unsaved option rows get a temporary negative id until the server
  // assigns a real one on save.
  const tempIdRef = useRef(-1);
  const tempGroupIdRef = useRef(-1000);
  // Track the draft ID when editing a draft
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  // Track the existing imageUrl when editing a draft
  const [draftImageUrl, setDraftImageUrl] = useState<string | null>(null);

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
    setGroupRowError(null);
    setSavingSizes(false);
    setSavingOptions(false);
    setEditTab("details");
    setEditingDraftId(null);
    setDraftImageUrl(null);
  }

  function seedEdits(product: AdminProduct) {
    setSizeEdits(product.sizes.map((s) => ({
      id: s.id,
      nameAr: s.nameAr,
      nameEn: s.nameEn,
      price: String(s.price),
      isDefault: s.isDefault,
    })));
    setOptionEdits(product.modifierGroups.map((g) => ({
      groupId: g.id,
      groupName: g.name,
      groupNameAr: g.nameAr,
      groupNameEn: g.nameEn,
      isRequired: g.isRequired,
      maxSelections: String(g.maxSelections),
      options: g.options.map((o) => ({
        id: o.id,
        nameAr: o.nameAr,
        nameEn: o.nameEn,
        extraPrice: String(o.extraPrice),
        isCountable: o.isCountable ?? true,
      })),
    })));
    setSizeRowError(null);
    setOptionRowError(null);
    setGroupRowError(null);
  }

  function openCreate() {
    resetForm();
    setDialogOpen(true);
  }

  function openEdit(product: AdminProduct) {
    setEditing(product);
    setFormError(null);
    setForm({
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descriptionAr: product.descriptionAr,
      descriptionEn: product.descriptionEn,
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

  function openCopy(product: AdminProduct) {
    const draft = createDraftFromProduct(product);
    saveDraft(draft);
    toast.success("Draft created");
    // Force immediate update by invalidating and refetching
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    // Use setTimeout to ensure the refetch happens after state updates
    setTimeout(() => {
      queryClient.refetchQueries({ queryKey: ["admin-products"] });
    }, 0);
  }

  function openEditDraft(draftId: string) {
    const draft = getDraftById(draftId);
    if (!draft) return;

    setEditingDraftId(draftId);
    setDraftImageUrl(draft.imageUrl);
    setEditing(null);
    setFormError(null);
    setWizardStep(1);
    setForm({
      nameAr: draft.nameAr,
      nameEn: draft.nameEn,
      descriptionAr: draft.descriptionAr,
      descriptionEn: draft.descriptionEn,
      price: String(draft.price),
      categoryId: String(draft.categoryId),
      calories: String(draft.calories),
      pointsReward: String(draft.pointsReward),
      discountPercentage: draft.discountPercentage != null ? String(draft.discountPercentage) : "",
      discountStart: draft.discountStart ? draft.discountStart.slice(0, 16) : "",
      discountEnd: draft.discountEnd ? draft.discountEnd.slice(0, 16) : "",
      image: null,
    });
    setSizes(draft.sizes);
    setModifierGroups(draft.modifierGroups);
    setDialogOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async (input: { id?: number; payload: ProductFormInput }) => {
      if (input.id != null) return updateProduct(input.id, input.payload);
      const product = await createProduct(input.payload);
      await Promise.all(sizes.map((s) =>
        createSize(product.id, {
          nameAr: s.nameAr.trim(),
          nameEn: s.nameEn.trim(),
          price: Number(s.price),
          isDefault: s.isDefault,
        }),
      ));
      for (const g of modifierGroups) {
        const group = await createModifierGroup(product.id, {
          nameAr: g.nameAr.trim(),
          nameEn: g.nameEn.trim(),
          isRequired: g.isRequired,
          maxSelections: Number(g.maxSelections),
        });
        if (group?.id) {
          await Promise.all(g.options.map((o) =>
            createModifierOption(group.id, {
              nameAr: o.nameAr.trim(),
              nameEn: o.nameEn.trim(),
              extraPrice: Number(o.extraPrice),
              isCountable: o.isCountable ?? true,
            }),
          ));
        }
      }
      return product;
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.id != null ? "Product updated" : "Product created");
      // Delete draft from localStorage if we were editing a draft
      if (editingDraftId) {
        deleteDraft(editingDraftId);
      }
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
    if (!editing) return;
    for (const row of sizeEdits) {
      const err = validateSizeEdit(row);
      if (err) return setSizeRowError({ id: row.id, msg: err });
    }
    setSavingSizes(true);
    try {
      await Promise.all(sizeEdits.map((s) =>
        updateSize(editing.id, s.id, {
          nameAr: s.nameAr.trim(),
          nameEn: s.nameEn.trim(),
          price: Number(s.price),
          isDefault: s.isDefault,
        }),
      ));
      setEditing((prev) => prev && {
        ...prev,
        sizes: prev.sizes.map((s) => {
          const edited = sizeEdits.find((e) => e.id === s.id);
          if (!edited) return s;
          const nameAr = edited.nameAr.trim();
          const nameEn = edited.nameEn.trim();
          return {
            ...s,
            nameAr,
            nameEn,
            name: pickDisplay(nameEn, nameAr),
            price: Number(edited.price),
            isDefault: edited.isDefault,
          };
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
        ? {
          ...g,
          options: [
            ...g.options,
            { id: tempIdRef.current--, nameAr: "", nameEn: "", extraPrice: "0", isCountable: true },
          ],
        }
        : g,
    ));
  }

  async function saveAllOptions() {
    setOptionRowError(null);
    setGroupRowError(null);
    if (!editing) return;
    for (const group of optionEdits) {
      const err = validateModifierGroupEdit({ maxSelections: group.maxSelections });
      if (err) return setGroupRowError({ id: group.groupId, msg: err });
      const nameErr = validateModifierGroupNamesEdit({
        nameAr: group.groupNameAr,
        nameEn: group.groupNameEn,
        isRequired: group.isRequired,
      });
      if (nameErr) return setGroupRowError({ id: group.groupId, msg: nameErr });
    }
    for (const row of optionEdits.flatMap((g) => g.options)) {
      const err = validateModifierOptionEdit(row);
      if (err) return setOptionRowError({ id: row.id, msg: err });
    }
    setSavingOptions(true);
    try {
      await Promise.all([
        // Update group names, isRequired, and maxSelections
        ...optionEdits.map((g) =>
          updateModifierGroupNames(editing.id, g.groupId, {
            nameAr: g.groupNameAr.trim(),
            nameEn: g.groupNameEn.trim(),
            isRequired: g.isRequired,
          }),
        ),
        ...optionEdits.map((g) =>
          updateModifierGroup(editing.id, g.groupId, {
            maxSelections: Number(g.maxSelections),
          }),
        ),
        ...optionEdits.flatMap((g) => g.options.map((o) => {
          const payload = {
            nameAr: o.nameAr.trim(),
            nameEn: o.nameEn.trim(),
            extraPrice: Number(o.extraPrice),
            isCountable: o.isCountable ?? true,
          };
          return o.id < 0
            ? createModifierOption(g.groupId, payload)
            : updateModifierOption(g.groupId, o.id, payload);
        })),
      ]);
      // Some rows were newly created and lack real ids — reseed from the server.
      const fresh = await fetchProductById(editing.id);
      setEditing(fresh);
      seedEdits(fresh);
      toast.success("Modifiers saved");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save modifiers");
    } finally {
      setSavingOptions(false);
    }
  }

  async function deleteOption(groupId: number, optionId: number) {
    setOptionRowError(null);
    // Unsaved rows (temp negative id) only exist locally — just drop them.
    if (optionId < 0) {
      setOptionEdits((groups) =>
        groups.map((g) => ({ ...g, options: g.options.filter((o) => o.id !== optionId) })));
      return;
    }
    setDeletingOptionId(optionId);
    try {
      await deleteModifierOption(groupId, optionId);
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

  async function deleteGroup(groupId: number) {
    setGroupRowError(null);
    if (!editing) return;
    setDeletingGroupId(groupId);
    try {
      await deleteModifierGroup(editing.id, groupId);
      setOptionEdits((groups) => groups.filter((g) => g.groupId !== groupId));
      setEditing((prev) => prev && {
        ...prev,
        modifierGroups: prev.modifierGroups.filter((g) => g.id !== groupId),
      });
      toast.success("Modifier group deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete group");
    } finally {
      setDeletingGroupId(null);
    }
  }

  async function addGroup() {
    setGroupRowError(null);
    if (!editing) return;
    setAddingGroup(true);
    try {
      const newGroup = await createModifierGroup(editing.id, {
        nameAr: "مجموعة جديدة",
        nameEn: "New Group",
        isRequired: false,
        maxSelections: 1,
      });
      // Fetch fresh data to get the new group with its assigned ID
      const fresh = await fetchProductById(editing.id);
      setEditing(fresh);
      seedEdits(fresh);
      toast.success("Modifier group added");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add group");
    } finally {
      setAddingGroup(false);
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
          nameAr: form.nameAr,
          nameEn: form.nameEn,
          descriptionAr: form.descriptionAr,
          descriptionEn: form.descriptionEn,
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
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      descriptionAr: form.descriptionAr.trim(),
      descriptionEn: form.descriptionEn.trim(),
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
    sizeRowError, optionRowError, groupRowError,
    savingSizes, savingOptions, deletingOptionId, deletingGroupId, addingGroup,
    saveMutation,
    openCreate, openEdit, openCopy, openEditDraft, closeDialog,
    selectDefaultSize, saveAllSizes, saveAllOptions, deleteOption, deleteGroup, addGroup, addOption,
    handleImageChange, handleSubmit,
    draftImageUrl,
  };
}

export type ProductDialogController = ReturnType<typeof useProductDialog>;
