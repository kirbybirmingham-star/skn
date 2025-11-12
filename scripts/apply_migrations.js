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


  try {
    const files = (await readdir(migrationsDir)).filter(f => f.endsWith('.sql')).sort();
    if (files.length === 0) {
      console.log('No SQL migration files found.');
      return;
    }

    console.log('\nFound the following migration files:');
    files.forEach(file => console.log(`  - ${file}`));

    for (const file of files) {
      console.log(`\nApplying migration: ${file}...`);
      const filePath = join(migrationsDir, file);
      const command = `PGPASSWORD=${password} psql -h "${dbHost}" -U "${dbUser}" -d "${dbName}" -f "${filePath}"`;

      await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error applying migration ${file}:`);
            console.error(stderr);
            reject(error);
            return;
          }
          console.log(`Successfully applied ${file}.`);
          console.log(stdout);
          resolve();
        });
      });
    }

    console.log('\nAll migrations applied successfully!');

  } catch (error) {
    console.error('\nMigration script failed:', error.message);
    process.exit(1);
  }
}

main();
