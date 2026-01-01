-- Comprehensive product seed data with detailed descriptions and proper pricing
-- This will replace the existing basic products with more detailed marketplace-ready data

-- Clear existing products (optional - comment out if you want to keep existing data)
-- DELETE FROM public.products WHERE vendor_id IN ('a1bc8ec0-7de9-420b-82a5-e03766550def', '0f134cb6-9ee5-4e4d-ba50-528cb55d3ca3', '834883fd-b714-42b6-8480-a52956faf3de');

-- Insert products with comprehensive descriptions and proper pricing
INSERT INTO public.products (vendor_id, title, slug, description, base_price, currency, is_published, metadata, created_at, updated_at)
VALUES
  -- Tech Hub products
  ('a1bc8ec0-7de9-420b-82a5-e03766550def', 'Premium Wireless Headphones - Noise Cancelling',
   'premium-wireless-headphones-noise-cancelling',
   'Experience superior sound quality with our premium wireless headphones featuring advanced active noise cancellation. These over-ear headphones deliver crystal-clear audio with deep bass response and comfortable memory foam ear cushions. The 30-hour battery life ensures uninterrupted listening, while the quick-charge feature gives you 3 hours of playback from just 15 minutes of charging. Compatible with all Bluetooth devices, including voice assistant integration for hands-free calling. Includes carrying case and multiple ear cushion options.',
   899900, 'USD', true, '{"category": "electronics", "tags": ["headphones", "wireless", "noise-cancelling", "premium", "audio"]}', NOW(), NOW()),

  ('a1bc8ec0-7de9-420b-82a5-e03766550def', 'Smart Fitness Tracker Pro',
   'smart-fitness-tracker-pro',
   'Track your fitness journey with precision using our advanced smart fitness tracker. Features include continuous heart rate monitoring, GPS tracking for accurate distance and pace measurements, sleep analysis with REM sleep detection, and comprehensive activity tracking for 12+ sports modes. The vibrant AMOLED display shows notifications, weather updates, and music controls. Water-resistant up to 50 meters, this tracker syncs seamlessly with popular fitness apps. Includes a comfortable silicone band and charging cable.',
   1299900, 'USD', true, '{"category": "electronics", "tags": ["fitness", "smartwatch", "health", "tracking", "wearable"]}', NOW(), NOW()),

  ('a1bc8ec0-7de9-420b-82a5-e03766550def', 'Portable Power Bank 20000mAh',
   'portable-power-bank-20000mah',
   'Never run out of battery power with our high-capacity portable power bank. This 20000mAh lithium-polymer battery can charge your smartphone up to 6 times, with dual USB-A and USB-C ports supporting fast charging up to 18W. The compact design fits easily in your pocket or bag, while the LED indicator shows remaining power at a glance. Safety features include over-current protection, short-circuit prevention, and temperature control. Compatible with all USB-C and Lightning devices. Includes a braided charging cable.',
   299900, 'USD', true, '{"category": "electronics", "tags": ["power-bank", "charging", "portable", "battery", "accessories"]}', NOW(), NOW()),

  ('a1bc8ec0-7de9-420b-82a5-e03766550def', 'Bluetooth Speaker - Waterproof',
   'bluetooth-speaker-waterproof',
   'Take your music anywhere with our waterproof Bluetooth speaker featuring 360-degree sound projection. The IPX7 waterproof rating allows use in rain or near water, while the rugged rubber exterior withstands drops and scratches. Delivers powerful bass with clear treble, perfect for outdoor adventures, pool parties, or home use. The rechargeable lithium battery provides up to 12 hours of continuous playback, with built-in microphone for hands-free calling. Connect multiple speakers for stereo sound or party mode.',
   499900, 'USD', true, '{"category": "electronics", "tags": ["speaker", "bluetooth", "waterproof", "portable", "audio"]}', NOW(), NOW()),

  ('a1bc8ec0-7de9-420b-82a5-e03766550def', 'Organic Coffee Beans - Premium Blend',
   'organic-coffee-beans-premium-blend',
   'Start your day with our carefully selected organic coffee beans, sourced directly from sustainable farms in Ethiopia. This premium medium roast blend combines notes of chocolate, caramel, and citrus for a smooth, balanced cup. Each bean is hand-picked at peak ripeness and roasted in small batches to preserve maximum flavor. Fair trade certified and USDA organic, ensuring you get the highest quality coffee while supporting ethical farming practices. Perfect for drip coffee, French press, or espresso. 1lb bag.',
   185000, 'USD', true, '{"category": "food", "tags": ["coffee", "organic", "premium", "fair-trade", "beans"]}', NOW(), NOW()),

  ('a1bc8ec0-7de9-420b-82a5-e03766550def', 'Pure Raw Honey - Local Beekeeper',
   'pure-raw-honey-local-beekeeper',
   'Experience the pure, unfiltered taste of our raw local honey, harvested from hives in the Pacific Northwest. This golden honey retains all its natural enzymes, vitamins, and antioxidants through our gentle extraction process. The flavor profile varies seasonally, offering notes of wildflowers, berries, and herbs. Raw honey is nature''s perfect sweetener, ideal for tea, baking, or as a natural remedy. Unpasteurized and unheated to preserve maximum nutritional benefits. 16oz jar.',
   125000, 'USD', true, '{"category": "food", "tags": ["honey", "raw", "organic", "local", "natural"]}', NOW(), NOW()),

  ('a1bc8ec0-7de9-420b-82a5-e03766550def', 'Artisan Sourdough Bread Loaf',
   'artisan-sourdough-bread-loaf',
   'Indulge in our handcrafted sourdough bread, baked fresh daily using traditional methods and organic ingredients. Our naturally leavened dough ferments for 24 hours, creating a complex flavor with a chewy crust and soft, airy interior. Made with organic flour, filtered water, sea salt, and our proprietary starter culture. Perfect for sandwiches, toast, or enjoying with good olive oil. No commercial yeast or preservatives. Each loaf weighs approximately 1.5 lbs. Pickup available daily.',
   65000, 'USD', true, '{"category": "food", "tags": ["bread", "sourdough", "artisan", "organic", "fresh"]}', NOW(), NOW()),

  ('a1bc8ec0-7de9-420b-82a5-e03766550def', 'Homemade Marinara Pasta Sauce',
   'homemade-marinara-pasta-sauce',
   'Our authentic marinara sauce is made from scratch using vine-ripened tomatoes grown in California''s fertile valleys. Simmered slowly with fresh garlic, onions, basil, oregano, and a touch of extra virgin olive oil, this sauce captures the essence of traditional Italian cooking. No artificial additives, preservatives, or high-fructose corn syrup. Perfect for pasta dishes, pizza, or as a base for soups and stews. Gluten-free and vegan. 24oz jar. Refrigerate after opening.',
   85000, 'USD', true, '{"category": "food", "tags": ["pasta-sauce", "homemade", "organic", "italian", "vegan"]}', NOW(), NOW()),

  -- John's General Store products
  ('0f134cb6-9ee5-4e4d-ba50-528cb55d3ca3', 'Fresh Mixed Salad Greens',
   'fresh-mixed-salad-greens',
   'Enjoy the freshest mixed salad greens harvested daily from our organic farm. This seasonal blend includes crisp romaine, tender butter lettuce, peppery arugula, and nutrient-rich spinach. Grown without synthetic pesticides or fertilizers, our greens are hand-washed and ready to eat. Packed with vitamins A, C, and K, these greens provide essential nutrients for optimal health. Perfect for salads, sandwiches, or smoothies. 8oz clamshell. Best consumed within 3 days of delivery.',
   45000, 'USD', true, '{"category": "food", "tags": ["greens", "organic", "fresh", "salad", "vegetables"]}', NOW(), NOW()),

  ('0f134cb6-9ee5-4e4d-ba50-528cb55d3ca3', 'Artisanal Cheese Selection',
   'artisanal-cheese-selection',
   'Discover our carefully curated selection of artisanal cheeses from local dairy farms. This 8oz assortment includes aged cheddar with caramel notes, creamy goat cheese with herbal undertones, and nutty parmesan-style cheese. All cheeses are made from milk sourced from pasture-raised cows, goats, and sheep. Perfect for cheese boards, sandwiches, or cooking. Includes serving suggestions and storage tips. Raw milk cheeses are aged to develop complex flavors. Keep refrigerated.',
   185000, 'USD', true, '{"category": "food", "tags": ["cheese", "artisanal", "local", "dairy", "selection"]}', NOW(), NOW()),

  ('0f134cb6-9ee5-4e4d-ba50-528cb55d3ca3', 'Premium Loose Leaf Tea Collection',
   'premium-loose-leaf-tea-collection',
   'Elevate your tea experience with our premium loose leaf tea collection. This 4oz assortment features four distinct blends: calming chamomile with hints of lavender, energizing green tea with jasmine, robust black tea with bergamot, and herbal rooibos with cinnamon. All teas are sourced from organic farms and hand-blended in small batches. Perfect for mindful moments or sharing with friends. Includes infuser and steeping instructions. Caffeine-free options available.',
   125000, 'USD', true, '{"category": "beverages", "tags": ["tea", "loose-leaf", "organic", "premium", "collection"]}', NOW(), NOW()),

  -- Jane's Gadgets products
  ('834883fd-b714-42b6-8480-a52956faf3de', 'Fast Wireless Charging Pad',
   'fast-wireless-charging-pad',
   'Charge your devices effortlessly with our fast wireless charging pad. Compatible with all Qi-enabled devices, this 15W charger delivers rapid charging for smartphones, earbuds, and smartwatches. The sleek design features LED indicators showing charging status and a non-slip silicone base. Safety features include foreign object detection, over-current protection, and temperature control. The included USB-C cable supports fast charging protocols. Perfect for home, office, or travel.',
   249900, 'USD', true, '{"category": "electronics", "tags": ["charging", "wireless", "fast-charge", "qi", "accessories"]}', NOW(), NOW()),

  ('834883fd-b714-42b6-8480-a52956faf3de', 'Smart Home Central Hub',
   'smart-home-central-hub',
   'Transform your home into a smart home with our central hub compatible with major smart home ecosystems. Control lights, thermostats, security cameras, and appliances from your smartphone. Features include voice assistant integration, automated routines, energy monitoring, and IFTTT compatibility. The hub communicates over Wi-Fi and Zigbee protocols, extending your smart home range. Easy setup with the companion app. Includes power adapter and Ethernet cable for reliable connectivity.',
   899900, 'USD', true, '{"category": "electronics", "tags": ["smart-home", "hub", "automation", "iot", "control"]}', NOW(), NOW()),

  ('834883fd-b714-42b6-8480-a52956faf3de', 'Professional Gaming Headset',
   'professional-gaming-headset',
   'Dominate the competition with our professional gaming headset featuring 7.1 surround sound and active noise cancellation. The comfortable memory foam ear cushions and adjustable headband provide hours of comfort during long gaming sessions. The retractable microphone with noise-canceling technology ensures clear communication with your team. Compatible with PC, PlayStation, and Xbox. Includes audio control box with RGB lighting and multiple connection options. Perfect for esports enthusiasts.',
   1299900, 'USD', true, '{"category": "electronics", "tags": ["gaming", "headset", "surround-sound", "microphone", "professional"]}', NOW(), NOW());

