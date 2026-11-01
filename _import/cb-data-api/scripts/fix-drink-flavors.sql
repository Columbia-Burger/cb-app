-- ============================================================
-- Corrección de sabores de bebidas
-- ============================================================

INSERT INTO flavors (name, active)
SELECT 'Tropical', true WHERE NOT EXISTS (SELECT 1 FROM flavors WHERE name = 'Tropical');

INSERT INTO flavors (name, active)
SELECT 'Naranja Piña', true WHERE NOT EXISTS (SELECT 1 FROM flavors WHERE name = 'Naranja Piña');

-- Jugo Hit: reemplazar sabores incorrectos
DELETE FROM product_flavors
WHERE product_id IN (SELECT id FROM products WHERE name IN ('Jugo Hit 500ml', 'Jugo Hit 1L'));

INSERT INTO product_flavors (product_id, flavor_id)
SELECT p.id, f.id FROM products p, flavors f
WHERE p.name IN ('Jugo Hit 500ml', 'Jugo Hit 1L')
  AND f.name IN ('Mango', 'Mora', 'Lulo', 'Tropical', 'Naranja Piña');

-- Jugo Natural: restaurar sabores de fruta
DELETE FROM product_flavors
WHERE product_id = (SELECT id FROM products WHERE name = 'Jugo Natural');

INSERT INTO product_flavors (product_id, flavor_id)
SELECT p.id, f.id FROM products p, flavors f
WHERE p.name = 'Jugo Natural'
  AND f.name IN ('Mango','Maracuyá','Mora','Coco','Lulo','Fresa','Frutos Rojos','Uva','Feijoa','Guanábana','Maracumango','Frutos Amarillos');
