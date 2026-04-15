export interface BaseOption {
  name: string;
  priceValue: number;
}

export interface MenuItem {
  name: string;
  description: string;
  price: string;
  priceValue: number;
  image: string;
  flavors?: string[];
  baseOptions?: BaseOption[];
}

export interface MenuCategory {
  id: string;
  title: string;
  icon: string;
  items: MenuItem[];
}
