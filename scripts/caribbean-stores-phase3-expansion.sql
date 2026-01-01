-- Caribbean Stores Phase 3 Expansion Script for SKNbridgetrade
-- Expanding product catalog to 20-25 total products
-- Adding new electronics store and more products across all categories

-- Enable pgcrypto for password encryption if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===== New Auth User for Caribbean Electronics Store =====
-- Password is 'password123'
INSERT INTO auth.users (id, email, encrypted_password, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, email_confirmed_at)
VALUES
  ('b5a69780-7123-4567-890a-bcdef0123457', 'caribbeanelectronics@example.com', crypt('password123', gen_salt('bf')), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- ===== Auth Identity =====
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'b5a69780-7123-4567-890a-bcdef0123457', 'caribbeanelectronics@example.com', format('{"sub":"%s","email":"%s"}', 'b5a69780-7123-4567-890a-bcdef0123457', 'caribbeanelectronics@example.com')::jsonb, 'email', now(), now(), now())
ON CONFLICT (provider_id, provider) DO NOTHING;

-- ===== New Profile =====
INSERT INTO public.profiles (id, email, full_name, avatar_url, role, metadata)
VALUES
  ('b5a69780-7123-4567-890a-bcdef0123457', 'caribbeanelectronics@example.com', 'Jamal Williams', 'https://i.pravatar.cc/150?u=caribbeanelectronics@example.com', 'seller', '{"theme": "caribbean"}')
ON CONFLICT (id) DO NOTHING;

-- ===== New Caribbean Electronics Vendor =====
INSERT INTO public.vendors (id, owner_id, name, slug, description, logo_url, cover_url, website, location, is_active, metadata)
VALUES
  ('a6978071-2345-6789-0abc-def012345679', 'b5a69780-7123-4567-890a-bcdef0123457', 'Caribbean Electronics', 'caribbean-electronics', 'Authentic Caribbean-inspired electronics and gadgets. From solar-powered devices to island-themed tech accessories. Bringing Caribbean innovation to the digital world.', 'https://i.pravatar.cc/150?u=caribbean-electronics', 'https://i.pravatar.cc/800x400?u=caribbean-electronics', 'https://caribbeanelectronics.example.com', 'Kingston, Jamaica', true, '{"theme": "caribbean", "category": "electronics", "tags": ["caribbean", "electronics", "gadgets", "solar", "tech", "innovation"]}');

-- ===== Additional Electronics Category =====
INSERT INTO public.categories (name, slug, parent_id, metadata)
VALUES
  ('Caribbean Electronics', 'caribbean-electronics', null, '{"theme": "caribbean"}')
ON CONFLICT (slug) DO NOTHING;

-- ===== Phase 3: Additional Products for Existing Stores =====

-- Island Threads Additional Fashion Products (3 more = 6 total)
INSERT INTO public.products (id, vendor_id, title, slug, description, category_id, base_price, currency, is_published, metadata, created_at, updated_at)
VALUES
  ('g4b5c6d7-e8f9-0123-4567-890abcdef012', 'b5a69780-7123-4567-890a-bcdef0123456', 'Caribbean Embroidered Blouse', 'caribbean-embroidered-blouse', 'Elegant blouse featuring intricate Caribbean embroidery patterns inspired by traditional folk art. Made from soft cotton with a flattering fit, perfect for casual or semi-formal occasions. Hand-embroidered by skilled artisans.', (SELECT id FROM public.categories WHERE slug = 'caribbean-fashion'), 550000, 'USD', true, '{"category": "fashion", "tags": ["caribbean", "blouse", "embroidered", "traditional", "cotton", "artisan"]}', NOW(), NOW()),
  ('h5c6d7e8-f9a0-1234-5678-90abcdef0123', 'b5a69780-7123-4567-890a-bcdef0123456', 'Island Resort Shorts', 'island-resort-shorts', 'Comfortable resort shorts made from breathable linen fabric, perfect for island vacations or casual wear. Features tropical patterns and an elastic waistband for all-day comfort. Inspired by Caribbean beach culture.', (SELECT id FROM public.categories WHERE slug = 'caribbean-fashion'), 320000, 'USD', true, '{"category": "fashion", "tags": ["caribbean", "shorts", "linen", "resort", "breathable", "tropical"]}', NOW(), NOW()),
  ('i6d7e8f9-a0b1-2345-6789-0abcdef01234', 'b5a69780-7123-4567-890a-bcdef0123456', 'Traditional Rasta Hat', 'traditional-rasta-hat', 'Authentic Caribbean Rasta hat made from natural wool fibers. Features traditional red, gold, and green colors symbolizing Rastafarian culture. Perfect for sun protection and as a cultural statement piece.', (SELECT id FROM public.categories WHERE slug = 'caribbean-fashion'), 280000, 'USD', true, '{"category": "fashion", "tags": ["caribbean", "rasta", "hat", "traditional", "wool", "cultural"]}', NOW(), NOW());