-- Insert corresponding product variants with proper pricing in cents
INSERT INTO public.product_variants (product_id, seller_id, sku, price_in_cents, inventory_quantity, is_active, attributes, created_at, updated_at)
VALUES
  -- Premium Wireless Headphones variants
  ((SELECT id FROM products WHERE slug = 'premium-wireless-headphones-noise-cancelling'), (SELECT owner_id FROM vendors WHERE id = 'a1bc8ec0-7de9-420b-82a5-e03766550def'), 'HEADPHONES-BLK-001', 899900, 25, true, '{"color": "black", "connectivity": "wireless"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'premium-wireless-headphones-noise-cancelling'), (SELECT owner_id FROM vendors WHERE id = 'a1bc8ec0-7de9-420b-82a5-e03766550def'), 'HEADPHONES-WHT-001', 899900, 15, true, '{"color": "white", "connectivity": "wireless"}', NOW(), NOW()),

  -- Smart Fitness Tracker variants
  ((SELECT id FROM products WHERE slug = 'smart-fitness-tracker-pro'), (SELECT owner_id FROM vendors WHERE id = 'a1bc8ec0-7de9-420b-82a5-e03766550def'), 'FITTRACKER-BLK-001', 1299900, 20, true, '{"color": "black", "size": "standard"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'smart-fitness-tracker-pro'), (SELECT owner_id FROM vendors WHERE id = 'a1bc8ec0-7de9-420b-82a5-e03766550def'), 'FITTRACKER-BLU-001', 1299900, 18, true, '{"color": "blue", "size": "standard"}', NOW(), NOW()),

  -- Power Bank variants
  ((SELECT id FROM products WHERE slug = 'portable-power-bank-20000mah'), (SELECT owner_id FROM vendors WHERE id = 'a1bc8ec0-7de9-420b-82a5-e03766550def'), 'POWERBANK-20000-001', 299900, 30, true, '{"capacity": "20000mAh", "ports": "dual"}', NOW(), NOW()),

  -- Bluetooth Speaker variants
  ((SELECT id FROM products WHERE slug = 'bluetooth-speaker-waterproof'), (SELECT owner_id FROM vendors WHERE id = 'a1bc8ec0-7de9-420b-82a5-e03766550def'), 'SPEAKER-BLK-001', 499900, 22, true, '{"color": "black", "waterproof": "IPX7"}', NOW(), NOW()),
  ((SELECT id FROM products WHERE slug = 'bluetooth-speaker-waterproof'), (SELECT owner_id FROM vendors WHERE id = 'a1bc8ec0-7de9-420b-82a5-e03766550def'), 'SPEAKER-BLU-001', 499900, 20, true, '{"color": "blue", "waterproof": "IPX7"}', NOW(), NOW()),

  -- Coffee Beans variants
  ((SELECT id FROM products WHERE slug = 'organic-coffee-beans-premium-blend'), (SELECT owner_id FROM vendors WHERE id = 'a1bc8ec0-7de9-420b-82a5-e03766550def'), 'COFFEE-1LB-001', 185000, 50, true, '{"weight": "1lb", "grind": "whole-bean"}', NOW(), NOW()),

  -- Raw Honey variants
  ((SELECT id FROM products WHERE slug = 'pure-raw-honey-local-beekeeper'), (SELECT owner_id FROM vendors WHERE id = 'a1bc8ec0-7de9-420b-82a5-e03766550def'), 'HONEY-16OZ-001', 125000, 35, true, '{"size": "16oz", "type": "raw"}', NOW(), NOW()),

  -- Sourdough Bread variants
  ((SELECT id FROM products WHERE slug = 'artisan-sourdough-bread-loaf'), (SELECT owner_id FROM vendors WHERE id = 'a1bc8ec0-7de9-420b-82a5-e03766550def'), 'BREAD-SOURDOUGH-001', 65000, 20, true, '{"type": "sourdough", "weight": "1.5lb"}', NOW(), NOW()),

  -- Pasta Sauce variants
  ((SELECT id FROM products WHERE slug = 'homemade-marinara-pasta-sauce'), (SELECT owner_id FROM vendors WHERE id = 'a1bc8ec0-7de9-420b-82a5-e03766550def'), 'SAUCE-MARINARA-001', 85000, 40, true, '{"size": "24oz", "type": "marinara"}', NOW(), NOW()),

  -- Salad Greens variants
  ((SELECT id FROM products WHERE slug = 'fresh-mixed-salad-greens'), (SELECT owner_id FROM vendors WHERE id = '0f134cb6-9ee5-4e4d-ba50-528cb55d3ca3'), 'GREENS-MIXED-001', 45000, 30, true, '{"weight": "8oz", "type": "mixed"}', NOW(), NOW()),

  -- Cheese Selection variants
  ((SELECT id FROM products WHERE slug = 'artisanal-cheese-selection'), (SELECT owner_id FROM vendors WHERE id = '0f134cb6-9ee5-4e4d-ba50-528cb55d3ca3'), 'CHEESE-ASSORT-001', 185000, 15, true, '{"weight": "8oz", "type": "assortment"}', NOW(), NOW()),

  -- Tea Collection variants
  ((SELECT id FROM products WHERE slug = 'premium-loose-leaf-tea-collection'), (SELECT owner_id FROM vendors WHERE id = '0f134cb6-9ee5-4e4d-ba50-528cb55d3ca3'), 'TEA-COLLECT-001', 125000, 25, true, '{"weight": "4oz", "type": "collection"}', NOW(), NOW()),

  -- Wireless Charging Pad variants
  ((SELECT id FROM products WHERE slug = 'fast-wireless-charging-pad'), (SELECT owner_id FROM vendors WHERE id = '834883fd-b714-42b6-8480-a52956faf3de'), 'CHARGER-WIRELESS-001', 249900, 40, true, '{"power": "15W", "standard": "Qi"}', NOW(), NOW()),

  -- Smart Home Hub variants
  ((SELECT id FROM products WHERE slug = 'smart-home-central-hub'), (SELECT owner_id FROM vendors WHERE id = '834883fd-b714-42b6-8480-a52956faf3de'), 'HUB-SMARTHOME-001', 899900, 12, true, '{"protocols": "WiFi,Zigbee", "compatibility": "multiple"}', NOW(), NOW()),

  -- Gaming Headset variants
  ((SELECT id FROM products WHERE slug = 'professional-gaming-headset'), (SELECT owner_id FROM vendors WHERE id = '834883fd-b714-42b6-8480-a52956faf3de'), 'HEADSET-GAMING-001', 1299900, 18, true, '{"sound": "7.1", "microphone": "retractable"}', NOW(), NOW());

-- Insert sample reviews for products to demonstrate the reviews system
INSERT INTO public.reviews (product_id, user_id, rating, title, body, created_at)
VALUES
  -- Reviews for Premium Wireless Headphones
  ((SELECT id FROM products WHERE slug = 'premium-wireless-headphones-noise-cancelling'), (SELECT id FROM auth.users LIMIT 1), 5, 'Outstanding Sound Quality', 'These headphones exceeded my expectations. The noise cancellation is incredible, and the battery life lasts all day. Perfect for long flights and commutes.', NOW() - INTERVAL '2 days'),
  ((SELECT id FROM products WHERE slug = 'premium-wireless-headphones-noise-cancelling'), (SELECT id FROM auth.users LIMIT 1 OFFSET 1), 4, 'Great value for money', 'Comfortable to wear for extended periods. Sound quality is excellent, though the bass could be a bit stronger. Fast shipping and good packaging.', NOW() - INTERVAL '5 days'),
  ((SELECT id FROM products WHERE slug = 'premium-wireless-headphones-noise-cancelling'), (SELECT id FROM auth.users LIMIT 1 OFFSET 2), 5, 'Perfect for work and travel', 'I use these for video calls and music. The microphone quality is excellent, and the noise cancellation helps in noisy environments. Highly recommended!', NOW() - INTERVAL '1 week'),

  -- Reviews for Smart Fitness Tracker
  ((SELECT id FROM products WHERE slug = 'smart-fitness-tracker-pro'), (SELECT id FROM auth.users LIMIT 1), 5, 'Accurate and feature-rich', 'This fitness tracker has everything I need - heart rate monitoring, GPS, sleep tracking. The battery lasts over a week. Very accurate step counting.', NOW() - INTERVAL '3 days'),
  ((SELECT id FROM products WHERE slug = 'smart-fitness-tracker-pro'), (SELECT id FROM auth.users LIMIT 1 OFFSET 1), 4, 'Good fitness companion', 'Solid build quality and comfortable to wear. The app integration is smooth. Only wish the display was brighter in sunlight.', NOW() - INTERVAL '6 days'),

  -- Reviews for Organic Coffee
  ((SELECT id FROM products WHERE slug = 'organic-coffee-beans-premium-blend'), (SELECT id FROM auth.users LIMIT 1 OFFSET 2), 5, 'Best coffee I''ve had', 'Smooth, rich flavor with notes of chocolate and caramel. Freshly roasted and delivered quickly. Will definitely order again.', NOW() - INTERVAL '4 days'),
  ((SELECT id FROM products WHERE slug = 'organic-coffee-beans-premium-blend'), (SELECT id FROM auth.users LIMIT 1), 5, 'Perfect morning brew', 'The grind is consistent and the coffee tastes amazing. Fair trade certification is a plus. Great value for the quality.', NOW() - INTERVAL '1 week'),

  -- Reviews for Power Bank
  ((SELECT id FROM products WHERE slug = 'portable-power-bank-20000mah'), (SELECT id FROM auth.users LIMIT 1 OFFSET 1), 4, 'Reliable power source', 'Charges my phone multiple times. Compact size fits well in my bag. LED indicators are helpful. Good purchase overall.', NOW() - INTERVAL '2 days'),

  -- Reviews for Bluetooth Speaker
  ((SELECT id FROM products WHERE slug = 'bluetooth-speaker-waterproof'), (SELECT id FROM auth.users LIMIT 1 OFFSET 2), 5, 'Amazing sound for the price', 'Powerful bass and clear treble. Waterproof design works great by the pool. Battery life is excellent. Perfect for outdoor use.', NOW() - INTERVAL '5 days'),
  ((SELECT id FROM products WHERE slug = 'bluetooth-speaker-waterproof'), (SELECT id FROM auth.users LIMIT 1), 4, 'Good portable speaker', 'Solid sound quality and waterproof. Easy to connect and use. The only minor issue is that it''s a bit heavy for backpacking.', NOW() - INTERVAL '8 days');

COMMIT;

-- Verify the data was inserted correctly
SELECT
  p.title,
  p.slug,
  p.description,
  p.base_price,
  p.currency,
  p.is_published,
  COUNT(pv.id) as variants_count,
  COUNT(r.id) as reviews_count,
  AVG(r.rating) as avg_rating
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
LEFT JOIN reviews r ON p.id = r.product_id
GROUP BY p.id, p.title, p.slug, p.description, p.base_price, p.currency, p.is_published
ORDER BY p.created_at DESC;