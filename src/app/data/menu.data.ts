import { MenuCategory } from '../models/menu.model';

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANTE: cuando tengas las URLs de Cloudinary reemplaza el campo `image`
// de cada producto. Mientras tanto muestra el fallback assets/burger.jpg
// ─────────────────────────────────────────────────────────────────────────────

export const MENU_CATEGORIES: MenuCategory[] = [
  // ── HAMBURGUESAS ────────────────────────────────────────────────────────────
  {
    id: 'hamburguesas',
    title: 'Hamburguesas',
    icon: '🍔',
    items: [
      {
        name: 'Columbia Burger',
        description:
          'Pan bimbo brio, 2 carnes de res de 100 gm, doble queso cheddar, tocineta, pepinillos, verduras frescas y salsa tomate y mayonesa.',
        price: '$23.000',
        priceValue: 23000,
        image: 'https://res.cloudinary.com/diaymnuut/image/upload/v1775406323/IMG_3938_j19c4d.jpg',
      },
      {
        name: 'Cheese Burger',
        description:
          'Pan bimbo brio, 2 carnes de res de 100 gm, tocineta, doble queso cheddar y salsa miel-mostaza de la casa.',
        price: '$20.000',
        priceValue: 20000,
        image: '',
      },
      {
        name: 'Potato Burger',
        description:
          'Pan bimbo brio, 1 carne de res 130 gm, doble queso cheddar, papas a la francesa dentro de la burger, tomate, lechuga crespa y salsa tártara.',
        price: '$20.000',
        priceValue: 20000,
        image: 'https://res.cloudinary.com/diaymnuut/image/upload/v1775406369/IMG_3920_at2llt.jpg',
      },
      {
        name: 'Artesanal Burger',
        description:
          'Pan bimbo artesanal, 1 carne de res ahumada de 130 gm, tocineta, jamón, queso mozzarella gratinado, papas chips, cebolla grille y verduras frescas.',
        price: '$18.000',
        priceValue: 18000,
        image: '',
      },
      {
        name: 'Cheddar Burger',
        description:
          'Pan bimbo brio, 1 carne de res 130 gm, tocineta, cebolla grille, queso mozzarella gratinado bañada en salsa cheddar y verduras frescas.',
        price: '$20.500',
        priceValue: 20500,
        image: '',
      },
      {
        name: 'Chiken Deluxe',
        description:
          'Pan bimbo brio, pollo apanado 130 gm, doble queso cheddar, tocineta, salsa de la casa y verduras frescas.',
        price: '$20.000',
        priceValue: 20000,
        image: '',
      },
      {
        name: "Lala's Burger",
        description:
          'Pan bimbo brio, pollo 130 gm, maíz tierno, queso mozzarella, cebolla, salsa dulce maíz y verduras frescas.',
        price: '$20.000',
        priceValue: 20000,
        image: '',
      },
      {
        name: 'Spicy Burger',
        description:
          'Pan bimbo brio, carne de res ahumada de 130 gm, tocineta, jalapeños, queso mozzarella gratinado, salsa BBQ, verduras y salsa de tomate y mayonesa.',
        price: '$18.000',
        priceValue: 18000,
        image: '',
      },
      {
        name: 'Nena Burger',
        description:
          'Pan Bimbo Brio, 130 gr de carne de res, 130 gr de pollo, queso cheddar, tocineta, tomate, lechuga y salsa tártara.',
        price: '$26.000',
        priceValue: 26000,
        image: '',
      },
    ],
  },

  // ── PERROS CALIENTES ─────────────────────────────────────────────────────────
  {
    id: 'perros',
    title: 'Perros Calientes',
    icon: '🌭',
    items: [
      {
        name: 'Choriperro',
        description:
          'Pan perro bimbo, chorizo mexicano, queso mozzarella y queso cheddar gratinado, tocineta, salsa de tomate y mayonesa.',
        price: '$18.000',
        priceValue: 18000,
        image: '',
      },
      {
        name: 'Super Dog',
        description:
          'Pan perro bimbo, salchicha super perro Zenú, papas chips, tocineta, queso mozzarella gratinado, cebolla grille, maíz tierno y salsas.',
        price: '$16.000',
        priceValue: 16000,
        image: '',
      },
      {
        name: 'Mexicano',
        description:
          'Pan perro bimbo, salchicha super perro Zenú, pico de gallo, salsa guacamole, jalapeños, queso mozzarella gratinado y tocineta crispy.',
        price: '$16.000',
        priceValue: 16000,
        image: '',
      },
      {
        name: 'Columbia',
        description:
          'Pan perro bimbo, salchicha long Zenú, cebolla picada en cuadritos, papas chips, queso costeño.',
        price: '$12.000',
        priceValue: 12000,
        image: '',
      },
    ],
  },

  // ── SALCHIPAPAS ──────────────────────────────────────────────────────────────
  {
    id: 'salchipapas',
    title: 'Salchipapas',
    icon: '🍟',
    items: [
      {
        name: 'Salchi Mixta',
        description:
          '300 grs. de papa francesa, carne y pollo desmechado, salchicha ranchera, queso mozzarella gratinado, salsas al gusto y queso costeño.',
        price: '$22.000',
        priceValue: 22000,
        image: '',
      },
      {
        name: 'Salchi Columbia',
        description:
          '300 grs. de papa francesa, 3 tocinetas crispy, maíz tierno, salchicha ranchera, queso mozzarella gratinado y salsa dulce maíz.',
        price: '$21.000',
        priceValue: 21000,
        image: '',
      },
      {
        name: 'Salchi Costilla',
        description:
          '300 grs. de papa francesa, trocitos de maduro, costilla Coleo, salchicha ranchera, queso mozzarella gratinado, salsa BBQ y dulce maíz.',
        price: '$22.000',
        priceValue: 22000,
        image: '',
      },
      {
        name: 'Salchi Sencilla',
        description:
          '300 grs. de papa francesa, salchicha ranchera, queso mozzarella gratinado, salsas al gusto, queso costeño.',
        price: '$15.000',
        priceValue: 15000,
        image: '',
      },
    ],
  },

  // ── COSTILLAS ────────────────────────────────────────────────────────────────
  {
    id: 'costillas',
    title: 'Costillas',
    icon: '🥩',
    items: [
      {
        name: 'Costillas Artesanales',
        description:
          '250 gr costilla de cerdo artesanal bañadas en salsa BBQ de la casa, porción de papa francesa y ensalada de la casa.',
        price: '$23.000',
        priceValue: 23000,
        image: '',
      },
      {
        name: 'Costillas Ahumadas',
        description:
          '250 gr costilla sin hueso marca Coleo bañadas en salsa BBQ, porción de papa francesa y ensalada de la casa.',
        price: '$20.000',
        priceValue: 20000,
        image: '',
      },
    ],
  },

  // ── DORILOCOS ────────────────────────────────────────────────────────────────
  {
    id: 'dorilocos',
    title: 'Dorilocos',
    icon: '🌽',
    items: [
      {
        name: 'Dorilocos Queso',
        description:
          'Base doritos de queso, carne desmechada, pico de gallo, jalapeños, queso mozzarella gratinado y maíz tierno.',
        price: '$17.000',
        priceValue: 17000,
        image: '',
      },
      {
        name: 'Dorilocos Flamin Hot',
        description:
          'Base doritos Flamin Hot, carne desmechada, pico de gallo, queso mozzarella gratinado y maíz tierno.',
        price: '$17.000',
        priceValue: 17000,
        image: '',
      },
    ],
  },

  // ── PARRILLA ─────────────────────────────────────────────────────────────────
  {
    id: 'parrilla',
    title: 'Parrilla',
    icon: '🔥',
    items: [
      {
        name: 'Lomo de Cerdo',
        description:
          'Corte de 250 gm de lomo de cerdo, sal y pimienta, bañado con 100 gm de queso mozzarella gratinado, porción de papa francesa y ensalada de la casa.',
        price: '$24.000',
        priceValue: 24000,
        image: '',
      },
      {
        name: 'Pechuga Gratinada',
        description:
          'Corte de 250 gm filete de pechuga, 100 gm de queso mozzarella gratinado, papas a la francesa y ensalada de la casa.',
        price: '$24.000',
        priceValue: 24000,
        image: '',
      },
    ],
  },

  // ── MAZORCADAS ───────────────────────────────────────────────────────────────
  {
    id: 'mazorcadas',
    title: 'Mazorcadas',
    icon: '🌽',
    items: [
      {
        name: 'M. Artesanal',
        description:
          'Base de papas chips, carne y pollo desmechado, maíz tierno, queso mozzarella gratinado, salsa dulce maíz.',
        price: '$19.000',
        priceValue: 19000,
        image: '',
      },
      {
        name: 'M. Patacón',
        description:
          'Base de papas chips, carne y pollo desmechado, maíz tierno, salsa dulce maíz y trozos de maduro.',
        price: '$20.000',
        priceValue: 20000,
        image: '',
      },
    ],
  },

  // ── PATACONES ────────────────────────────────────────────────────────────────
  {
    id: 'patacones',
    title: 'Patacones',
    icon: '🍌',
    items: [
      {
        name: 'Patacón Columbia',
        description:
          'Base plátano maduro, lechuga, pico de gallo, carne y pollo desmechado, salsa cheddar, salchicha ranchera y queso costeño.',
        price: '$23.000',
        priceValue: 23000,
        image: '',
      },
      {
        name: 'Patacón Mixto',
        description:
          'Base de plátano maduro, salsa dulce maíz, lechuga, tomate, carne y pollo desmechado, queso mozzarella gratinado y maíz tierno.',
        price: '$22.000',
        priceValue: 22000,
        image: '',
      },
    ],
  },

  // ── PIZZAS PERSONALES ────────────────────────────────────────────────────────
  {
    id: 'pizzas',
    title: 'Pizzas Personales',
    icon: '🍕',
    items: [
      {
        name: 'Pizza Pollo Champiñón',
        description:
          'Base salsa napolitana, champiñones, crema de leche, pollo desmechado, queso mozzarella rayado.',
        price: '$18.000',
        priceValue: 18000,
        image: '',
      },
      {
        name: 'Pizza Colombiana',
        description:
          'Base salsa napolitana, carne desmechada, maíz tierno, queso mozzarella rayado.',
        price: '$18.000',
        priceValue: 18000,
        image: '',
      },
      {
        name: 'Pizza Peperoni',
        description:
          'Base salsa napolitana, queso mozzarella rayado, peperoni, albahaca seca.',
        price: '$16.000',
        priceValue: 16000,
        image: '',
      },
      {
        name: 'Pizza Hawaiana',
        description:
          'Base salsa napolitana, piña en cuadritos, jamón y queso mozzarella rayado.',
        price: '$16.000',
        priceValue: 16000,
        image: '',
      },
    ],
  },

  // ── BEBIDAS ──────────────────────────────────────────────────────────────────
  {
    id: 'bebidas',
    title: 'Bebidas',
    icon: '🥤',
    items: [
      {
        name: 'Jugo Natural en Leche',
        description: 'Jugo natural preparado en leche.',
        price: '$8.500',
        priceValue: 8500,
        image: '',
      },
      {
        name: 'Jugo Natural en Agua',
        description: 'Jugo natural preparado en agua.',
        price: '$6.500',
        priceValue: 6500,
        image: '',
      },
      {
        name: 'Gaseosa Postobón 400ml',
        description: 'Gaseosa Postobón 400ml.',
        price: '$3.800',
        priceValue: 3800,
        image: '',
      },
      {
        name: 'Gaseosa Postobón 350ml',
        description: 'Gaseosa Postobón 350ml.',
        price: '$3.600',
        priceValue: 3600,
        image: '',
      },
      {
        name: 'Jugo Hit 350ml',
        description: 'Jugo Hit 350ml.',
        price: '$3.600',
        priceValue: 3600,
        image: '',
      },
      {
        name: 'Jugo Hit 500ml',
        description: 'Jugo Hit 500ml.',
        price: '$4.000',
        priceValue: 4000,
        image: '',
      },
      {
        name: 'Jugo Hit 1L',
        description: 'Jugo Hit 1 litro.',
        price: '$5.500',
        priceValue: 5500,
        image: '',
      },
      {
        name: 'Gaseosa Postobón 1.5L',
        description: 'Gaseosa Postobón 1.5 litros.',
        price: '$6.500',
        priceValue: 6500,
        image: '',
      },
      {
        name: 'Mr. Tea 500ml',
        description: 'Mr. Tea 500ml.',
        price: '$4.000',
        priceValue: 4000,
        image: '',
      },
      {
        name: 'Bombombum',
        description: 'Bombombum.',
        price: '$3.000',
        priceValue: 3000,
        image: '',
      },
      {
        name: 'Agua 600ml',
        description: 'Agua 600ml.',
        price: '$2.200',
        priceValue: 2200,
        image: '',
      },
      {
        name: 'Agua con Gas 600ml',
        description: 'Agua con gas 600ml.',
        price: '$2.500',
        priceValue: 2500,
        image: '',
      },
    ],
  },
];