-- Tropical Bliss Additional Beverage Products (2 more = 5 total)
INSERT INTO public.products (vendor_id, title, slug, description, category_id, base_price, currency, is_published, metadata, created_at, updated_at)
VALUES
  ('a6978071-2345-6789-0abc-def012345678', 'Tamarind Ginger Tea', 'tamarind-ginger-tea', 'Aromatic tea blend featuring Caribbean tamarind and fresh ginger root. Naturally caffeine-free and packed with antioxidants. Traditional remedy used in Caribbean households for digestion and wellness.', (SELECT id FROM public.categories WHERE slug = 'tropical-beverages'), 48000, 'USD', true, '{"category": "beverages", "tags": ["caribbean", "tea", "tamarind", "ginger", "antioxidants", "traditional", "wellness"]}', NOW(), NOW()),
  ('a6978071-2345-6789-0abc-def012345678', 'Sorrel Hibiscus Refresher', 'sorrel-hibiscus-refresher', 'Refreshing Caribbean sorrel (hibiscus) drink sweetened naturally with Caribbean cane sugar. A festive holiday drink packed with vitamin C and iron. Traditionally served during Christmas celebrations.', (SELECT id FROM public.categories WHERE slug = 'tropical-beverages'), 52000, 'USD', true, '{"category": "beverages", "tags": ["caribbean", "sorrel", "hibiscus", "refreshing", "vitamin-c", "traditional", "festive"]}', NOW(), NOW());

-- Caribbean Crafts Additional Craft Products (2 more = 5 total)
INSERT INTO public.products (vendor_id, title, slug, description, category_id, base_price, currency, is_published, metadata, created_at, updated_at)
VALUES
  ('97807123-4567-890a-bcde-f01234567890', 'Caribbean Dreamcatcher', 'caribbean-dreamcatcher', 'Handcrafted dreamcatcher featuring Caribbean symbols and natural feathers. Made with local woods and traditional weaving techniques. Believed to filter dreams and bring positive energy, combining indigenous and African Caribbean traditions.', (SELECT id FROM public.categories WHERE slug = 'handmade-crafts'), 650000, 'USD', true, '{"category": "handmade", "tags": ["caribbean", "dreamcatcher", "handcrafted", "traditional", "spiritual", "cultural"]}', NOW(), NOW()),
  ('97807123-4567-890a-bcde-f01234567890', 'Island Spice Rack', 'island-spice-rack', 'Beautifully carved wooden spice rack featuring traditional Caribbean spice containers. Handcrafted from local hardwoods with intricate designs. Perfect for displaying and organizing your Caribbean spice collection.', (SELECT id FROM public.categories WHERE slug = 'handmade-crafts'), 1100000, 'USD', true, '{"category": "handmade", "tags": ["caribbean", "spice-rack", "wooden", "carved", "traditional", "organizer"]}', NOW(), NOW());

