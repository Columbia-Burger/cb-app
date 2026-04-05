export interface MenuItem {
  name: string;
  description: string;
  price: string;
  priceValue: number;
  image: string; // Cloudinary URL — dejar '' hasta tener el link
}

export interface MenuCategory {
  id: string;
  title: string;
  icon: string;
  items: MenuItem[];
}
