-- Initial schema for SKNbridgetrade (Supabase / PostgreSQL)
-- Generated: 2025-10-25

-- NOTES:
-- 1) Supabase provides auth.users; use that as the source-of-truth for authentication.
-- 2) Keep profile/link tables in `public` schema for easy queries from the frontend.
-- 3) Use UUIDs for cross-service references when possible.

-- Enable uuid-ossp if not present (Supabase usually has gen_random_uuid via pgcrypto):
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===== profiles (link to auth.users) =====
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  email text,
  avatar_url text,
  role text DEFAULT 'buyer', -- 'buyer' | 'seller' | 'admin'
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles((lower(email))); 

-- Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ===== vendors =====
CREATE TABLE IF NOT EXISTS public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  logo_url text,
  cover_url text,
  website text,
  location text,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS vendors_slug_uq ON public.vendors(slug);
CREATE INDEX IF NOT EXISTS vendors_owner_idx ON public.vendors(owner_id);
CREATE TRIGGER vendors_set_updated_at
BEFORE UPDATE ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ===== categories (hierarchical) =====
CREATE TABLE IF NOT EXISTS public.categories (
  id serial PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL,
  parent_id int REFERENCES public.categories(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_uq ON public.categories(slug);

-- ===== products =====
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  category_id int REFERENCES public.categories(id) ON DELETE SET NULL,
  base_price numeric(12,2) DEFAULT 0.00,
  currency text DEFAULT 'USD',
  is_published boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_vendor_uq ON public.products(slug, vendor_id);
CREATE INDEX IF NOT EXISTS products_vendor_idx ON public.products(vendor_id);
CREATE TRIGGER products_set_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ===== product_variants =====
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  sku text,
  price numeric(12,2) NOT NULL,
  compare_at numeric(12,2),
  stock integer DEFAULT 0,
  is_active boolean DEFAULT true,
  attributes jsonb DEFAULT '{}'::jsonb, -- e.g. {"color":"red","size":"M"}
  images jsonb DEFAULT '[]'::jsonb, -- array of image URLs
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS product_variants_sku_uq ON public.product_variants(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS product_variants_product_idx ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS product_variants_attributes_gin ON public.product_variants USING gin (attributes jsonb_path_ops);
CREATE TRIGGER product_variants_set_updated_at
BEFORE UPDATE ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ===== product_images (optional) =====
CREATE TABLE IF NOT EXISTS public.product_images (
  id serial PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text,
  position int DEFAULT 0
);
CREATE INDEX IF NOT EXISTS product_images_product_idx ON public.product_images(product_id);

-- ===== carts (cart items for users) =====
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  added_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cart_items_user_idx ON public.cart_items(user_id);

-- ===== orders =====
CREATE TYPE IF NOT EXISTS public.order_status AS ENUM ('pending', 'paid', 'processing', 'fulfilled', 'cancelled', 'refunded');

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  total_amount numeric(12,2) NOT NULL DEFAULT 0.00,
  currency text DEFAULT 'USD',
  status public.order_status DEFAULT 'pending',
  shipping_address jsonb,
  billing_address jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_user_idx ON public.orders(user_id);
CREATE TRIGGER orders_set_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ===== order_items =====
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0.00,
  total_price numeric(12,2) NOT NULL DEFAULT 0.00,
  metadata jsonb DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_vendor_idx ON public.order_items(vendor_id);

-- ===== payments/transactions =====
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  provider text, -- e.g. 'paypal', 'stripe'
  provider_payment_id text,
  amount numeric(12,2) NOT NULL DEFAULT 0.00,
  currency text DEFAULT 'USD',
  status text,
  raw_response jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payments_order_idx ON public.payments(order_id);

-- ===== reviews =====
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  rating smallint CHECK (rating >= 1 AND rating <= 5),
  title text,
  body text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reviews_product_idx ON public.reviews(product_id);

-- ===== simple ACL helpers (views) =====
-- View listing vendor products with vendor info
CREATE OR REPLACE VIEW public.vendor_products AS
SELECT p.*, v.name AS vendor_name, v.slug AS vendor_slug
FROM public.products p
LEFT JOIN public.vendors v ON p.vendor_id = v.id;

-- ===== helper functions and triggers to keep integrity =====
-- Ensure order total is calculated (simple trigger example)
CREATE OR REPLACE FUNCTION public.recalculate_order_total(order_uuid uuid)
RETURNS void AS $$
DECLARE
  sum_total numeric(12,2);
BEGIN
  SELECT COALESCE(SUM(total_price), 0) INTO sum_total FROM public.order_items WHERE order_id = order_uuid;
  UPDATE public.orders SET total_amount = sum_total WHERE id = order_uuid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.order_items_after_change()
RETURNS trigger AS $$
BEGIN
  PERFORM public.recalculate_order_total(COALESCE(NEW.order_id, OLD.order_id));
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to order_items
DROP TRIGGER IF EXISTS order_items_after_change ON public.order_items;
CREATE TRIGGER order_items_after_change
AFTER INSERT OR UPDATE OR DELETE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.order_items_after_change();

-- ===== full text search index example (products) =====
ALTER TABLE public.products ALTER COLUMN description SET DATA TYPE text;
CREATE INDEX IF NOT EXISTS products_search_idx ON public.products USING gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));

-- ===== maintenance recommended indexes =====
-- Index on product title for quick lookups
CREATE INDEX IF NOT EXISTS products_title_idx ON public.products (lower(title));

-- End of migration

-- Optional: You may separate this into smaller migrations. Keep `normalize_variants.sql` present for any refactors.
