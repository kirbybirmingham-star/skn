import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runCaribbeanSeed() {
  console.log('Running Caribbean stores seed script...');

  try {
    // Use existing profiles or create new ones directly
    const caribbeanProfiles = [
      { id: 'f1e2d3c4-b5a6-7890-1234-567890abcdef', email: 'islandthreads@example.com', fullName: 'Maria Rodriguez' },
      { id: 'e2d3c4b5-a697-8012-3456-7890abcdef01', email: 'tropicalbliss@example.com', fullName: 'Carlos Martinez' },
      { id: 'd3c4b5a6-9780-1234-5678-90abcdef0123', email: 'caribbeancrafts@example.com', fullName: 'Elena Gonzalez' },
      { id: 'c4b5a697-8071-2345-6789-0abcdef01234', email: 'islandfresh@example.com', fullName: 'Roberto Silva' }
    ];

    const userIds = [];
    for (const profileData of caribbeanProfiles) {
      // Try to create profile directly with fixed UUID
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: profileData.id,
          email: profileData.email,
          full_name: profileData.fullName,
          role: 'seller',
          metadata: { theme: 'caribbean' },
          created_at: new Date().toISOString()
        });

      if (profileError) {
        console.error(`Error creating profile for ${profileData.email}:`, profileError);
      } else {
        console.log(`✓ Created profile for ${profileData.email}`);
        userIds.push(profileData.id);
      }
    }

    // Create vendors
    const caribbeanVendors = [
      {
        owner_id: userIds[0],
        name: 'Island Threads',
        slug: 'island-threads',
        description: 'Authentic Caribbean fashion and clothing - from vibrant dresses to traditional wear. Experience the colors and patterns of the islands.',
        logo_url: 'https://i.pravatar.cc/150?u=island-threads',
        cover_url: 'https://i.pravatar.cc/800x400?u=island-threads',
        website: 'https://islandthreads.example.com',
        location: 'Kingston, Jamaica',
        is_active: true,
        metadata: { theme: 'caribbean', category: 'fashion', tags: ['caribbean', 'fashion', 'clothing', 'traditional', 'vibrant'] }
      },
      {
        owner_id: userIds[1],
        name: 'Tropical Bliss',
        slug: 'tropical-bliss',
        description: 'Refreshing tropical smoothies and healthy beverages made with fresh Caribbean fruits and natural ingredients. Taste the islands in every sip!',
        logo_url: 'https://i.pravatar.cc/150?u=tropical-bliss',
        cover_url: 'https://i.pravatar.cc/800x400?u=tropical-bliss',
        website: 'https://tropicalbliss.example.com',
        location: 'Montego Bay, Jamaica',
        is_active: true,
        metadata: { theme: 'caribbean', category: 'beverages', tags: ['caribbean', 'smoothies', 'tropical', 'fresh', 'healthy', 'beverages'] }
      },
      {
        owner_id: userIds[2],
        name: 'Caribbean Crafts',
        slug: 'caribbean-crafts',
        description: 'Handcrafted treasures from the Caribbean - handmade jewelry, decor, and artisanal goods showcasing local craftsmanship and cultural heritage.',
        logo_url: 'https://i.pravatar.cc/150?u=caribbean-crafts',
        cover_url: 'https://i.pravatar.cc/800x400?u=caribbean-crafts',
        website: 'https://caribbeancrafts.example.com',
        location: 'Port-au-Prince, Haiti',
        is_active: true,
        metadata: { theme: 'caribbean', category: 'handmade', tags: ['caribbean', 'crafts', 'handmade', 'artisan', 'jewelry', 'decor', 'cultural'] }
      },
      {
        owner_id: userIds[3],
        name: 'IslandFresh',
        slug: 'island-fresh',
        description: 'Fresh Caribbean produce and spices - mangoes, plantains, jerk seasoning, and authentic island flavors delivered fresh to your door.',
        logo_url: 'https://i.pravatar.cc/150?u=island-fresh',
        cover_url: 'https://i.pravatar.cc/800x400?u=island-fresh',
        website: 'https://islandfresh.example.com',
        location: 'Bridgetown, Barbados',
        is_active: true,
        metadata: { theme: 'caribbean', category: 'produce', tags: ['caribbean', 'produce', 'fresh', 'spices', 'tropical-fruits', 'authentic', 'island-flavors'] }
      }
    ];

    for (const vendor of caribbeanVendors) {
      const { data, error } = await supabase
        .from('vendors')
        .insert(vendor)
        .select()
        .single();

      if (error) {
        console.error(`Error creating vendor ${vendor.name}:`, error);
      } else {
        console.log(`✓ Created vendor: ${vendor.name}`);
        vendor.id = data.id;
      }
    }

    console.log('✓ Caribbean stores seed completed successfully!');

    // Verify the data was inserted
    const { data: vendors, error: queryError } = await supabase
      .from('vendors')
      .select(`
        name,
        slug,
        description
      `)
      .in('slug', ['island-threads', 'tropical-bliss', 'caribbean-crafts', 'island-fresh']);

    if (queryError) {
      console.error('Error verifying data:', queryError);
    } else {
      console.log('\nCaribbean stores created:');
      vendors.forEach(vendor => {
        console.log(`- ${vendor.name} (${vendor.slug})`);
      });
    }

  } catch (err) {
    console.error('Caribbean seed failed:', err);
    process.exit(1);
  }
}

runCaribbeanSeed();