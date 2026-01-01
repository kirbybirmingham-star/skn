-- Insert test products for marketplace - using minimal required fields
INSERT INTO public.vendor_products (vendor_id, title, description, base_price, is_published, created_at)
VALUES
  ('a1bc8ec0-7de9-420b-82a5-e03766550def', 'Premium Wireless Headphones', 'High-quality wireless headphones with noise cancellation', 8999, true, NOW()),
  ('a1bc8ec0-7de9-420b-82a5-e03766550def', 'Organic Coffee Beans', 'Freshly roasted Arabica coffee beans, perfect for your morning brew', 1850, true, NOW()),
  ('a1bc8ec0-7de9-420b-82a5-e03766550def', 'Smart Fitness Tracker', 'Advanced fitness tracker with heart rate monitoring', 12999, true, NOW()),
  ('a1bc8ec0-7de9-420b-82a5-e03766550def', 'Portable Power Bank', '20000mAh power bank for all your devices', 2999, true, NOW()),
  ('a1bc8ec0-7de9-420b-82a5-e03766550def', 'Bluetooth Speaker', 'Waterproof Bluetooth speaker with 360-degree sound', 4999, true, NOW()),
  ('a1bc8ec0-7de9-420b-82a5-e03766550def', 'Organic Honey', 'Pure, raw honey from local beekeepers', 1250, true, NOW()),
  ('a1bc8ec0-7de9-420b-82a5-e03766550def', 'Artisan Bread Loaf', 'Freshly baked sourdough bread made with organic flour', 650, true, NOW()),
  ('a1bc8ec0-7de9-420b-82a5-e03766550def', 'Gourmet Pasta Sauce', 'Homemade marinara sauce with fresh tomatoes and herbs', 850, true, NOW());

-- Insert products for John's General Store
INSERT INTO public.vendor_products (vendor_id, title, description, base_price, is_published, created_at)
VALUES
  ('0f134cb6-9ee5-4e4d-ba50-528cb55d3ca3', 'Fresh Salad Greens', 'Mixed organic greens harvested fresh daily', 450, true, NOW()),
  ('0f134cb6-9ee5-4e4d-ba50-528cb55d3ca3', 'Gourmet Cheese Selection', 'Artisanal cheeses from local dairy farms', 1850, true, NOW()),
  ('0f134cb6-9ee5-4e4d-ba50-528cb55d3ca3', 'Herbal Tea Collection', 'Premium loose leaf teas from organic farms', 1250, true, NOW());

-- Insert products for Jane's Gadgets
INSERT INTO public.vendor_products (vendor_id, title, description, base_price, is_published, created_at)
VALUES
  ('834883fd-b714-42b6-8480-a52956faf3de', 'Wireless Charging Pad', 'Fast wireless charging pad compatible with all Qi devices', 2499, true, NOW()),
  ('834883fd-b714-42b6-8480-a52956faf3de', 'Smart Home Hub', 'Central hub for all your smart home devices', 8999, true, NOW()),
  ('834883fd-b714-42b6-8480-a52956faf3de', 'Gaming Headset', 'Professional gaming headset with surround sound', 12999, true, NOW());

COMMIT;