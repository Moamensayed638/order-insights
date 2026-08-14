export type ProductSize = {
  id: number;
  nameAr: string;
  nameEn: string;
  /** Display name — English with Arabic fallback. Derived, never sent back. */
  name: string;
  price: number;
  isDefault: boolean;
};

export type ModifierOption = {
  id: number;
  nameAr: string;
  nameEn: string;
  name: string;
  extraPrice: number;
};

export type ModifierGroup = {
  id: number;
  nameAr: string;
  nameEn: string;
  name: string;
  isRequired: boolean;
  maxSelections: number;
  options: ModifierOption[];
};

export type AdminProduct = {
  id: number;
  nameAr: string;
  nameEn: string;
  name: string;
  descriptionAr: string;
  descriptionEn: string;
  description: string;
  price: number;
  calories: number;
  pointsReward: number;
  imageUrl: string;
  isAvailable: boolean;
  categoryName: string;
  categoryId?: number;
  sizes: ProductSize[];
  modifierGroups: ModifierGroup[];
  discountedPrice: number;
  discountPercentage?: number;
  discountStart?: string;
  discountEnd?: string;
};

export type TopSellingProduct = {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  totalSold: number;
};

export type Category = {
  id: number;
  nameAr: string;
  nameEn: string;
  name: string;
  descriptionAr: string;
  descriptionEn: string;
};

export type ProductFormInput = {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
  categoryId: number;
  calories: number;
  pointsReward: number;
  image?: File | null;
  discountPercentage?: number | null;
  discountStart?: string | null;
  discountEnd?: string | null;
};
