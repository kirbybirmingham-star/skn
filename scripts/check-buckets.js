import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStorageSetup() {
  try {
    console.log('🔍 Checking Supabase Storage Setup...\n');

    // Check available buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
      return;
    }

    console.log('📂 Available buckets:', buckets.map(b => b.name));
    
    // Check specific buckets that our app uses
    const targetBuckets = ['product-images', 'listings-images'];
    
    for (const bucketName of targetBuckets) {
      const bucket = buckets.find(b => b.name === bucketName);
      
      if (!bucket) {
        console.log(`\n❌ Bucket '${bucketName}' does NOT exist`);
        continue;
      }
      
      console.log(`\n✅ Bucket '${bucketName}' exists`);
      console.log(`   - ID: ${bucket.id}`);
      console.log(`   - Public: ${bucket.public}`);
      
      // List files in bucket
      const { data: files, error: filesError } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 10 });
      
      if (filesError) {
        console.log(`   - Error listing files: ${filesError.message}`);
      } else {
        console.log(`   - Files (first 10):`, files?.map(f => f.name) || 'empty');
      }
      
      // Test public URL access for a sample file
      if (files && files.length > 0) {
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(files[0].name);
        
        console.log(`   - Sample public URL: ${urlData.publicUrl}`);
        
        // Test if URL is accessible
        try {
          const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
          console.log(`   - URL accessibility: ${response.ok ? '✅ Accessible' : '❌ Not accessible'}`);
        } catch (err) {
          console.log(`   - URL test failed: ${err.message}`);
        }
      }
    }
    
    console.log('\n🔧 Recommended Actions:');
    console.log('1. Ensure buckets are set to public or have proper RLS policies');
    console.log('2. Standardize bucket naming across the codebase');
    console.log('3. Check RLS policies for storage.objects table');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkStorageSetup();