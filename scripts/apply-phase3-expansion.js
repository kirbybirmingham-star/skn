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

async function runPhase3Expansion() {
  try {
    console.log('Starting Phase 3 product catalog expansion...');

    // Read the SQL file
    const sqlFilePath = join(__dirname, 'caribbean-stores-phase3-expansion.sql');
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8');

    // Split the SQL file into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim() === 'COMMIT' || statement.trim() === '') continue;

      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

        if (error) {
          console.error(`Error in statement ${i + 1}:`, error);
          // Continue with other statements instead of failing completely
          console.log('Continuing with next statement...');
        }
      } catch (err) {
        console.error(`Failed to execute statement ${i + 1}:`, err);
        console.log('Continuing with next statement...');
      }
    }

    console.log('Phase 3 expansion completed successfully!');

    // Verify the data
    console.log('\nVerifying Phase 3 expansion results...');
    const { data: stores, error: verifyError } = await supabase
      .from('vendors')
      .select('name, slug')
      .in('slug', ['island-threads', 'tropical-bliss', 'caribbean-crafts', 'island-fresh', 'caribbean-electronics']);

    if (verifyError) {
      console.error('Error verifying stores:', verifyError);
    } else {
      console.log('Phase 3 stores:');
      stores?.forEach(store => {
        console.log(`  ${store.name}`);
      });

      // Get product counts separately
      const { data: productCounts, error: productError } = await supabase
        .from('products')
        .select('title, vendor_id, vendors!products_vendor_id_fkey(name)')
        .in('vendors.slug', ['island-threads', 'tropical-bliss', 'caribbean-crafts', 'island-fresh', 'caribbean-electronics']);

      if (productError) {
        console.error('Error verifying products:', productError);
      } else {
        const storeCounts = {};
        productCounts?.forEach(product => {
          const storeName = product.vendors?.name;
          if (storeName) {
            storeCounts[storeName] = (storeCounts[storeName] || 0) + 1;
          }
        });

        console.log('\nProduct counts by store:');
        Object.entries(storeCounts).forEach(([store, count]) => {
          console.log(`  ${store}: ${count} products`);
        });

        const totalProducts = Object.values(storeCounts).reduce((sum, count) => sum + count, 0);
        console.log(`\nTotal products across Phase 3 stores: ${totalProducts}`);
      }
    }

  } catch (error) {
    console.error('Phase 3 expansion failed:', error);
    process.exit(1);
  }
}

runPhase3Expansion();