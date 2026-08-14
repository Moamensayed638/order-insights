import type { EditTab, FormState } from "../../../types/types";

export const fmt = (n: number) => `${n.toFixed(2)} EGP`;

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export const emptyForm: FormState = {
  nameAr: "",
  nameEn: "",
  descriptionAr: "",
  descriptionEn: "",
  price: "",
  categoryId: "",
  calories: "0",
  pointsReward: "0",
  discountPercentage: "",
  discountStart: "",
  discountEnd: "",
  image: null,
};

export const EDIT_TABS: ReadonlyArray<readonly [EditTab, string]> = [
  ["details", "Details"],
  ["sizes", "Sizes"],
  ["modifiers", "Modifiers"],
];
