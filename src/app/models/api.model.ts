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
