import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
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

// Product categories and their missing images
const missingImages = {
  fashion: [
    'caribbean-print-maxi-dress.jpg',
    'embroidered-beach-cover-up.jpg',
    'palm-leaf-print-hat.jpg',
    'caribbean-sundress-yellow.jpg',
    'straw-hat-colored.jpg',
    'beach-sandals-colorful.jpg',
    'vibrant-caribbean-sundress.jpg',
    'island-linen-shirt.jpg',
    'traditional-madras-headwrap.jpg'
  ],
  electronics: [
    'bluetooth-speaker-portable.jpg',
    'phone-case-caribbean.jpg'
  ],
  produce: [
    'fresh-starfruit-carambola.jpg',
    'fresh-scotch-bonnet-peppers.jpg',
    'dried-mango-slices.jpg',
    'fresh-caribbean-mangoes.jpg',
    'authentic-jerk-seasoning.jpg',
    'fresh-plantains.jpg',
    'island-curry-powder-blend.jpg'
  ],
  crafts: [
    'woven-seagrass-placemats.jpg',
    'caribbean-dreamcatcher.jpg',
    'recycled-glass-wind-chimes.jpg',
    'handwoven-palm-basket.jpg',
    'caribbean-bead-necklace.jpg',
    'traditional-calabash-bowl.jpg',
    'woven-basket-natural.jpg'
  ],
  smoothies: [
    'soursop-passion-fruit-blend.jpg',
    'tamarind-ginger-tea.jpg',
    'guava-paradise-bowl.jpg',
    'mango-passion-smoothie.jpg',
    'pineapple-ginger-cooler.jpg',
    'coconut-banana-bliss.jpg'
  ],
  food: [
    'organic-coffee-beans.jpg',
    'organic-honey.jpg',
    'artisan-bread-loaf.jpg',
    'gourmet-pasta-sauce.jpg'
  ]
};

// Generate SVG placeholder based on category and filename
function generateSVGPlaceholder(category, filename) {
  const productName = filename.replace('.jpg', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // Category-specific colors
  const categoryColors = {
    fashion: '#FF6B9D',
    electronics: '#4ECDC4',
    produce: '#45B7D1',
    crafts: '#FFA07A',
    smoothies: '#98D8C8',
    food: '#F7DC6F'
  };

  const bgColor = categoryColors[category] || '#95A5A6';

  const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="400" fill="${bgColor}" opacity="0.1"/>
    <rect x="20" y="20" width="360" height="360" fill="none" stroke="${bgColor}" stroke-width="3" rx="8"/>
    <text x="200" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="${bgColor}" font-weight="bold">${category.toUpperCase()}</text>
    <text x="200" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#666">${productName}</text>
    <circle cx="200" cy="280" r="40" fill="${bgColor}" opacity="0.3"/>
    <text x="200" y="290" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#fff">🖼️</text>
  </svg>`;

  return svg;
}

async function uploadPlaceholderImage(category, filename) {
  try {
    console.log(`Generating placeholder for ${category}/${filename}...`);

    // Generate SVG content
    const svgContent = generateSVGPlaceholder(category, filename);

    // Convert SVG to buffer
    const buffer = Buffer.from(svgContent, 'utf8');

    // Upload to Supabase storage
    const filePath = `products/${category}/${filename}`;
    const { data, error } = await supabase.storage
      .from('skn-bridge-assets')
      .upload(filePath, buffer, {
        contentType: 'image/svg+xml',
        upsert: true
      });

    if (error) {
      console.error(`❌ Failed to upload ${filename}:`, error.message);
      return false;
    }

    console.log(`✅ Successfully uploaded placeholder: ${filename}`);
    return true;
  } catch (err) {
    console.error(`❌ Error uploading ${filename}:`, err.message);
    return false;
  }
}

async function generateAndUploadAllPlaceholders() {
  console.log('Starting to generate and upload placeholder images...\n');

  let totalUploaded = 0;
  let totalErrors = 0;

  for (const [category, files] of Object.entries(missingImages)) {
    console.log(`\n📁 Processing ${category.toUpperCase()} category (${files.length} files)...`);

    for (const filename of files) {
      const success = await uploadPlaceholderImage(category, filename);
      if (success) {
        totalUploaded++;
      } else {
        totalErrors++;
      }

      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log('\n🎉 Placeholder image generation complete!');
  console.log(`✅ Successfully uploaded: ${totalUploaded} images`);
  console.log(`❌ Failed uploads: ${totalErrors} images`);

  if (totalUploaded > 0) {
    console.log('\n🔄 Running verification to confirm uploads...');

    // Run verification
    const { exec } = await import('child_process');
    exec('node scripts/verify-image-existence.js', (error, stdout, stderr) => {
      if (error) {
        console.error('Verification failed:', error);
        return;
      }
      console.log('Verification results:');
      console.log(stdout);
    });
  }
}

generateAndUploadAllPlaceholders().catch(console.error);