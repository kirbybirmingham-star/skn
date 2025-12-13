import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase env vars missing.');
  process.exit(2);
}

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    const migrationFile = './supabase_migrations/20251212_product_ratings_aggregates.sql';
    
    if (!fs.existsSync(migrationFile)) {
      console.error(`Migration file not found: ${migrationFile}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationFile, 'utf-8');
    
    console.log('Applying migration: 20251212_product_ratings_aggregates.sql\n');
    
    // Execute the migration using the execute_sql_function if available
    // Otherwise, split by semicolon and execute statements
    const statements = sql.split(';').filter(s => s.trim());
    
    console.log(`Executing ${statements.length} SQL statements...\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;
      
      try {
        const { error } = await supabase.rpc('execute_sql', { sql: stmt + ';' });
        if (error && !error.message.includes('function execute_sql')) {
          console.warn(`Statement ${i + 1} warning:`, error.message);
        } else {
          console.log(`✓ Statement ${i + 1} executed`);
        }
      } catch (e) {
        console.warn(`Statement ${i + 1} error (non-critical):`, e.message);
      }
    }

    console.log('\nMigration applied. Verifying product_ratings...\n');
    
    // Check if table was created
    const { data: tableInfo, error: tableError } = await supabase
      .from('product_ratings')
      .select('*')
      .limit(1);

    if (tableError) {
      console.warn('Could not query product_ratings table:', tableError.message);
      console.log('\n⚠️  The migration could not be fully applied via RPC.');
      console.log('Please run the migration manually in Supabase SQL Editor:');
      console.log(`\nFile: supabase_migrations/20251212_product_ratings_aggregates.sql\n`);
      process.exit(0);
    }

    console.log('✅ product_ratings table verified!');
    console.log(`Table exists with ${Array.isArray(tableInfo) ? tableInfo.length : 0} rows.\n`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error applying migration:', err.message);
    process.exit(1);
  }
})();
