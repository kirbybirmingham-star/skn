# Supabase setup for SKNbridgetrade

This file documents the Supabase SQL migrations, storage configuration, and environment variables needed to run the app with persistence (products, variants, orders, profiles).

## Overview
The app supports two modes:
- Development in-memory fallback (no Supabase required). This is used when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not set.
- Supabase-backed persistence: requires a Supabase project, a few tables, and a storage bucket for product images.

This README includes:
- SQL migrations to create tables and RLS policies
- A migration to normalize variants into `product_variants` (provided)
- Instructions for creating a `product-images` bucket
- Required environment variables

## Files
- `supabase_migrations/normalize_variants.sql` — migration to create `product_variants` and migrate existing JSONB `products.variants` into rows. Run this after you've created base tables if you previously stored variants in JSON.

If you'd like a single migration that creates all tables (profiles, products, orders, order_items) let me know and I will add it as `supabase_migrations/init_schema.sql`.

## Storage bucket (product images)
Create a bucket named `product-images` in the Storage section of the Supabase dashboard. You can make it public (simpler) or private and use signed URLs.

Using supabase CLI:
```powershell
# Login first: supabase login
supabase storage create-bucket product-images --public
```

If you keep the bucket private, update `src/api/EcommerceApi.js` `uploadImageFile` to request signed upload URLs from a server endpoint that uses the service role key.

## Environment variables
- VITE_SUPABASE_URL (client) — your Supabase URL
- VITE_SUPABASE_ANON_KEY (client) — your anon public key
- SUPABASE_SERVICE_ROLE_KEY (server) — service role key, server-only
- VITE_PAYPAL_CLIENT_ID (client) — PayPal client id (for PayPal SDK)
- PAYPAL_CLIENT_SECRET (server) — PayPal secret used server-side

Keep service role keys and PayPal secrets only on the server and in your deployment secret store.

## How to run the migration
1. Open Supabase dashboard → SQL Editor
2. Paste the SQL from `supabase_migrations/normalize_variants.sql` and run
3. Verify data in `product_variants` and that data matches original `products.variants`
4. (Optional) Once verified, consider dropping `products.variants` column

## Next steps / recommendations
- If you plan to heavily query variants individually (inventory across sellers), consider a full normalized `product_variants` table (this migration already creates that).
- Add database migrations to your repo (e.g., use pg-migrate, migrate, or Supabase Migrations) to keep schema changes tracked.
- For production, add backups & routine export schedule for your database.

If you want, I can also:
- Add `supabase_migrations/init_schema.sql` that creates `profiles`, `products`, `orders`, `order_items` (and RLS) in a single file.
- Create a small script to run the migration via `supabase` CLI or `psql`.

Tell me which of those you want next and I'll add it to the repo.