-- IslandFresh Additional Produce/Spice Products (2 more = 5 total)
INSERT INTO public.products (vendor_id, title, slug, description, category_id, base_price, currency, is_published, metadata, created_at, updated_at)
VALUES
  ('80712345-6789-0abc-def0-123456789012', 'Fresh Scotch Bonnet Peppers', 'fresh-scotch-bonnet-peppers', 'Authentic Caribbean Scotch Bonnet peppers, famous for Jamaican cuisine. These fiery peppers add authentic Caribbean heat to jerk marinades and sauces. Grown in volcanic soil for maximum flavor and heat.', (SELECT id FROM public.categories WHERE slug = 'island-spices'), 35000, 'USD', true, '{"category": "spices", "tags": ["caribbean", "scotch-bonnet", "peppers", "spicy", "authentic", "jamaican"]}', NOW(), NOW()),
  ('80712345-6789-0abc-def0-123456789012', 'Caribbean Callaloo Greens', 'caribbean-callaloo-greens', 'Fresh callaloo greens, a traditional Caribbean leafy vegetable. Essential ingredient in Caribbean soups and stews. Rich in vitamins and minerals, harvested fresh and packaged for extended freshness.', (SELECT id FROM public.categories WHERE slug = 'caribbean-produce'), 55000, 'USD', true, '{"category": "produce", "tags": ["caribbean", "callaloo", "greens", "traditional", "nutritious", "leafy-vegetable"]}', NOW(), NOW());

-- Caribbean Electronics Products (3 new products)
INSERT INTO public.products (id, vendor_id, title, slug, description, category_id, base_price, currency, is_published, metadata, created_at, updated_at)
VALUES
  ('j7e8f9a0-b1c2-3456-7890-abcdef012345', 'a6978071-2345-6789-0abc-def012345679', 'Solar-Powered Island Fan', 'solar-powered-island-fan', 'Eco-friendly USB-rechargeable fan with Caribbean-inspired design. Perfect for island living or outdoor activities. Features tropical palm leaf patterns and provides cooling relief with sustainable solar charging technology.', (SELECT id FROM public.categories WHERE slug = 'caribbean-electronics'), 450000, 'USD', true, '{"category": "electronics", "tags": ["caribbean", "solar", "fan", "eco-friendly", "usb", "tropical"]}', NOW(), NOW()),
  ('k8f9a0b1-c2d3-4567-890a-bcdef0123456', 'a6978071-2345-6789-0abc-def012345679', 'Caribbean Bluetooth Speaker', 'caribbean-bluetooth-speaker', 'Water-resistant Bluetooth speaker with vibrant Caribbean color schemes. Features reggae-inspired sound profiles and waterproof design for beach use. Connect wirelessly and enjoy your favorite island tunes anywhere.', (SELECT id FROM public.categories WHERE slug = 'caribbean-electronics'), 750000, 'USD', true, '{"category": "electronics", "tags": ["caribbean", "bluetooth", "speaker", "water-resistant", "reggae", "wireless"]}', NOW(), NOW()),
  ('l9a0b1c2-d3e4-5678-90ab-cdef01234567', 'a6978071-2345-6789-0abc-def012345679', 'Island Power Bank', 'island-power-bank', 'High-capacity portable charger featuring Caribbean artwork and solar charging capability. Never run out of power during your island adventures. Includes multiple USB ports and fast-charging technology.', (SELECT id FROM public.categories WHERE slug = 'caribbean-electronics'), 380000, 'USD', true, '{"category": "electronics", "tags": ["caribbean", "power-bank", "portable", "solar", "fast-charging", "usb"]}', NOW(), NOW());

