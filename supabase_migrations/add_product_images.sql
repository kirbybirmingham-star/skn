-- Add image fields to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS gallery_images TEXT[];

-- Update existing products with placeholder images
UPDATE products
SET 
  image_url = '/images/products/placeholder.svg',
  gallery_images = ARRAY['/images/products/placeholder.svg']
WHERE image_url IS NULL;