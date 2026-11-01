-- ============================================================
-- Columbia Burger — Catalog Seed
-- Ejecutar una sola vez en la BD de Railway
-- ============================================================

-- ── CATEGORIES ──────────────────────────────────────────────
INSERT INTO categories (name, description, active) VALUES
  ('Hamburguesas',      'Deliciosas hamburguesas artesanales',      true),
  ('Perros Calientes',  'Perros calientes especiales',              true),
  ('Salchipapas',       'Salchipapas con ingredientes especiales',  true),
  ('Costillas',         'Costillas a la parrilla',                  true),
  ('Dorilocos',         'Dorilocos con ingredientes especiales',    true),
  ('Parrilla',          'Platos a la parrilla',                     true),
  ('Mazorcadas',        'Mazorcadas especiales de la casa',         true),
  ('Patacones',         'Patacones con ingredientes especiales',    true),
  ('Pizzas Personales', 'Pizzas personales artesanales',            true),
  ('Bebidas',           'Bebidas frías y naturales',                true);

-- ── PRODUCTS ────────────────────────────────────────────────

-- Hamburguesas
INSERT INTO products (name, description, price, image_url, available, category_id) VALUES
  ('Columbia Burger',
   'Pan bimbo brillo, 2 carnes de res de 100 gm, doble queso cheddar, tocineta, pepinillos, verduras frescas y salsa tomate y mayonesa.',
   23000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775442792/IMG_3944_pujtjt.jpg', true,
   (SELECT id FROM categories WHERE name = 'Hamburguesas')),
  ('Cheese Burger',
   'Pan bimbo brillo, 2 carnes de res de 100 gm, tocineta, doble queso cheddar y salsa miel-mostaza de la casa.',
   20000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775443632/DSC03447_hs6iyv.jpg', true,
   (SELECT id FROM categories WHERE name = 'Hamburguesas')),
  ('Potato Burger',
   'Pan bimbo brillo, 1 carne de res 130 gm, doble queso cheddar, papas a la francesa dentro de la burger, tomate, lechuga crespa y salsa tártara.',
   20000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775442791/IMG_3923_v1mvaj.jpg', true,
   (SELECT id FROM categories WHERE name = 'Hamburguesas')),
  ('Artesanal Burger',
   'Pan bimbo artesanal, 1 carne de res ahumada de 130 gm, tocineta, jamón, queso mozzarella gratinado, papas chips, cebolla grille y verduras frescas.',
   18000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775442791/IMG_3879_jithf6.jpg', true,
   (SELECT id FROM categories WHERE name = 'Hamburguesas')),
  ('Cheddar Burger',
   'Pan bimbo brillo, 1 carne de res 130 gm, tocineta, cebolla grille, queso mozzarella gratinado bañada en salsa cheddar y verduras frescas.',
   20500, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775442792/IMG_3955_f7kkwx.jpg', true,
   (SELECT id FROM categories WHERE name = 'Hamburguesas')),
  ('Chiken Deluxe',
   'Pan bimbo brillo, pollo apanado 130 gm, doble queso cheddar, tocineta, salsa de la casa y verduras frescas.',
   20000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775443632/DSC03363_1_uirzjs.jpg', true,
   (SELECT id FROM categories WHERE name = 'Hamburguesas')),
  ('Lala''s Burger',
   'Pan bimbo brillo, pollo 130 gm, maíz tierno, queso mozzarella, cebolla, salsa dulce maíz y verduras frescas.',
   20000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775443632/DSC03420_g0flrg.jpg', true,
   (SELECT id FROM categories WHERE name = 'Hamburguesas')),
  ('Spicy Burger',
   'Pan bimbo brillo, carne de res ahumada de 130 gm, tocineta, jalapeños, queso mozzarella gratinado, salsa BBQ, verduras y salsa de tomate y mayonesa.',
   18000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775442792/IMG_3927_uaq2ak.jpg', true,
   (SELECT id FROM categories WHERE name = 'Hamburguesas')),
  ('Nena Burger',
   'Pan Bimbo brillo, 130 gr de carne de res, 130 gr de pollo, queso cheddar, tocineta, tomate, lechuga y salsa tártara.',
   26000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775443116/nena_ia_kpgltn.jpg', true,
   (SELECT id FROM categories WHERE name = 'Hamburguesas'));

-- Perros Calientes
INSERT INTO products (name, description, price, image_url, available, category_id) VALUES
  ('Choriperro',
   'Pan perro bimbo, chorizo mexicano, queso mozzarella y queso cheddar gratinado, tocineta, salsa de tomate y mayonesa.',
   18000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775444375/DSC03496_lk5d3e.jpg', true,
   (SELECT id FROM categories WHERE name = 'Perros Calientes')),
  ('Super Dog',
   'Pan perro bimbo, salchicha super perro Zenú, papas chips, tocineta, queso mozzarella gratinado, cebolla grille, maíz tierno y salsas.',
   16000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775442793/IMG_3970_phxgoy.jpg', true,
   (SELECT id FROM categories WHERE name = 'Perros Calientes')),
  ('Mexicano',
   'Pan perro bimbo, salchicha super perro Zenú, pico de gallo, salsa guacamole, jalapeños, queso mozzarella gratinado y tocineta crispy.',
   16000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775442793/IMG_3986_k2ceoq.jpg', true,
   (SELECT id FROM categories WHERE name = 'Perros Calientes')),
  ('Columbia',
   'Pan perro bimbo, salchicha long Zenú, cebolla picada en cuadritos, papas chips, queso costeño.',
   12000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775444376/DSC03522_onfis4.jpg', true,
   (SELECT id FROM categories WHERE name = 'Perros Calientes'));

