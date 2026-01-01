import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cxgtsqvlgynnfudfweor.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4Z3RzcXZsZ3lubmZ1ZGZ3ZW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDI1NzQyNTAsImV4cCI6MjAxODE1MDI1MH0.2bPZWfT39HKh0YxY0XWELZxWnVWmZVfzEsXZ3cqFAeA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  console.log('\n📊 Testing getProducts query...\n');
  
  const baseSelect = 'id, title, slug, vendor_id, base_price, currency, image_url, gallery_images, is_published, created_at';
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select(baseSelect)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Query error:', error);
      return;
    }
    
    console.log('✅ Query successful!');
    console.log(`Got ${data?.length || 0} products\n`);
    
    if (data && data.length > 0) {
      data.forEach((p, i) => {
        console.log(`Product ${i + 1}: "${p.title}"`);
        console.log(`  - ID: ${p.id}`);
        console.log(`  - Price: ${p.base_price} ${p.currency}`);
        console.log(`  - Image URL: ${p.image_url ? '✓' : '✗'}`);
        console.log(`  - Published: ${p.is_published}`);
      });
    } else {
      console.log('⚠️ No products found');
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

testQuery();
