export interface CategoryResponse {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

export interface FlavorResponse {
  id: number;
  name: string;
}

export interface ProductAdditionResponse {
  id: number;
  additionId: number;
  additionName: string;
  basePrice: number;
  priceOverride: number | null;
  effectivePrice: number;
}

export interface ProductResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  available: boolean;
  categoryId: number;
  categoryName: string;
  flavors: FlavorResponse[];
  additions: ProductAdditionResponse[];
  comboDescription?: string;
  comboPrice?: number;
}

export interface SeasonalSpecialResponse {
  id: number;
  name: string;
  description: string;
  tagline: string;
  price: number;
  imageUrl: string;
  active: boolean;
  seasonStart: string;
  seasonEnd: string;
}
