-- ============================================================
-- Row Level Security — cb-api-business (schema: business)
-- Ejecutar en Railway > Database > Query
-- ============================================================

-- 1. Habilitar RLS en las tablas sensibles
ALTER TABLE business.customers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE business.orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE business.order_items ENABLE ROW LEVEL SECURITY;

-- 2. El usuario de la aplicación (PGUSER) hace BYPASS para que
--    las queries del backend no se vean afectadas. La protección
--    aplica a cualquier otro usuario que conecte directamente.
DO $$
DECLARE
  app_user text := current_user;
BEGIN
  EXECUTE format('ALTER ROLE %I BYPASSRLS', app_user);
END;
$$;

-- 3. Políticas: ADMIN / KITCHEN / DELIVERY ven todo;
--    CUSTOMER solo ve sus propias filas.

-- customers
DROP POLICY IF EXISTS rls_customers ON business.customers;
CREATE POLICY rls_customers ON business.customers
    FOR ALL
    USING (
        current_setting('app.user_role', true) IN ('ADMIN', 'KITCHEN', 'DELIVERY')
        OR (
            nullif(current_setting('app.user_id', true), '') IS NOT NULL
            AND whatsapp = current_setting('app.user_id', true)
        )
    );

-- orders
DROP POLICY IF EXISTS rls_orders ON business.orders;
CREATE POLICY rls_orders ON business.orders
    FOR ALL
    USING (
        current_setting('app.user_role', true) IN ('ADMIN', 'KITCHEN', 'DELIVERY')
        OR EXISTS (
            SELECT 1 FROM business.customers c
            WHERE  c.id = customer_id
            AND    nullif(current_setting('app.user_id', true), '') IS NOT NULL
            AND    c.whatsapp = current_setting('app.user_id', true)
        )
    );

-- order_items (hereda visibilidad del pedido al que pertenece)
DROP POLICY IF EXISTS rls_order_items ON business.order_items;
CREATE POLICY rls_order_items ON business.order_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM business.orders o
            JOIN   business.customers c ON c.id = o.customer_id
            WHERE  o.id = order_id
            AND (
                current_setting('app.user_role', true) IN ('ADMIN', 'KITCHEN', 'DELIVERY')
                OR (
                    nullif(current_setting('app.user_id', true), '') IS NOT NULL
                    AND c.whatsapp = current_setting('app.user_id', true)
                )
            )
        )
    );
