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
  name: 'Pizza Pepperoni',
  tagline: 'Tu nuevo gusto culposo',
  description:
    'Base salsa napolitana, queso mozzarella rayado, peperoni, albahaca seca.',
  price: '$16.000',
  priceValue: 16000,
  image: 'https://res.cloudinary.com/diaymnuut/image/upload/v1775406339/IMG_4016_h0vjmi.jpg',
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
