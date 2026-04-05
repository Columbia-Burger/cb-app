// ─────────────────────────────────────────────────────────────────────────────
// Datos de las secciones destacadas de la landing page.
// Actualiza image con la URL de Cloudinary cuando la tengas.
// ─────────────────────────────────────────────────────────────────────────────

export interface SpecialProduct {
  name: string;
  tagline: string;
  description: string;
  price: string;
  priceValue: number;
  image: string;
}

export interface FavoriteProduct {
  name: string;
  image: string;
}

// ── Especial del Mes ─────────────────────────────────────────────────────────
export const SPECIAL_OF_MONTH: SpecialProduct = {
  name: 'Nena Burger',
  tagline: 'Tu nuevo gusto culposo',
  description:
    'Pan Bimbo Brio, 130 gr de carne de res, 130 gr de pollo, queso cheddar, tocineta, tomate, lechuga y salsa tártara.',
  price: '$26.000',
  priceValue: 26000,
  image: 'assets/burger.jpg',
};

// ── Siempre Favoritos ────────────────────────────────────────────────────────
export const FAVORITES: FavoriteProduct[] = [
  {
    name: 'Patacon Columbia',
    image: 'https://res.cloudinary.com/diaymnuut/image/upload/v1775422497/DSC03320_i98qpv.jpg',
  },
  {
    name: 'Potato Burger',
    image: 'https://res.cloudinary.com/diaymnuut/image/upload/v1775406369/IMG_3920_at2llt.jpg',
  },
  {
    name: 'Salchi Mixta',
    image: 'https://res.cloudinary.com/diaymnuut/image/upload/v1775406365/IMG_3905_onyxt1.jpg',
  },
];