-- ===== Product Variants for Phase 3 Products =====
INSERT INTO public.product_variants (product_id, seller_id, sku, price_in_cents, inventory_quantity, is_active, attributes, created_at, updated_at)
VALUES
  -- Island Threads additional variants
  ((SELECT id FROM products WHERE slug = 'caribbean-embroidered-blouse'), 'f1e2d3c4-b5a6-7890-1234-567890abcdef', 'BLOUSE-EMBROIDERED-S', 550000, 12, true, '{"size": "S", "color": "White"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'caribbean-embroidered-blouse'), 'f1e2d3c4-b5a6-7890-1234-567890abcdef', 'BLOUSE-EMBROIDERED-M', 550000, 15, true, '{"size": "M", "color": "White"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'island-resort-shorts'), 'f1e2d3c4-b5a6-7890-1234-567890abcdef', 'SHORTS-RESORT-M', 320000, 18, true, '{"size": "M", "color": "Blue"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'island-resort-shorts'), 'f1e2d3c4-b5a6-7890-1234-567890abcdef', 'SHORTS-RESORT-L', 320000, 20, true, '{"size": "L", "color": "Blue"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'traditional-rasta-hat'), 'f1e2d3c4-b5a6-7890-1234-567890abcdef', 'HAT-RASTA-ONE-SIZE', 280000, 25, true, '{"size": "One Size", "color": "Red/Gold/Green"}', NOW(), NOW()),

  -- Tropical Bliss additional variants
  ((SELECT id FROM products WHERE slug = 'tamarind-ginger-tea'), 'e2d3c4b5-a697-8012-3456-7890abcdef01', 'TEA-TAMARIND-8OZ', 48000, 35, true, '{"size": "8oz", "type": "Tamarind Ginger"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'sorrel-hibiscus-refresher'), 'e2d3c4b5-a697-8012-3456-7890abcdef01', 'REFRESHER-SORREL-16OZ', 52000, 30, true, '{"size": "16oz", "type": "Sorrel Hibiscus"}', NOW(), NOW()),

  -- Caribbean Crafts additional variants
  ((SELECT id FROM products WHERE slug = 'caribbean-dreamcatcher'), 'd3c4b5a6-9780-1234-5678-90abcdef0123', 'DREAMCATCHER-FEATHERS', 650000, 8, true, '{"size": "Medium", "style": "Feather"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'island-spice-rack'), 'd3c4b5a6-9780-1234-5678-90abcdef0123', 'SPICE-RACK-6-JARS', 1100000, 6, true, '{"capacity": "6 Jars", "material": "Hardwood"}', NOW(), NOW()),

  -- IslandFresh additional variants
  ((SELECT id FROM products WHERE slug = 'fresh-scotch-bonnet-peppers'), 'c4b5a697-8071-2345-6789-0abcdef01234', 'PEPPERS-SCOTCH-BONNET-1LB', 35000, 20, true, '{"weight": "1lb", "heat-level": "Hot"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'caribbean-callaloo-greens'), 'c4b5a697-8071-2345-6789-0abcdef01234', 'CALLALOO-GREENS-1LB', 55000, 15, true, '{"weight": "1lb", "type": "Fresh Greens"}', NOW(), NOW()),

  -- Caribbean Electronics variants
  ((SELECT id FROM products WHERE slug = 'solar-powered-island-fan'), 'b5a69780-7123-4567-890a-bcdef0123457', 'FAN-SOLAR-USB', 450000, 15, true, '{"power": "USB/Solar", "color": "Tropical Blue"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'caribbean-bluetooth-speaker'), 'b5a69780-7123-4567-890a-bcdef0123457', 'SPEAKER-BT-WATERPROOF', 750000, 10, true, '{"connectivity": "Bluetooth", "water-rating": "IPX7"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'island-power-bank'), 'b5a69780-7123-4567-890a-bcdef0123457', 'POWERBANK-20000MAH', 380000, 20, true, '{"capacity": "20000mAh", "ports": "3 USB"}', NOW(), NOW());

COMMIT;

-- Verify Phase 3 expansion results
SELECT
  v.name as store_name,
  COUNT(p.id) as total_products,
  STRING_AGG(p.title, ', ') as product_list
FROM public.vendors v
LEFT JOIN public.products p ON v.id = p.vendor_id
WHERE v.slug IN ('island-threads', 'tropical-bliss', 'caribbean-crafts', 'island-fresh', 'caribbean-electronics')
GROUP BY v.id, v.name, v.slug
ORDER BY v.name;