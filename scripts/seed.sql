-- Dummy Data Seed Script for SKNbridgetrade
--
-- This script seeds the database with dummy data for development and testing.
-- It includes creation of auth users, profiles, vendors, categories, and products.
--
-- NOTE: This script uses hardcoded UUIDs and is intended for a clean database.
-- Running it on a database with existing data may cause conflicts.

-- Enable pgcrypto for password encryption if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===== Auth Users =====
-- Create corresponding authentication users in Supabase Auth.
-- Passwords are 'password123' for all users.
INSERT INTO auth.users (id, email, encrypted_password, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, email_confirmed_at)
VALUES
  ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'seller1@example.com', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now(), now()),
  ('b2c3d4e5-f6a7-8901-2345-67890abcdef0', 'seller2@example.com', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now(), now()),
  ('c3d4e5f6-a7b8-9012-3456-7890abcdef01', 'buyer1@example.com', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now(), now()),
  ('d4e5f6a7-b8c9-0123-4567-890abcdef012', 'buyer2@example.com', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now(), now()),
  ('e5f6a7b8-c9d0-1234-5678-90abcdef0123', 'buyer3@example.com', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- ===== Auth Identities =====
-- Link the users to the email provider.
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'seller1@example.com', format('{"sub":"%s","email":"%s"}', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'seller1@example.com')::jsonb, 'email', now(), now(), now()),
  (gen_random_uuid(), 'b2c3d4e5-f6a7-8901-2345-67890abcdef0', 'seller2@example.com', format('{"sub":"%s","email":"%s"}', 'b2c3d4e5-f6a7-8901-2345-67890abcdef0', 'seller2@example.com')::jsonb, 'email', now(), now(), now()),
  (gen_random_uuid(), 'c3d4e5f6-a7b8-9012-3456-7890abcdef01', 'buyer1@example.com', format('{"sub":"%s","email":"%s"}', 'c3d4e5f6-a7b8-9012-3456-7890abcdef01', 'buyer1@example.com')::jsonb, 'email', now(), now(), now()),
  (gen_random_uuid(), 'd4e5f6a7-b8c9-0123-4567-890abcdef012', 'buyer2@example.com', format('{"sub":"%s","email":"%s"}', 'd4e5f6a7-b8c9-0123-4567-890abcdef012', 'buyer2@example.com')::jsonb, 'email', now(), now(), now()),
  (gen_random_uuid(), 'e5f6a7b8-c9d0-1234-5678-90abcdef0123', 'buyer3@example.com', format('{"sub":"%s","email":"%s"}', 'e5f6a7b8-c9d0-1234-5678-90abcdef0123', 'buyer3@example.com')::jsonb, 'email', now(), now(), now())
ON CONFLICT DO NOTHING;


-- ===== Profiles =====
-- Make sure the IDs match the users you created in Supabase Auth.
INSERT INTO public.profiles (id, email, full_name, role)
VALUES
  ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'seller1@example.com', 'John Doe', 'seller'),
  ('b2c3d4e5-f6a7-8901-2345-67890abcdef0', 'seller2@example.com', 'Jane Smith', 'seller'),
  ('c3d4e5f6-a7b8-9012-3456-7890abcdef01', 'buyer1@example.com', 'Peter Jones', 'buyer'),
  ('d4e5f6a7-b8c9-0123-4567-890abcdef012', 'buyer2@example.com', 'Mary Williams', 'buyer'),
  ('e5f6a7b8-c9d0-1234-5678-90abcdef0123', 'buyer3@example.com', 'David Brown', 'buyer')
ON CONFLICT (id) DO NOTHING;

-- ===== Vendors =====
INSERT INTO public.vendors (id, owner_id, name, slug, description)
VALUES
  ('f6a7b8c9-d0e1-2345-6789-0abcdef01234', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Johns General Store', 'johns-general-store', 'A little bit of everything'),
  ('a7b8c9d0-e1f2-3456-7890-bcdef0123456', 'b2c3d4e5-f6a7-8901-2345-67890abcdef0', 'Janes Gadgets', 'janes-gadgets', 'The latest and greatest gadgets')
ON CONFLICT (id) DO NOTHING;

-- ===== Categories =====
INSERT INTO public.categories (name, slug)
VALUES
  ('Electronics', 'electronics'),
  ('Clothing', 'clothing'),
  ('Home Goods', 'home-goods')
ON CONFLICT (slug) DO NOTHING;

-- ===== Products =====
-- Note: The category_id is selected based on the slug.
INSERT INTO public.products (id, vendor_id, category_id, title, slug, description, base_price, currency, is_published)
VALUES
  ('b8c9d0e1-f2a3-4567-8901-cdef01234567', 'a7b8c9d0-e1f2-3456-7890-bcdef0123456', (SELECT id from public.categories WHERE slug = 'electronics'), 'Laptop', 'laptop', 'A powerful laptop', 120000, 'USD', true),
  ('c9d0e1f2-a3b4-5678-9012-def012345678', 'f6a7b8c9-d0e1-2345-6789-0abcdef01234', (SELECT id from public.categories WHERE slug = 'clothing'), 'T-Shirt', 't-shirt', 'A comfortable t-shirt', 2500, 'USD', true),
  ('d0e1f2a3-b4c5-6789-0123-ef0123456789', 'f6a7b8c9-d0e1-2345-6789-0abcdef01234', (SELECT id from public.categories WHERE slug = 'home-goods'), 'Coffee Mug', 'coffee-mug', 'A mug for your coffee', 1500, 'USD', true),
  ('e1f2a3b4-c5d6-7890-1234-f01234567890', 'a7b8c9d0-e1f2-3456-7890-bcdef0123456', (SELECT id from public.categories WHERE slug = 'electronics'), 'Smartphone', 'smartphone', 'A smart smartphone', 80000, 'USD', true),
  ('f2a3b4c5-d6e7-8901-2345-012345678901', 'f6a7b8c9-d0e1-2345-6789-0abcdef01234', (SELECT id from public.categories WHERE slug = 'clothing'), 'Jeans', 'jeans', 'A pair of jeans', 6000, 'USD', true)
ON CONFLICT (id) DO NOTHING;

-- End of seed script