-- Salchipapas
INSERT INTO products (name, description, price, image_url, available, category_id) VALUES
  ('Salchi Mixta',
   '300 grs. de papa francesa, carne y pollo desmechado, salchicha ranchera, queso mozzarella gratinado, salsas al gusto y queso costeño.',
   22000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775442791/IMG_3897_bgiy5o.jpg', true,
   (SELECT id FROM categories WHERE name = 'Salchipapas')),
  ('Salchi Columbia',
   '300 grs. de papa francesa, 3 tocinetas crispy, maíz tierno, salchicha ranchera, queso mozzarella gratinado y salsa dulce maíz.',
   21000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775442798/IMG_4028_o6lunk.jpg', true,
   (SELECT id FROM categories WHERE name = 'Salchipapas')),
  ('Salchi Costilla',
   '300 grs. de papa francesa, trocitos de maduro, costilla Coleo, salchicha ranchera, queso mozzarella gratinado, salsa BBQ y dulce maíz.',
   22000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775442797/IMG_4024_wxj1n0.jpg', true,
   (SELECT id FROM categories WHERE name = 'Salchipapas')),
  ('Salchi Sencilla',
   '300 grs. de papa francesa, salchicha ranchera, queso mozzarella gratinado, salsas al gusto, queso costeño.',
   15000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775442791/IMG_3908_ceam2a.jpg', true,
   (SELECT id FROM categories WHERE name = 'Salchipapas'));

-- Costillas
INSERT INTO products (name, description, price, image_url, available, category_id) VALUES
  ('Costillas Artesanales',
   '250 gr costilla de cerdo artesanal bañadas en salsa BBQ de la casa, porción de papa francesa y ensalada de la casa.',
   23000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775444375/DSC03395_nwbdp9.jpg', true,
   (SELECT id FROM categories WHERE name = 'Costillas')),
  ('Costillas Ahumadas',
   '250 gr costilla sin hueso marca Coleo bañadas en salsa BBQ, porción de papa francesa y ensalada de la casa.',
   20000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775442794/IMG_3990_fzyykn.jpg', true,
   (SELECT id FROM categories WHERE name = 'Costillas'));

-- Dorilocos
INSERT INTO products (name, description, price, image_url, available, category_id) VALUES
  ('Dorilocos Queso',
   'Base doritos de queso, carne desmechada, pico de gallo, jalapeños, queso mozzarella gratinado y maíz tierno.',
   17000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775442797/IMG_4014_znyl48.jpg', true,
   (SELECT id FROM categories WHERE name = 'Dorilocos')),
  ('Dorilocos Flamin Hot',
   'Base doritos Flamin Hot, carne desmechada, pico de gallo, queso mozzarella gratinado y maíz tierno.',
   17000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775442796/IMG_4009_qoavok.jpg', true,
   (SELECT id FROM categories WHERE name = 'Dorilocos'));

-- Parrilla
INSERT INTO products (name, description, price, image_url, available, category_id) VALUES
  ('Lomo de Cerdo',
   'Corte de 250 gm de lomo de cerdo, sal y pimienta, bañado con 100 gm de queso mozzarella gratinado, porción de papa francesa y ensalada de la casa.',
   24000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775442795/IMG_3998_otpghc.jpg', true,
   (SELECT id FROM categories WHERE name = 'Parrilla')),
  ('Pechuga Gratinada',
   'Corte de 250 gm filete de pechuga, 100 gm de queso mozzarella gratinado, papas a la francesa y ensalada de la casa.',
   24000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775444375/DSC03467_of1ehf.jpg', true,
   (SELECT id FROM categories WHERE name = 'Parrilla'));

-- Mazorcadas
INSERT INTO products (name, description, price, image_url, available, category_id) VALUES
  ('M. Artesanal',
   'Base de papas chips, carne y pollo desmechado, maíz tierno, queso mozzarella gratinado, salsa dulce maíz.',
   19000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775442795/IMG_3995_qkx91g.jpg', true,
   (SELECT id FROM categories WHERE name = 'Mazorcadas')),
  ('M. Patacón',
   'Base de papas chips, carne y pollo desmechado, maíz tierno, salsa dulce maíz y trozos de maduro.',
   20000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775442795/IMG_4001_rzyjnw.jpg', true,
   (SELECT id FROM categories WHERE name = 'Mazorcadas'));

