-- Enable RLS for the reviews table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read access to reviews
CREATE POLICY "Allow public read access to reviews"
ON public.reviews
FOR SELECT
USING (true);

-- Allow authenticated users to create reviews
CREATE POLICY "Allow authenticated users to create reviews"
ON public.reviews
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own reviews
CREATE POLICY "Allow users to update their own reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to delete their own reviews
CREATE POLICY "Allow users to delete their own reviews"
ON public.reviews
FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS for the vendor_ratings table
ALTER TABLE public.vendor_ratings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to vendor ratings
CREATE POLICY "Allow public read access to vendor ratings"
ON public.vendor_ratings
FOR SELECT
USING (true);

-- Allow authenticated users to create vendor ratings
CREATE POLICY "Allow authenticated users to create vendor ratings"
ON public.vendor_ratings
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own vendor ratings
CREATE POLICY "Allow users to update their own vendor ratings"
ON public.vendor_ratings
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to delete their own vendor ratings
CREATE POLICY "Allow users to delete their own vendor ratings"
ON public.vendor_ratings
FOR DELETE
USING (auth.uid() = user_id);
