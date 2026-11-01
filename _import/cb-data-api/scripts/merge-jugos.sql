-- ============================================================
-- Fusionar "Jugo Natural en Leche" y "Jugo Natural en Agua"
-- en un solo producto "Jugo Natural"
-- Solo ejecutar si la BD fue cargada con una versión anterior
-- ============================================================

UPDATE products
SET
  name        = 'Jugo Natural',
  description = 'Jugo natural preparado al gusto. Elige tu sabor favorito: Mango, Maracuyá, Mora, Coco, Lulo, Fresa, Frutos Rojos, Uva, Feijoa, Guanábana, Maracumango, Frutos Amarillos.',
  price       = 7500
WHERE name = 'Jugo Natural en Leche';

UPDATE products SET available = false WHERE name = 'Jugo Natural en Agua';

DELETE FROM product_flavors
WHERE product_id IN (
  SELECT id FROM products WHERE name IN ('Jugo Natural', 'Jugo Natural en Agua')
);
