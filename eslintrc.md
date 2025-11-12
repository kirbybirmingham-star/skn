-- Migration: Normalize product variants into a separate table `product_variants`
-- Run this in Supabase SQL editor or via psql. Back up your DB before running.
-- Notes:
-- 1) This creates the new table, migrates existing JSONB variants from products.variants into rows,
--    and (optionally) drops the products.variants column. Review inserted data before dropping.
-- 2) Uses gen_random_uuid() (pgcrypto) for UUID generation. If you prefer uuid_generate_v4(), enable the extension.

begin;

-- create product_variants table
create table if not exists public.product_variants (
	id uuid default gen_random_uuid() primary key,
	product_id uuid not null references public.products(id) on delete cascade,
	seller_id uuid not null references public.profiles(id) on delete cascade,
	title text,
	sku text,
	price_cents integer not null,
	stock integer default 0,
	metadata jsonb default '{}'::jsonb,
	variant_idx integer,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- add an index for lookups
create index if not exists idx_product_variants_product on public.product_variants (product_id);
create index if not exists idx_product_variants_seller on public.product_variants (seller_id);

-- Migrate existing variants JSON array from products.variants into product_variants rows
-- This assumes the JSON object for each variant may contain keys: title, sku, price_cents, stock
-- For price, we fallback to product.price_cents if variant price missing.
insert into public.product_variants (
	product_id, seller_id, title, sku, price_cents, stock, metadata, variant_idx
)
select
	p.id,
	p.seller_id,
	(v.elem ->> 'title')::text,
	(v.elem ->> 'sku')::text,
	coalesce((v.elem ->> 'price_cents')::int, p.price_cents),
	coalesce((v.elem ->> 'stock')::int, 0),
	v.elem,
	v.ordinality - 1
from public.products p
cross join lateral jsonb_array_elements(coalesce(p.variants, '[]'::jsonb)) with ordinality as v(elem, ordinality)
where jsonb_typeof(coalesce(p.variants, '[]'::jsonb)) = 'array';

-- Optional: verify migrated rows before dropping original column
-- SELECT p.id, p.title, count(v.*) as migrated_variants_count
-- FROM public.products p
-- LEFT JOIN public.product_variants v ON v.product_id = p.id
-- GROUP BY p.id, p.title
-- ORDER BY migrated_variants_count desc;

-- [OPTIONAL] Drop variants column from products once you have verified migration
-- ALTER TABLE public.products DROP COLUMN IF EXISTS variants;

-- Create trigger to keep updated_at on product_variants
create or replace function public.trigger_set_timestamp_product_variants()
returns trigger as $$
begin
	new.updated_at = now();
	return new;
end;
$$ language plpgsql;

drop trigger if exists set_timestamp_on_product_variants on public.product_variants;
create trigger set_timestamp_on_product_variants before update on public.product_variants
for each row execute procedure public.trigger_set_timestamp_product_variants();

commit;

-- RLS policies for product_variants
-- Enable RLS and create policies that only allow sellers to manage their variants and allow public select when the parent product is published.

alter table public.product_variants enable row level security;

-- Allow selecting variants when the parent product is published OR when the requester is the seller
create policy product_variants_select_public_or_owner on public.product_variants
	for select
	using (
		exists (
			select 1 from public.products pr
			where pr.id = product_variants.product_id
				and (pr.published = true or pr.seller_id = auth.uid())
		)
	);

-- Allow sellers to insert variants for their own products
create policy product_variants_insert_own on public.product_variants
	for insert
	with check (
		auth.uid() = seller_id
		and exists (select 1 from public.products pr where pr.id = product_id and pr.seller_id = auth.uid())
	);

-- Allow sellers to update/delete their own variants
create policy product_variants_update_own on public.product_variants
	for update
	using (auth.uid() = seller_id)
	with check (auth.uid() = seller_id);

create policy product_variants_delete_own on public.product_variants
	for delete
	using (auth.uid() = seller_id);

-- Index to speed up joins when selecting published products with variants
create index if not exists idx_product_variants_product_published on public.product_variants (product_id) where product_id is not null;

-- Helper: sample query to fetch products and aggregate variants into a JSON array
-- SELECT p.*, coalesce(jsonb_agg(jsonb_build_object('id', v.id, 'title', v.title, 'sku', v.sku, 'price_cents', v.price_cents, 'stock', v.stock) ORDER BY v.variant_idx) FILTER (WHERE v.id IS NOT NULL), '[]') as variants
-- FROM public.products p
-- LEFT JOIN public.product_variants v ON v.product_id = p.id
-- WHERE p.published = true
-- GROUP BY p.id;
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
 keep schema changes tracked.
- For production, add backups & routine export schedule for your database.

