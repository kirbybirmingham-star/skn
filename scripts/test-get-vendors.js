#!/usr/bin/env node
/**
 * Test getVendors API
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testGetVendors() {
  console.log('Testing getVendors logic...\n');
  
  try {
    console.log('Step 1: Fetching vendors...');
    
    // Fetch vendors - simplified
    const res = await supabase
      .from('vendors')
      .select('id, owner_id, name, store_name, slug, description, created_at')
      .order('name', { ascending: true });
    
    if (res.error) {
      console.log('Error:', res.error.message);
      return;
    }
    
    const vendorsData = res.data || [];
    console.log('✅ Got', vendorsData.length, 'vendors\n');
    
    if (vendorsData.length === 0) {
      console.log('No vendors found!');
      return;
    }

    // Fetch products for each vendor
    console.log('Step 2: Fetching products for each vendor...');
    const vendorsWithProducts = await Promise.all(
      vendorsData.map(async (vendor) => {
        const { data: products } = await supabase
          .from('products')
          .select('id, title, base_price, image_url, gallery_images, is_published')
          .eq('vendor_id', vendor.id);
        return { ...vendor, products: products || [] };
      })
    );
    console.log('✅ Fetched products\n');

    // Fetch avatars
    console.log('Step 3: Fetching avatars...');
    const ownerIds = vendorsWithProducts.map(v => v.owner_id).filter(Boolean);
    let profilesMap = {};
    if (ownerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', ownerIds);
      if (profiles) {
        profilesMap = profiles.reduce((acc, p) => {
          acc[p.id] = p.avatar_url;
          return acc;
        }, {});
      }
    }
    console.log('✅ Got', Object.keys(profilesMap).length, 'avatars\n');

    // Map to final format
    const mapped = vendorsWithProducts.map(v => {
      const prods = v.products || [];
      const published = prods.filter(p => p.is_published !== false);
      const featured = published.length ? published[0] : (prods[0] || null);
      
      return {
        id: v.id,
        name: v.store_name || v.name || v.slug,
        store_name: v.store_name || v.name || v.slug,
        avatar: profilesMap[v.owner_id] || null,
        featured_product: featured ? {
          id: featured.id,
          title: featured.title,
          image: featured.image_url || (featured.gallery_images && featured.gallery_images[0]),
        } : null,
        total_products: prods.length,
      };
    });

    console.log('📋 Final mapped vendors:\n');
    mapped.forEach((v, i) => {
      console.log(`${i + 1}. ${v.store_name}`);
      console.log(`   - Featured Product: ${v.featured_product ? '✓' : '✗'}`);
      console.log(`   - Total Products: ${v.total_products}`);
    });

    console.log('\n✅ Ready to display!');
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testGetVendors();