-- Patacones
INSERT INTO products (name, description, price, image_url, available, category_id) VALUES
  ('Patacón Columbia',
   'Base plátano maduro, lechuga, pico de gallo, carne y pollo desmechado, salsa cheddar, salchicha ranchera y queso costeño.',
   23000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775444375/DSC03320_eohrti.jpg', true,
   (SELECT id FROM categories WHERE name = 'Patacones')),
  ('Patacón Mixto',
   'Base de plátano maduro, salsa dulce maíz, lechuga, tomate, carne y pollo desmechado, queso mozzarella gratinado y maíz tierno.',
   22000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775444375/DSC03334_igbcji.jpg', true,
   (SELECT id FROM categories WHERE name = 'Patacones'));

-- Pizzas Personales
INSERT INTO products (name, description, price, image_url, available, category_id) VALUES
  ('Pizza Pollo Champiñón',
   'Base salsa napolitana, champiñones, crema de leche, pollo desmechado, queso mozzarella rayado.',
   18000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775444376/DSC03549_oysllb.jpg', true,
   (SELECT id FROM categories WHERE name = 'Pizzas Personales')),
  ('Pizza Colombiana',
   'Base salsa napolitana, carne desmechada, maíz tierno, queso mozzarella rayado.',
   18000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775442799/IMG_4039_cnv5ox.jpg', true,
   (SELECT id FROM categories WHERE name = 'Pizzas Personales')),
  ('Pizza Peperoni',
   'Base salsa napolitana, queso mozzarella rayado, peperoni, albahaca seca.',
   16000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775442797/IMG_4017_lbtf3w.jpg', true,
   (SELECT id FROM categories WHERE name = 'Pizzas Personales')),
  ('Pizza Hawaiana',
   'Base salsa napolitana, piña en cuadritos, jamón y queso mozzarella rayado.',
   16000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775442798/IMG_4032_rl7p9e.jpg', true,
   (SELECT id FROM categories WHERE name = 'Pizzas Personales'));

-- Bebidas
INSERT INTO products (name, description, price, image_url, available, category_id) VALUES
  ('Jugo Natural',
   'Jugo natural preparado al gusto. Elige tu sabor favorito: Mango, Maracuyá, Mora, Coco, Lulo, Fresa, Frutos Rojos, Uva, Feijoa, Guanábana, Maracumango, Frutos Amarillos.',
   7500, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775437067/jugos-leche_lpigpj.jpg', true,
   (SELECT id FROM categories WHERE name = 'Bebidas')),
  ('Gaseosa Postobón 400ml',
   'Gaseosa Postobón 400ml. Sabores: Manzana, Colombiana, Pepsi, Seven Up, Uva, Naranja, Canada Dry.',
   3800, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775437067/postobon_wbvwea.png', true,
   (SELECT id FROM categories WHERE name = 'Bebidas')),
  ('Jugo Hit 500ml',
   'Jugo Hit 500ml.',
   4000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775437067/jugos_hit_ff9mfp.webp', true,
   (SELECT id FROM categories WHERE name = 'Bebidas')),
  ('Jugo Hit 1L',
   'Jugo Hit 1 litro.',
   5500, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775437162/hit_litro_yt1lor.jpg', true,
   (SELECT id FROM categories WHERE name = 'Bebidas')),
  ('Gaseosa Postobón 1.5L',
   'Gaseosa Postobón 1.5 litros. Sabores: Manzana, Colombiana, Pepsi, Seven Up, Uva, Naranja.',
   6500, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775437393/post_1.5_oeqsat.jpg', true,
   (SELECT id FROM categories WHERE name = 'Bebidas')),
  ('Mr. Tea 500ml',
   'Mr. Tea 500ml. Sabores: Limón, Durazno.',
   4000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775437393/mr_tea_mtu45o.jpg', true,
   (SELECT id FROM categories WHERE name = 'Bebidas')),
  ('Bombombum',
   'Bombombum.',
   3000, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775437425/bombom_cvf4nh.jpg', true,
   (SELECT id FROM categories WHERE name = 'Bebidas')),
  ('Agua 600ml',
   'Agua 600ml.',
   2200, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775437393/Agua-Normal-600-ml-973621_a_xyr5dl.webp', true,
   (SELECT id FROM categories WHERE name = 'Bebidas')),
  ('Agua con Gas 600ml',
   'Agua con gas 600ml.',
   2500, 'https://res.cloudinary.com/diaymnuut/image/upload/v1775437393/agua_gas_u9hzab.jpg', true,
   (SELECT id FROM categories WHERE name = 'Bebidas'));

-- ── SEASONAL SPECIAL ────────────────────────────────────────
INSERT INTO seasonal_specials (name, tagline, description, price, image_url, active, season_start, season_end, created_at) VALUES
  ('Nena Burger',
   'Tu nuevo gusto culposo',
   'Pan Bimbo brillo, 130 gr de carne de res, 130 gr de pollo, queso cheddar, tocineta, tomate, lechuga y salsa tártara.',
   26000,
   'https://res.cloudinary.com/diaymnuut/image/upload/v1775443116/nena_ia_kpgltn.jpg',
   true,
   CURRENT_DATE,
   CURRENT_DATE + INTERVAL '1 month',
   NOW());
