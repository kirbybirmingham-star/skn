-- Set up storage policies for listings-images bucket
BEGIN;

-- Create listings-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name)
SELECT 'listings-images', 'listings-images'
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'listings-images'
);

-- Create avatar bucket if it doesn't exist
INSERT INTO storage.buckets (id, name)
SELECT 'avatar', 'avatar'
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'avatar'
);

-- Remove any existing policies for these buckets
DELETE FROM storage.policies 
WHERE bucket_id IN ('listings-images', 'avatar');

-- Listings-images bucket policies
-- Allow public read access to all files
INSERT INTO storage.policies (bucket_id, name, permission, definition)
VALUES (
  'listings-images',
  'Public Read',
  'SELECT',
  '(bucket_id = ''listings-images'')'
);

-- Allow authenticated sellers to upload product images
INSERT INTO storage.policies (bucket_id, name, permission, definition)
VALUES (
  'listings-images',
  'Seller Upload Products',
  'INSERT',
  '(bucket_id = ''listings-images'' 
    AND (auth.role() = ''authenticated'')
    AND (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN (''seller'', ''admin'')
    ))
    AND (path_tokens[1] = ''products''))'
);

-- Allow sellers to manage their own product images
INSERT INTO storage.policies (bucket_id, name, permission, definition)
VALUES (
  'listings-images',
  'Seller Manage Products',
  'UPDATE',
  '(bucket_id = ''listings-images'' 
    AND (auth.role() = ''authenticated'')
    AND (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN (''seller'', ''admin'')
    ))
    AND (path_tokens[1] = ''products''))'
);

-- Allow sellers to delete their own product images
INSERT INTO storage.policies (bucket_id, name, permission, definition)
VALUES (
  'listings-images',
  'Seller Delete Products',
  'DELETE',
  '(bucket_id = ''listings-images'' 
    AND (auth.role() = ''authenticated'')
    AND (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN (''seller'', ''admin'')
    ))
    AND (path_tokens[1] = ''products''))'
);

-- Avatar bucket policies
-- Allow public read access to avatars
INSERT INTO storage.policies (bucket_id, name, permission, definition)
VALUES (
  'avatar',
  'Public Avatar Read',
  'SELECT',
  '(bucket_id = ''avatar'')'
);

-- Allow users to upload their own avatars
INSERT INTO storage.policies (bucket_id, name, permission, definition)
VALUES (
  'avatar',
  'User Upload Avatar',
  'INSERT',
  '(bucket_id = ''avatar'' 
    AND auth.role() = ''authenticated'' 
    AND (
      path_tokens[1] = ''users'' 
      AND path_tokens[2] = auth.uid()
    ))'
);

-- Allow users to update their own avatars
INSERT INTO storage.policies (bucket_id, name, permission, definition)
VALUES (
  'avatar',
  'User Update Avatar',
  'UPDATE',
  '(bucket_id = ''avatar'' 
    AND auth.role() = ''authenticated'' 
    AND (
      path_tokens[1] = ''users'' 
      AND path_tokens[2] = auth.uid()
    ))'
);

-- Allow users to delete their own avatars
INSERT INTO storage.policies (bucket_id, name, permission, definition)
VALUES (
  'avatar',
  'User Delete Avatar',
  'DELETE',
  '(bucket_id = ''avatar'' 
    AND auth.role() = ''authenticated'' 
    AND (
      path_tokens[1] = ''users'' 
      AND path_tokens[2] = auth.uid()
    ))'
);

-- Allow admin to manage all storage
INSERT INTO storage.policies (bucket_id, name, permission, definition)
VALUES 
  ('listings-images', 'Admin Full Access Listings', 'ALL', '(bucket_id = ''listings-images'' AND auth.role() = ''authenticated'' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin''))'),
  ('avatar', 'Admin Full Access Avatar', 'ALL', '(bucket_id = ''avatar'' AND auth.role() = ''authenticated'' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin''))');

COMMIT;