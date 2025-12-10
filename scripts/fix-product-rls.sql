-- Fix RLS policies for products table to allow public read access

-- First, ensure RLS is enabled on products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read" ON products;
DROP POLICY IF EXISTS "Allow sellers to read own" ON products;
DROP POLICY IF EXISTS "Allow sellers to update own" ON products;
DROP POLICY IF EXISTS "Allow sellers to insert" ON products;

-- Add policy: Allow anyone to read published products
CREATE POLICY "Allow public read published products"
  ON products
  FOR SELECT
  TO public
  USING (is_published = true OR auth.uid() IS NOT NULL);

-- Add policy: Allow authenticated sellers to read their own unpublished products
CREATE POLICY "Allow sellers to read own products"
  ON products
  FOR SELECT
  TO authenticated
  USING (vendor_id IN (
    SELECT id FROM vendors WHERE owner_id = auth.uid()
  ));

-- Add policy: Allow sellers to insert products
CREATE POLICY "Allow authenticated users to insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (vendor_id IN (
    SELECT id FROM vendors WHERE owner_id = auth.uid()
  ));

-- Add policy: Allow sellers to update own products
CREATE POLICY "Allow sellers to update own products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (vendor_id IN (
    SELECT id FROM vendors WHERE owner_id = auth.uid()
  ))
  WITH CHECK (vendor_id IN (
    SELECT id FROM vendors WHERE owner_id = auth.uid()
  ));

-- Add policy: Allow sellers to delete own products
CREATE POLICY "Allow sellers to delete own products"
  ON products
  FOR DELETE
  TO authenticated
  USING (vendor_id IN (
    SELECT id FROM vendors WHERE owner_id = auth.uid()
  ));

-- Also fix product_variants, product_ratings if needed
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read variants" ON product_variants;
CREATE POLICY "Allow public read variants"
  ON product_variants
  FOR SELECT
  TO public
  USING (product_id IN (
    SELECT id FROM products WHERE is_published = true
  ));

-- Allow authenticated sellers to read their own product variants
CREATE POLICY "Allow sellers to read own variants"
  ON product_variants
  FOR SELECT
  TO authenticated
  USING (product_id IN (
    SELECT id FROM products WHERE vendor_id IN (
      SELECT id FROM vendors WHERE owner_id = auth.uid()
    )
  ));

-- Allow sellers to manage their own variants
CREATE POLICY "Allow sellers to insert variants"
  ON product_variants
  FOR INSERT
  TO authenticated
  WITH CHECK (product_id IN (
    SELECT id FROM products WHERE vendor_id IN (
      SELECT id FROM vendors WHERE owner_id = auth.uid()
    )
  ));

CREATE POLICY "Allow sellers to update variants"
  ON product_variants
  FOR UPDATE
  TO authenticated
  USING (product_id IN (
    SELECT id FROM products WHERE vendor_id IN (
      SELECT id FROM vendors WHERE owner_id = auth.uid()
    )
  ))
  WITH CHECK (product_id IN (
    SELECT id FROM products WHERE vendor_id IN (
      SELECT id FROM vendors WHERE owner_id = auth.uid()
    )
  ));

CREATE POLICY "Allow sellers to delete variants"
  ON product_variants
  FOR DELETE
  TO authenticated
  USING (product_id IN (
    SELECT id FROM products WHERE vendor_id IN (
      SELECT id FROM vendors WHERE owner_id = auth.uid()
    )
  ));

-- Fix product_ratings
ALTER TABLE product_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read ratings" ON product_ratings;
CREATE POLICY "Allow public read ratings"
  ON product_ratings
  FOR SELECT
  TO public
  USING (product_id IN (
    SELECT id FROM products WHERE is_published = true
  ));

-- Allow authenticated users to insert/read their own ratings
CREATE POLICY "Allow users to insert ratings"
  ON product_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to read own ratings"
  ON product_ratings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR product_id IN (
    SELECT id FROM products WHERE is_published = true
  ));

CREATE POLICY "Allow users to update own ratings"
  ON product_ratings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to delete own ratings"
  ON product_ratings
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
