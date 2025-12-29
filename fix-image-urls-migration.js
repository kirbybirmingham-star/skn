import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tmyxjsqhtxnuchmekbpt.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXhqc3FodHhudWNobWVrYnB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDIyNzE2MDAsImV4cCI6MjAxNzg0NzYwMH0.yTr2KMQl8V5X3W1Z0Y_ABC123DEF456GHI789JKL012';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixImageUrls() {
  console.log('🔧 Starting image URL migration...\n');

  try {
    // Fetch all products with undefined in image_url
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, title, image_url, vendor_id, metadata')
      .ilike('image_url', '%undefined%');

    if (fetchError) {
      console.error('❌ Error fetching products:', fetchError);
      return;
    }

    if (!products || products.length === 0) {
      console.log('✅ No products with undefined image URLs found!');
      return;
    }

    console.log(`📦 Found ${products.length} product(s) with undefined image URLs\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        console.log(`Processing: ${product.title} (ID: ${product.id})`);
        console.log(`  Old URL: ${product.image_url}`);

        // Fix the image URL by replacing undefined with the actual vendor_id
        const fixedImageUrl = product.image_url.replace(
          '/vendors/undefined/',
          `/vendors/${product.vendor_id}/`
        );

        console.log(`  New URL: ${fixedImageUrl}`);

        // Update the product with fixed image URL and ensure category is in metadata
        const metadata = (product.metadata && typeof product.metadata === 'object')
          ? product.metadata
          : {};

        // Ensure category exists in metadata
        if (!metadata.category) {
          metadata.category = 'Uncategorized';
        }

        const { error: updateError } = await supabase
          .from('products')
          .update({
            image_url: fixedImageUrl,
            metadata: metadata
          })
          .eq('id', product.id);

        if (updateError) {
          console.error(`  ❌ Error updating: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`  ✅ Updated successfully\n`);
          successCount++;
        }
      } catch (err) {
        console.error(`  ❌ Exception: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 Migration Summary:`);
    console.log(`  ✅ Successfully updated: ${successCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log(`  📦 Total processed: ${successCount + errorCount}`);
    console.log('='.repeat(60));

    // Verify the fixes
    const { data: verifyProducts, error: verifyError } = await supabase
      .from('products')
      .select('id, title, image_url, metadata')
      .ilike('image_url', '%undefined%');

    if (verifyError) {
      console.error('❌ Verification error:', verifyError);
    } else if (verifyProducts && verifyProducts.length > 0) {
      console.log(`\n⚠️  Warning: ${verifyProducts.length} products still have undefined in image URL`);
    } else {
      console.log('\n✅ Verification complete: All image URLs fixed!');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

fixImageUrls();
