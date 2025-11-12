-- This script is generated from seed_updated.js and contains data for seeding the database.
-- Note: Creating authentication users (auth.users) via SQL is not straightforward
-- as it involves password hashing and other security considerations.
-- This script primarily focuses on the public tables.

-- To execute this script, you can use a SQL client connected to your Supabase database.

BEGIN;

-- Profiles (assuming auth.users are created separately)
-- Replace with actual user UUIDs if you have them.
-- These UUIDs are placeholders.
INSERT INTO public.profiles (id, email, full_name, role) VALUES
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'seller1@example.com', 'John Doe', 'seller'),
('b2c3d4e5-f6a7-8901-2345-67890abcdef1', 'seller2@example.com', 'Jane Smith', 'seller'),
('c3d4e5f6-a7b8-9012-3456-7890abcdef12', 'buyer1@example.com', 'Peter Jones', 'buyer'),
('d4e5f6a7-b8c9-0123-4567-890abcdef123', 'buyer2@example.com', 'Mary Williams', 'buyer'),
('e5f6a7b8-c9d0-1234-5678-90abcdef1234', 'buyer3@example.com', 'David Brown', 'buyer');

-- Vendors
-- Assumes the first two users are sellers and will be the owners of the vendors.
INSERT INTO public.vendors (owner_id, business_name, slug, description, status, verification_status, kyc_verified, kyb_verified, business_type, tax_id, commission_rate, minimum_payout, payout_method, onboarding_step, onboarding_completed) VALUES
((SELECT id FROM public.profiles WHERE email = 'seller1@example.com'), 'Johns General Store', 'johns-general-store', 'A little bit of everything', 'active', 'verified', true, true, 'sole_proprietorship', '123-45-6789', 10.00, 100.00, 'bank_transfer', 'completed', true),
((SELECT id FROM public.profiles WHERE email = 'seller2@example.com'), 'Janes Gadgets', 'janes-gadgets', 'The latest and greatest gadgets', 'active', 'verified', true, true, 'llc', '987-65-4321', 12.00, 50.00, 'paypal', 'completed', true);
WITH inserted_products AS (
INSERT INTO public.products (
  vendor_id, title, slug, description, base_price, currency, is_published, has_variants,
  stock_tracking, low_stock_alert, shipping_class, shipping_weight, category_id, tags,
  images, gallery_images, status
)
VALUES
(
  (SELECT id FROM public.vendors WHERE slug = 'janes-gadgets'),
  'Laptop', 'laptop', 'A powerful laptop', 120000, 'USD', true, true, true, 5, 'large', 2.5,
  (SELECT id FROM public.categories WHERE slug = 'electronics'),
  ARRAY['laptop','computer','electronics']::text[],
  ARRAY['https://supabase.co/storage/v1/object/public/listings-images/laptop.jpg']::text[],
  ARRAY['https://supabase.co/storage/v1/object/public/listings-images/laptop-1.jpg','https://supabase.co/storage/v1/object/public/listings-images/laptop-2.jpg']::text[],
  'active'
),
(
  (SELECT id FROM public.vendors WHERE slug = 'johns-general-store'),
  'T-Shirt', 't-shirt', 'A comfortable t-shirt', 2500, 'USD', true, true, true, 10, 'small', 0.2,
  (SELECT id FROM public.categories WHERE slug = 'clothing'),
  ARRAY['t-shirt','clothing','apparel']::text[],
  ARRAY['https://supabase.co/storage/v1/object/public/listings-images/t-shirt.jpg']::text[],
  ARRAY['https://supabase.co/storage/v1/object/public/listings-images/t-shirt-1.jpg','https://supabase.co/storage/v1/object/public/listings-images/t-shirt-2.jpg']::text[],
  'active'
),
(
  (SELECT id FROM public.vendors WHERE slug = 'johns-general-store'),
  'Coffee Mug', 'coffee-mug', 'A mug for your coffee', 1500, 'USD', true, true, true, 15, 'small', 0.5,
  (SELECT id FROM public.categories WHERE slug = 'home-goods'),
  ARRAY['mug','coffee','kitchen']::text[],
  ARRAY['https://supabase.co/storage/v1/object/public/listings-images/coffee-mug.jpg']::text[],
  ARRAY['https://supabase.co/storage/v1/object/public/listings-images/coffee-mug-1.jpg','https://supabase.co/storage/v1/object/public/listings-images/coffee-mug-2.jpg']::text[],
  'active'
),
(
  (SELECT id FROM public.vendors WHERE slug = 'janes-gadgets'),
  'Smartphone', 'smartphone', 'A smart smartphone', 80000, 'USD', true, true, true, 5, 'small', 0.3,
  (SELECT id FROM public.categories WHERE slug = 'electronics'),
  ARRAY['phone','smartphone','electronics']::text[],
  ARRAY['https://supabase.co/storage/v1/object/public/listings-images/smartphone.jpg']::text[],
  ARRAY['https://supabase.co/storage/v1/object/public/listings-images/smartphone-1.jpg','https://supabase.co/storage/v1/object/public/listings-images/smartphone-2.jpg']::text[],
  'active'
),
(
  (SELECT id FROM public.vendors WHERE slug = 'johns-general-store'),
  'Jeans', 'jeans', 'A pair of jeans', 6000, 'USD', true, true, true, 10, 'small', 0.8,
  (SELECT id FROM public.categories WHERE slug = 'clothing'),
  ARRAY['jeans','clothing','apparel']::text[],
  ARRAY['https://supabase.co/storage/v1/object/public/listings-images/jeans.jpg']::text[],
  ARRAY['https://supabase.co/storage/v1/object/public/listings-images/jeans-1.jpg','https://supabase.co/storage/v1/object/public/listings-images/jeans-2.jpg']::text[],
  'active'
)
RETURNING id, slug;

-- Product Variants
-- NOTE: the previous implementation referenced the CTE `inserted_products` which
-- only exists for the immediate statement that defines the CTE. Running the
-- variants block on its own (or in some runners that split statements) caused
-- "relation \"inserted_products\" does not exist". Use `public.products` so
-- this block can be run independently as long as products were inserted earlier.
INSERT INTO public.product_variants (product_id, name, sku, price, stock_level)
SELECT
  p.id, v.name, v.sku, v.price, v.stock_level
FROM public.products p
JOIN (
  VALUES
    ('laptop', '8GB RAM / 256GB SSD', 'LAP-8-256', 120000, 10),
    ('laptop', '16GB RAM / 512GB SSD', 'LAP-16-512', 150000, 5),
    ('t-shirt', 'Small / Black', 'TS-BLK-S', 2500, 20),
    ('t-shirt', 'Medium / Black', 'TS-BLK-M', 2500, 15),
    ('t-shirt', 'Large / Black', 'TS-BLK-L', 2500, 15),
    ('coffee-mug', 'Classic / White', 'MUG-WHT', 1500, 25),
    ('coffee-mug', 'Classic / Black', 'MUG-BLK', 1500, 25),
    ('smartphone', '128GB / Black', 'PHN-128-BLK', 80000, 8),
    ('smartphone', '256GB / Black', 'PHN-256-BLK', 90000, 5),
    ('jeans', '30x32 / Blue', 'JNS-30-32-BLU', 6000, 12),
    ('jeans', '32x32 / Blue', 'JNS-32-32-BLU', 6000, 15),
    ('jeans', '34x32 / Blue', 'JNS-34-32-BLU', 6000, 10)
) AS v(product_slug, name, sku, price, stock_level) ON p.slug = v.product_slug
-- Optional: limit to the vendor we just created (safer if slugs could collide)
WHERE p.vendor_id = (SELECT id FROM public.vendors WHERE slug = 'johns-general-store');

-- Variant Options
-- Like Product Variants above, don't depend on the CTE `inserted_products` so
-- this block can be executed independently (provided products exist).
INSERT INTO public.variant_options (product_id, name, type, required, options)
SELECT
  p.id, vo.name, vo.type, vo.required, vo.options::jsonb
FROM public.products p
JOIN (
  VALUES
    ('laptop', 'Configuration', 'select', true, '{"choices": ["8GB RAM / 256GB SSD", "16GB RAM / 512GB SSD"]}'),
    ('t-shirt', 'Size', 'select', true, '{"choices": ["Small", "Medium", "Large"]}'),
    ('t-shirt', 'Color', 'select', true, '{"choices": ["Black", "White", "Gray"]}'),
    ('coffee-mug', 'Color', 'select', true, '{"choices": ["White", "Black"]}'),
    ('smartphone', 'Storage', 'select', true, '{"choices": ["128GB", "256GB"]}'),
    ('smartphone', 'Color', 'select', true, '{"choices": ["Black", "Silver"]}'),
    ('jeans', 'Size', 'select', true, '{"choices": ["30x32", "32x32", "34x32"]}'),
    ('jeans', 'Color', 'select', true, '{"choices": ["Blue", "Black"]}')
) AS vo(product_slug, name, type, required, options) ON p.slug = vo.product_slug
WHERE p.vendor_id = (SELECT id FROM public.vendors WHERE slug = 'johns-general-store','janes-gadgets');

-- Sample Orders
-- Assumes the third user is a buyer.
WITH inserted_order AS (
  INSERT INTO public.orders (user_id, vendor_id, status, total_amount, payment_status, payment_method, payment_intent_id, fulfillment_status, tracking_number, shipping_method, shipping_address, billing_address)
  VALUES
  ((SELECT id FROM public.profiles WHERE email = 'buyer1@example.com'), (SELECT id FROM public.vendors WHERE slug = 'johns-general-store'), 'completed', 150000, 'paid', 'credit_card', 'pi_sample_1', 'delivered', '1Z999AA1234567890', 'express',
  '{"name": "Peter Jones", "address1": "123 Main St", "city": "Anytown", "state": "CA", "postal_code": "12345", "country": "US"}',
  '{"name": "Peter Jones", "address1": "123 Main St", "city": "Anytown", "state": "CA", "postal_code": "12345", "country": "US"}')
  RETURNING id
)
-- Order Items
-- For simplicity, the order item is for the first product (Laptop).
INSERT INTO public.order_items (order_id, product_id, quantity, unit_price)
SELECT
  o.id,
  (SELECT id FROM public.products WHERE slug = 'laptop'),
  1,
  150000
FROM inserted_order o;

COMMIT;
