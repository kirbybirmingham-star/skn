import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const projectId = new URL(supabaseUrl).hostname.split('.')[0];

async function main() {
  // Get all products first
  console.log('Fetching products...');
  const getRes = await fetch(`${supabaseUrl}/rest/v1/products?select=id,title,images,gallery_images`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });

  if (!getRes.ok) {
    console.error('Get failed:', getRes.status, await getRes.text());
    return;
  }

  const products = await getRes.json();
  console.log(`Found ${products.length} products\n`);

  const wrongUrl = 'https://supabase.co';
  const correctUrl = supabaseUrl;

  for (const product of products) {
    let needsUpdate = false;
    
    if (product.images?.some(img => img?.includes(wrongUrl))) {
      needsUpdate = true;
    }
    if (product.gallery_images?.some(img => img?.includes(wrongUrl))) {
      needsUpdate = true;
    }

    if (!needsUpdate) continue;

    const fixedImages = product.images?.map(img => img?.replace(wrongUrl, correctUrl));
    const fixedGallery = product.gallery_images?.map(img => img?.replace(wrongUrl, correctUrl));

    console.log(`Updating ${product.title}...`);
    
    const updateRes = await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${product.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({
        images: fixedImages,
        gallery_images: fixedGallery
      })
    });

    if (!updateRes.ok) {
      const errorText = await updateRes.text();
      console.error(`  ❌ Failed:`, updateRes.status, errorText);
    } else {
      console.log(`  ✓ Updated`);
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);
