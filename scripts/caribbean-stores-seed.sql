-- Caribbean Stores Seed Script for SKNbridgetrade
-- Phase 2: Adding Caribbean-themed stores
-- Island Threads (fashion), Tropical Bliss (smoothies), Caribbean Crafts (handmade goods), IslandFresh (produce/spices)

-- Enable pgcrypto for password encryption if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===== New Auth Users for Caribbean Stores =====
-- Passwords are 'password123' for all users
INSERT INTO auth.users (id, email, encrypted_password, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, email_confirmed_at)
VALUES
  ('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'islandthreads@example.com', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now(), now()),
  ('e2d3c4b5-a697-8012-3456-7890abcdef01', 'tropicalbliss@example.com', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now(), now()),
  ('d3c4b5a6-9780-1234-5678-90abcdef0123', 'caribbeancrafts@example.com', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now(), now()),
  ('c4b5a697-8071-2345-6789-0abcdef01234', 'islandfresh@example.com', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- ===== Auth Identities =====
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'f1e2d3c4-b5a6-7890-1234-567890abcdef', 'islandthreads@example.com', format('{"sub":"%s","email":"%s"}', 'f1e2d3c4-b5a6-7890-1234-567890abcdef', 'islandthreads@example.com')::jsonb, 'email', now(), now(), now()),
  (gen_random_uuid(), 'e2d3c4b5-a697-8012-3456-7890abcdef01', 'tropicalbliss@example.com', format('{"sub":"%s","email":"%s"}', 'e2d3c4b5-a697-8012-3456-7890abcdef01', 'tropicalbliss@example.com')::jsonb, 'email', now(), now(), now()),
  (gen_random_uuid(), 'd3c4b5a6-9780-1234-5678-90abcdef0123', 'caribbeancrafts@example.com', format('{"sub":"%s","email":"%s"}', 'd3c4b5a6-9780-1234-5678-90abcdef0123', 'caribbeancrafts@example.com')::jsonb, 'email', now(), now(), now()),
  (gen_random_uuid(), 'c4b5a697-8071-2345-6789-0abcdef01234', 'islandfresh@example.com', format('{"sub":"%s","email":"%s"}', 'c4b5a697-8071-2345-6789-0abcdef01234', 'islandfresh@example.com')::jsonb, 'email', now(), now(), now())
ON CONFLICT (provider_id, provider) DO NOTHING;

-- ===== New Profiles =====
INSERT INTO public.profiles (id, email, full_name, avatar_url, role, metadata)
VALUES
  ('f1e2d3c4-b5a6-7890-1234-567890abcdef', 'islandthreads@example.com', 'Maria Rodriguez', 'https://i.pravatar.cc/150?u=islandthreads@example.com', 'seller', '{"theme": "caribbean"}'),
  ('e2d3c4b5-a697-8012-3456-7890abcdef01', 'tropicalbliss@example.com', 'Carlos Martinez', 'https://i.pravatar.cc/150?u=tropicalbliss@example.com', 'seller', '{"theme": "caribbean"}'),
  ('d3c4b5a6-9780-1234-5678-90abcdef0123', 'caribbeancrafts@example.com', 'Elena Gonzalez', 'https://i.pravatar.cc/150?u=caribbeancrafts@example.com', 'seller', '{"theme": "caribbean"}'),
  ('c4b5a697-8071-2345-6789-0abcdef01234', 'islandfresh@example.com', 'Roberto Silva', 'https://i.pravatar.cc/150?u=islandfresh@example.com', 'seller', '{"theme": "caribbean"}')
ON CONFLICT (id) DO NOTHING;

-- ===== New Caribbean Vendors =====
INSERT INTO public.vendors (id, owner_id, name, slug, description, logo_url, cover_url, website, location, is_active, metadata)
VALUES
  ('b5a69780-7123-4567-890a-bcdef0123456', 'f1e2d3c4-b5a6-7890-1234-567890abcdef', 'Island Threads', 'island-threads', 'Authentic Caribbean fashion and clothing - from vibrant dresses to traditional wear. Experience the colors and patterns of the islands.', 'https://i.pravatar.cc/150?u=island-threads', 'https://i.pravatar.cc/800x400?u=island-threads', 'https://islandthreads.example.com', 'Kingston, Jamaica', true, '{"theme": "caribbean", "category": "fashion", "tags": ["caribbean", "fashion", "clothing", "traditional", "vibrant"]}'),
  ('a6978071-2345-6789-0abc-def012345678', 'e2d3c4b5-a697-8012-3456-7890abcdef01', 'Tropical Bliss', 'tropical-bliss', 'Refreshing tropical smoothies and healthy beverages made with fresh Caribbean fruits and natural ingredients. Taste the islands in every sip!', 'https://i.pravatar.cc/150?u=tropical-bliss', 'https://i.pravatar.cc/800x400?u=tropical-bliss', 'https://tropicalbliss.example.com', 'Montego Bay, Jamaica', true, '{"theme": "caribbean", "category": "beverages", "tags": ["caribbean", "smoothies", "tropical", "fresh", "healthy", "beverages"]}'),
  ('97807123-4567-890a-bcde-f01234567890', 'd3c4b5a6-9780-1234-5678-90abcdef0123', 'Caribbean Crafts', 'caribbean-crafts', 'Handcrafted treasures from the Caribbean - handmade jewelry, decor, and artisanal goods showcasing local craftsmanship and cultural heritage.', 'https://i.pravatar.cc/150?u=caribbean-crafts', 'https://i.pravatar.cc/800x400?u=caribbean-crafts', 'https://caribbeancrafts.example.com', 'Port-au-Prince, Haiti', true, '{"theme": "caribbean", "category": "handmade", "tags": ["caribbean", "crafts", "handmade", "artisan", "jewelry", "decor", "cultural"]}'),
  ('80712345-6789-0abc-def0-123456789012', 'c4b5a697-8071-2345-6789-0abcdef01234', 'IslandFresh', 'island-fresh', 'Fresh Caribbean produce and spices - mangoes, plantains, jerk seasoning, and authentic island flavors delivered fresh to your door.', 'https://i.pravatar.cc/150?u=island-fresh', 'https://i.pravatar.cc/800x400?u=island-fresh', 'https://islandfresh.example.com', 'Bridgetown, Barbados', true, '{"theme": "caribbean", "category": "produce", "tags": ["caribbean", "produce", "fresh", "spices", "tropical-fruits", "authentic", "island-flavors"]}');

-- ===== Additional Caribbean Categories =====
INSERT INTO public.categories (name, slug, parent_id, metadata)
VALUES
  ('Caribbean Fashion', 'caribbean-fashion', (SELECT id FROM public.categories WHERE slug = 'clothing'), '{"theme": "caribbean"}'),
  ('Tropical Beverages', 'tropical-beverages', null, '{"theme": "caribbean"}'),
  ('Handmade Crafts', 'handmade-crafts', (SELECT id FROM public.categories WHERE slug = 'home-goods'), '{"theme": "caribbean"}'),
  ('Caribbean Produce', 'caribbean-produce', null, '{"theme": "caribbean"}'),
  ('Island Spices', 'island-spices', null, '{"theme": "caribbean"}')
ON CONFLICT (slug) DO NOTHING;

-- ===== Products for Caribbean Stores =====

-- Island Threads Products
INSERT INTO public.products (id, vendor_id, title, slug, description, category_id, base_price, currency, is_published, metadata, created_at, updated_at)
VALUES
  ('d1e2f3a4-b5c6-7890-1234-567890abcdef', 'b5a69780-7123-4567-890a-bcdef0123456', 'Vibrant Caribbean Sundress', 'vibrant-caribbean-sundress', 'A stunning sundress featuring traditional Caribbean patterns and vibrant colors. Made from lightweight cotton with a comfortable fit, perfect for island living or vacations. Hand-printed designs inspired by Jamaican heritage.', (SELECT id FROM public.categories WHERE slug = 'caribbean-fashion'), 450000, 'USD', true, '{"category": "fashion", "tags": ["caribbean", "sundress", "traditional", "vibrant", "cotton", "hand-printed"]}', NOW(), NOW()),
  ('e2f3a4b5-c6d7-8901-2345-67890abcdef0', 'b5a69780-7123-4567-890a-bcdef0123456', 'Island Linen Shirt', 'island-linen-shirt', 'Breathable linen shirt perfect for tropical climates. Features intricate embroidery inspired by Caribbean folk art. Unisex design with a relaxed fit, ideal for casual island wear or formal occasions.', (SELECT id FROM public.categories WHERE slug = 'caribbean-fashion'), 350000, 'USD', true, '{"category": "fashion", "tags": ["caribbean", "linen", "shirt", "embroidered", "breathable", "tropical"]}', NOW(), NOW()),
  ('f3a4b5c6-d7e8-9012-3456-7890abcdef01', 'b5a69780-7123-4567-890a-bcdef0123456', 'Traditional Madras Headwrap', 'traditional-madras-headwrap', 'Authentic Caribbean headwrap made from madras fabric. Multiple tying styles available, perfect for sun protection and as a fashion statement. Hand-dyed using traditional techniques passed down through generations.', (SELECT id FROM public.categories WHERE slug = 'caribbean-fashion'), 250000, 'USD', true, '{"category": "fashion", "tags": ["caribbean", "headwrap", "madras", "traditional", "hand-dyed", "sun-protection"]}', NOW(), NOW());

-- Tropical Bliss Products
INSERT INTO public.products (vendor_id, title, slug, description, category_id, base_price, currency, is_published, metadata, created_at, updated_at)
VALUES
  ('a6978071-2345-6789-0abc-def012345678', 'Mango Passion Smoothie', 'mango-passion-smoothie', 'A refreshing blend of ripe Jamaican mangoes, passion fruit, and coconut water. Naturally sweet with no added sugars. Made fresh daily with ingredients sourced from local Caribbean farms.', (SELECT id FROM public.categories WHERE slug = 'tropical-beverages'), 65000, 'USD', true, '{"category": "beverages", "tags": ["caribbean", "smoothie", "mango", "passion-fruit", "fresh", "natural"]}', NOW(), NOW()),
  ('a6978071-2345-6789-0abc-def012345678', 'Pineapple Ginger Cooler', 'pineapple-ginger-cooler', 'Tangy pineapple blended with fresh ginger and lime. A revitalizing drink that captures the essence of the Caribbean. Naturally energizing with anti-inflammatory properties from the ginger.', (SELECT id FROM public.categories WHERE slug = 'tropical-beverages'), 55000, 'USD', true, '{"category": "beverages", "tags": ["caribbean", "pineapple", "ginger", "cooler", "revitalizing", "anti-inflammatory"]}', NOW(), NOW()),
  ('a6978071-2345-6789-0abc-def012345678', 'Coconut Banana Bliss', 'coconut-banana-bliss', 'Creamy blend of fresh coconut and Caribbean bananas. A tropical treat that''s both delicious and nutritious. Made with young coconuts harvested at peak ripeness for maximum flavor.', (SELECT id FROM public.categories WHERE slug = 'tropical-beverages'), 60000, 'USD', true, '{"category": "beverages", "tags": ["caribbean", "coconut", "banana", "creamy", "nutritious", "tropical"]}', NOW(), NOW());

-- Caribbean Crafts Products
INSERT INTO public.products (vendor_id, title, slug, description, category_id, base_price, currency, is_published, metadata, created_at, updated_at)
VALUES
  ('97807123-4567-890a-bcde-f01234567890', 'Handwoven Palm Basket', 'handwoven-palm-basket', 'Beautifully crafted basket woven from local palm leaves using traditional Haitian techniques. Perfect for storage, decoration, or as a unique gift. Each piece is handmade and one-of-a-kind.', (SELECT id FROM public.categories WHERE slug = 'handmade-crafts'), 750000, 'USD', true, '{"category": "handmade", "tags": ["caribbean", "basket", "palm-leaves", "handwoven", "traditional", "haitian"]}', NOW(), NOW()),
  ('97807123-4567-890a-bcde-f01234567890', 'Caribbean Bead Necklace', 'caribbean-bead-necklace', 'Colorful necklace featuring recycled glass beads made from Caribbean sea glass. Each bead is individually shaped and polished, representing the vibrant colors of island life. Adjustable length.', (SELECT id FROM public.categories WHERE slug = 'handmade-crafts'), 1250000, 'USD', true, '{"category": "handmade", "tags": ["caribbean", "necklace", "beads", "recycled-glass", "sea-glass", "colorful"]}', NOW(), NOW()),
  ('97807123-4567-890a-bcde-f01234567890', 'Traditional Calabash Bowl', 'traditional-calabash-bowl', 'Polished calabash bowl carved from natural gourds grown in the Caribbean. Used traditionally for serving food or as decoration. Each bowl is unique with natural variations in size and shape.', (SELECT id FROM public.categories WHERE slug = 'handmade-crafts'), 850000, 'USD', true, '{"category": "handmade", "tags": ["caribbean", "calabash", "bowl", "polished", "natural", "traditional"]}', NOW(), NOW());

-- IslandFresh Products
INSERT INTO public.products (vendor_id, title, slug, description, category_id, base_price, currency, is_published, metadata, created_at, updated_at)
VALUES
  ('80712345-6789-0abc-def0-123456789012', 'Fresh Caribbean Mangoes', 'fresh-caribbean-mangoes', 'Juicy, sweet mangoes grown in the fertile soils of Barbados. Hand-picked at peak ripeness for maximum flavor. Perfect for eating fresh, making smoothies, or tropical salads. 3lb box.', (SELECT id FROM public.categories WHERE slug = 'caribbean-produce'), 120000, 'USD', true, '{"category": "produce", "tags": ["caribbean", "mangoes", "fresh", "juicy", "tropical", "barbados"]}', NOW(), NOW()),
  ('80712345-6789-0abc-def0-123456789012', 'Authentic Jerk Seasoning', 'authentic-jerk-seasoning', 'Traditional Jamaican jerk seasoning blend made with allspice, scotch bonnet peppers, and authentic Caribbean spices. Perfect for chicken, pork, or vegetables. Made with natural ingredients, no preservatives.', (SELECT id FROM public.categories WHERE slug = 'island-spices'), 85000, 'USD', true, '{"category": "spices", "tags": ["caribbean", "jerk", "seasoning", "jamaican", "authentic", "natural"]}', NOW(), NOW()),
  ('80712345-6789-0abc-def0-123456789012', 'Fresh Plantains', 'fresh-plantains', 'Green plantains perfect for frying, boiling, or making tostones. Grown in Caribbean soil for authentic flavor. Each bunch contains 4-6 plantains, enough for multiple meals. Traditional staple food.', (SELECT id FROM public.categories WHERE slug = 'caribbean-produce'), 45000, 'USD', true, '{"category": "produce", "tags": ["caribbean", "plantains", "fresh", "green", "traditional", "staple"]}', NOW(), NOW());

-- ===== Product Variants for Caribbean Products =====
INSERT INTO public.product_variants (product_id, seller_id, sku, price_in_cents, inventory_quantity, is_active, attributes, created_at, updated_at)
VALUES
  -- Island Threads variants
  ((SELECT id FROM products WHERE slug = 'vibrant-caribbean-sundress'), 'f1e2d3c4-b5a6-7890-1234-567890abcdef', 'CARIB-SUNDRESS-S', 450000, 15, true, '{"size": "S", "color": "Multi-Color"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'vibrant-caribbean-sundress'), 'f1e2d3c4-b5a6-7890-1234-567890abcdef', 'CARIB-SUNDRESS-M', 450000, 20, true, '{"size": "M", "color": "Multi-Color"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'vibrant-caribbean-sundress'), 'f1e2d3c4-b5a6-7890-1234-567890abcdef', 'CARIB-SUNDRESS-L', 450000, 18, true, '{"size": "L", "color": "Multi-Color"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'island-linen-shirt'), 'f1e2d3c4-b5a6-7890-1234-567890abcdef', 'ISLAND-SHIRT-M', 350000, 25, true, '{"size": "M", "color": "White"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'island-linen-shirt'), 'f1e2d3c4-b5a6-7890-1234-567890abcdef', 'ISLAND-SHIRT-L', 350000, 22, true, '{"size": "L", "color": "White"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'island-linen-shirt'), 'f1e2d3c4-b5a6-7890-1234-567890abcdef', 'ISLAND-SHIRT-XL', 350000, 20, true, '{"size": "XL", "color": "White"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'traditional-madras-headwrap'), 'f1e2d3c4-b5a6-7890-1234-567890abcdef', 'MADRAS-HEADWRAP-RED', 250000, 30, true, '{"color": "Red/Black", "style": "Traditional"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'traditional-madras-headwrap'), 'f1e2d3c4-b5a6-7890-1234-567890abcdef', 'MADRAS-HEADWRAP-BLUE', 250000, 28, true, '{"color": "Blue/Yellow", "style": "Traditional"}', NOW(), NOW()),

  -- Tropical Bliss variants
  ((SELECT id FROM products WHERE slug = 'mango-passion-smoothie'), 'e2d3c4b5-a697-8012-3456-7890abcdef01', 'SMOOTHIE-MANGO-16OZ', 65000, 50, true, '{"size": "16oz", "type": "Mango Passion"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'mango-passion-smoothie'), 'e2d3c4b5-a697-8012-3456-7890abcdef01', 'SMOOTHIE-MANGO-24OZ', 85000, 35, true, '{"size": "24oz", "type": "Mango Passion"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'pineapple-ginger-cooler'), 'e2d3c4b5-a697-8012-3456-7890abcdef01', 'COOLER-PINEAPPLE-16OZ', 55000, 45, true, '{"size": "16oz", "type": "Pineapple Ginger"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'coconut-banana-bliss'), 'e2d3c4b5-a697-8012-3456-7890abcdef01', 'BLISS-COCONUT-16OZ', 60000, 40, true, '{"size": "16oz", "type": "Coconut Banana"}', NOW(), NOW()),

  -- Caribbean Crafts variants
  ((SELECT id FROM products WHERE slug = 'handwoven-palm-basket'), 'd3c4b5a6-9780-1234-5678-90abcdef0123', 'BASKET-PALM-SMALL', 750000, 12, true, '{"size": "Small", "material": "Palm Leaves"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'handwoven-palm-basket'), 'd3c4b5a6-9780-1234-5678-90abcdef0123', 'BASKET-PALM-MEDIUM', 950000, 8, true, '{"size": "Medium", "material": "Palm Leaves"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'caribbean-bead-necklace'), 'd3c4b5a6-9780-1234-5678-90abcdef0123', 'NECKLACE-BEAD-BLUE', 1250000, 5, true, '{"color": "Blue/Green", "material": "Sea Glass"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'traditional-calabash-bowl'), 'd3c4b5a6-9780-1234-5678-90abcdef0123', 'BOWL-CALABASH-SERVING', 850000, 10, true, '{"size": "Serving", "material": "Calabash"}', NOW(), NOW()),

  -- IslandFresh variants
  ((SELECT id FROM products WHERE slug = 'fresh-caribbean-mangoes'), 'c4b5a697-8071-2345-6789-0abcdef01234', 'MANGOES-3LB-BOX', 120000, 25, true, '{"weight": "3lb", "type": "Fresh Mangoes"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'authentic-jerk-seasoning'), 'c4b5a697-8071-2345-6789-0abcdef01234', 'JERK-SEASONING-8OZ', 85000, 40, true, '{"weight": "8oz", "type": "Jerk Blend"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'fresh-plantains'), 'c4b5a697-8071-2345-6789-0abcdef01234', 'PLANTAINS-BUNCH', 45000, 30, true, '{"count": "4-6", "ripeness": "Green"}', NOW(), NOW());

COMMIT;

-- Verify Caribbean stores were created
SELECT
  v.name,
  v.slug,
  v.description,
  COUNT(p.id) as product_count
FROM public.vendors v
LEFT JOIN public.products p ON v.id = p.vendor_id
WHERE v.slug IN ('island-threads', 'tropical-bliss', 'caribbean-crafts', 'island-fresh')
GROUP BY v.id, v.name, v.slug, v.description
ORDER BY v.name;