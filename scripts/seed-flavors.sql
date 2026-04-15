-- ============================================================
-- Columbia Burger — Seed de Sabores
-- Ejecutar después de seed-catalog.sql
-- ============================================================

-- ── FLAVORS ─────────────────────────────────────────────────
INSERT INTO flavors (name, active) VALUES
  ('Mango',            true),
  ('Maracuyá',         true),
  ('Mora',             true),
  ('Coco',             true),
  ('Lulo',             true),
  ('Fresa',            true),
  ('Frutos Rojos',     true),
  ('Uva',              true),
  ('Feijoa',           true),
  ('Guanábana',        true),
  ('Maracumango',      true),
  ('Frutos Amarillos', true),
  ('Manzana',          true),
  ('Colombiana',       true),
  ('Pepsi',            true),
  ('Seven Up',         true),
  ('Naranja',          true),
  ('Canada Dry',       true),
  ('Limón',            true),
  ('Durazno',          true);

-- ── PRODUCT_FLAVORS ─────────────────────────────────────────
-- Jugo Natural en Leche → todos los jugos naturales
INSERT INTO product_flavors (product_id, flavor_id)
SELECT p.id, f.id
FROM products p, flavors f
WHERE p.name = 'Jugo Natural en Leche'
  AND f.name IN ('Mango','Maracuyá','Mora','Coco','Lulo','Fresa','Frutos Rojos','Uva','Feijoa','Guanábana','Maracumango','Frutos Amarillos');

-- Jugo Natural en Agua → mismos sabores
INSERT INTO product_flavors (product_id, flavor_id)
SELECT p.id, f.id
FROM products p, flavors f
WHERE p.name = 'Jugo Natural en Agua'
  AND f.name IN ('Mango','Maracuyá','Mora','Coco','Lulo','Fresa','Frutos Rojos','Uva','Feijoa','Guanábana','Maracumango','Frutos Amarillos');

-- Gaseosa Postobón 400ml
INSERT INTO product_flavors (product_id, flavor_id)
SELECT p.id, f.id
FROM products p, flavors f
WHERE p.name = 'Gaseosa Postobón 400ml'
  AND f.name IN ('Manzana','Colombiana','Pepsi','Seven Up','Uva','Naranja','Canada Dry');

-- Jugo Hit 500ml
INSERT INTO product_flavors (product_id, flavor_id)
SELECT p.id, f.id
FROM products p, flavors f
WHERE p.name = 'Jugo Hit 500ml'
  AND f.name IN ('Manzana','Colombiana','Pepsi','Seven Up');

-- Jugo Hit 1L
INSERT INTO product_flavors (product_id, flavor_id)
SELECT p.id, f.id
FROM products p, flavors f
WHERE p.name = 'Jugo Hit 1L'
  AND f.name IN ('Manzana','Colombiana','Pepsi','Seven Up');

-- Gaseosa Postobón 1.5L
INSERT INTO product_flavors (product_id, flavor_id)
SELECT p.id, f.id
FROM products p, flavors f
WHERE p.name = 'Gaseosa Postobón 1.5L'
  AND f.name IN ('Manzana','Colombiana','Pepsi','Seven Up','Uva','Naranja');

-- Mr. Tea 500ml
INSERT INTO product_flavors (product_id, flavor_id)
SELECT p.id, f.id
FROM products p, flavors f
WHERE p.name = 'Mr. Tea 500ml'
  AND f.name IN ('Limón','Durazno');
