-- Migration to align the schema with application requirements
-- Generated: 2025-10-29

DROP VIEW IF EXISTS public.vendor_products;

-- 1. Add missing columns to the 'vendors' table
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS store_name text,
  ADD COLUMN IF NOT EXISTS rating numeric(2,1) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS total_products integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS featured_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

-- 2. Change price columns to store integers (cents) to avoid floating-point issues
-- Note: This is a destructive change and requires data migration if the tables have data.
-- We assume for this migration that the tables can be altered directly.

-- Alter 'products' table
ALTER TABLE public.products
  ALTER COLUMN base_price TYPE integer USING (base_price * 100)::integer;

-- Alter 'product_variants' table
ALTER TABLE public.product_variants
  ALTER COLUMN price TYPE integer USING (price * 100)::integer,
  ALTER COLUMN compare_at TYPE integer USING (compare_at * 100)::integer;

-- Alter 'order_items' table
ALTER TABLE public.order_items
  ALTER COLUMN unit_price TYPE integer USING (unit_price * 100)::integer,
  ALTER COLUMN total_price TYPE integer USING (total_price * 100)::integer;

-- Alter 'orders' table
ALTER TABLE public.orders
  ALTER COLUMN total_amount TYPE integer USING (total_amount * 100)::integer;

-- Alter 'payments' table
ALTER TABLE public.payments
  ALTER COLUMN amount TYPE integer USING (amount * 100)::integer;


-- 3. Recalculate order total function to work with integers
CREATE OR REPLACE FUNCTION public.recalculate_order_total(order_uuid uuid)
RETURNS void AS $$
DECLARE
  sum_total integer;
BEGIN
  SELECT COALESCE(SUM(total_price), 0) INTO sum_total FROM public.order_items WHERE order_id = order_uuid;
  UPDATE public.orders SET total_amount = sum_total WHERE id = order_uuid;
END;
$$ LANGUAGE plpgsql;

-- Recreate the view that was dropped
CREATE OR REPLACE VIEW public.vendor_products AS
SELECT p.*, v.name AS vendor_name, v.slug AS vendor_slug
FROM public.products p
LEFT JOIN public.vendors v ON p.vendor_id = v.id;


-- End of migration
