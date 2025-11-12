import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import path from 'path';

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

async function runMigrations() {
  const migrationsDir = join(__dirname, '..', 'supabase_migrations');
  
  try {
    const files = (await fs.readdir(migrationsDir))
      .filter(f => f.endsWith('.sql'))
      .sort()
      .slice(-5); // Only run the most recent 5 to avoid duplicates
    
    if (files.length === 0) {
      console.log('No SQL migration files found.');
      return;
    }

    console.log('\nFound migration files (running most recent):');
    files.forEach(file => console.log(`  - ${file}`));

    for (const file of files) {
      console.log(`\nApplying migration: ${file}...`);
      const filePath = join(migrationsDir, file);
      
      try {
        const sql = await fs.readFile(filePath, 'utf-8');
        
        // Use rpc to execute raw SQL or use the query method
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async (err) => {
          // If rpc doesn't exist, try direct SQL via the internal REST API
          const response = await fetch(`${supabaseUrl}/rest/v1/sql`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: sql }),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          }
          return { error: null };
        });

        if (error) {
          console.error(`Error applying migration ${file}:`, error.message);
          console.warn('Continuing with next migration...');
        } else {
          console.log(`✓ Successfully applied ${file}`);
        }
      } catch (err) {
        console.error(`Error reading/applying ${file}:`, err.message);
        console.warn('Continuing with next migration...');
      }
    }

    console.log('\nMigration run completed!');
  } catch (error) {
    console.error('Migration script failed:', error.message);
    process.exit(1);
  }
}

runMigrations();
