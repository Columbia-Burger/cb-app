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
    'Pan Bimbo brillo, 130 gr de carne de res, 130 gr de pollo, queso cheddar, tocineta, tomate, lechuga y salsa tártara.',
  price: '$26.000',
  priceValue: 26000,
  image: 'https://res.cloudinary.com/diaymnuut/image/upload/f_auto,q_auto,w_800/v1775443116/nena_ia_kpgltn.jpg',
};

// ── Siempre Favoritos ────────────────────────────────────────────────────────
export const FAVORITES: FavoriteProduct[] = [
  {
    name: 'Patacon Columbia',
    image: 'https://res.cloudinary.com/diaymnuut/image/upload/f_auto,q_auto,w_600/v1775444375/DSC03320_eohrti.jpg',
  },
  {
    name: 'Potato Burger',
    image: 'https://res.cloudinary.com/diaymnuut/image/upload/f_auto,q_auto,w_600/v1775442791/IMG_3923_v1mvaj.jpg',
  },
  {
    name: 'Salchi Mixta',
    image: 'https://res.cloudinary.com/diaymnuut/image/upload/f_auto,q_auto,w_600/v1775442791/IMG_3897_bgiy5o.jpg',
  },
];
