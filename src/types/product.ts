export type ProductSize = {
  id: number;
  name: string;
  price: number;
  isDefault: boolean;
};

export type ModifierOption = {
  id: number;
  name: string;
  extraPrice: number;
};

export type ModifierGroup = {
  id: number;
  name: string;
  isRequired: boolean;
  maxSelections: number;
  options: ModifierOption[];
};

export type AdminProduct = {
  id: number;
  name: string;
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
  name: string;
  description: string;
};

export type ProductFormInput = {
  name: string;
  description: string;
  price: number;
  categoryId: number;
  calories: number;
  pointsReward: number;
  image?: File | null;
  discountPercentage?: number | null;
  discountStart?: string | null;
  discountEnd?: string | null;
};
