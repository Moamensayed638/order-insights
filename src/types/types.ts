export type TabValue = "all" | "available" | "unavailable" | "top";

export type EditTab = "details" | "sizes" | "modifiers";

export type FormState = {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: string;
  categoryId: string;
  calories: string;
  pointsReward: string;
  discountPercentage: string;
  discountStart: string;
  discountEnd: string;
  image: File | null;
};

export type SizeEditRow = {
  id: number;
  nameAr: string;
  nameEn: string;
  price: string;
  isDefault: boolean;
};
export type OptionEditRow = { id: number; nameAr: string; nameEn: string; extraPrice: string };
export type OptionGroupEdit = { groupId: number; groupName: string; options: OptionEditRow[] };

export type RowError = { id: number; msg: string } | null;
