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

// Migration files in order
const migrations = [
  'init_schema.sql',
  'storage_setup.sql',
  'add_product_images.sql',
  'add_gallery_images.sql',
  'normalize_variants.sql',
  'add_onboarding_columns.sql',
  'update_schema_for_app_requirements.sql'
];

async function runMigration(filename) {
  console.log(`\nRunning migration: ${filename}`);
  const filePath = join(__dirname, '..', 'supabase_migrations', filename);

  try {
    const sql = await fs.readFile(filePath, 'utf8');
    // Split SQL into individual statements
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        if (error) {
          console.error(`Error executing statement:`, statement.substring(0, 100) + '...');
          throw error;
        }
      }
    }

    console.log(`✓ Migration ${filename} completed`);
  } catch (err) {
    console.error(`Error running migration ${filename}:`, err);
    throw err;
  }
}

async function main() {
  try {
    console.log('Starting database migrations...');

    for (const migration of migrations) {
      await runMigration(migration);
    }

    console.log('\n✨ All migrations completed successfully!');
    console.log('\nNow you can run the seed script to populate the database.');

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

main();