import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, images')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const product = products[0];
  console.log('Product:', product.title);
  console.log('Images stored in DB:', JSON.stringify(product.images, null, 2));
  
  // Now try to manually update
  const newImages = ['https://ebvlniuzrttvvgilccui.supabase.co/storage/v1/object/public/listings-images/test.jpg'];
  
  const { data: updateData, error: updateError } = await supabase
    .from('products')
    .update({ images: newImages })
    .eq('id', product.id)
    .select();
  
  if (updateError) {
    console.error('Update error:', updateError);
  } else {
    console.log('\nAfter manual update:');
    console.log('Returned data:', JSON.stringify(updateData, null, 2));
  }
  
  // Verify by fetching again
  const { data: verify } = await supabase
    .from('products')
    .select('images')
    .eq('id', product.id)
    .single();
  
  console.log('\nVerification fetch:');
  console.log('Images in DB now:', JSON.stringify(verify.images, null, 2));
}

main().catch(console.error);
