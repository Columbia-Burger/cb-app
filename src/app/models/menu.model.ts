export interface BaseOption {
  name: string;
  priceValue: number;
}

export interface MenuAddition {
  id: number;
  name: string;
  effectivePrice: number;
}

export interface MenuItem {
  name: string;
  description: string;
  price: string;
  priceValue: number;
  image: string;
  flavors?: string[];
  baseOptions?: BaseOption[];
  additions?: MenuAddition[];
  comboDescription?: string;
  comboPrice?: number;
}

export interface MenuCategory {
  id: string;
  title: string;
  icon: string;
  items: MenuItem[];
}
