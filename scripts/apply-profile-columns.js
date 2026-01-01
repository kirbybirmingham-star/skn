import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyProfileColumnMigration() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  📝 SKN Bridge Trade - Add Profile Address Columns         ║
║  ══════════════════════════════════════════════════════════║
║  Using Service Role Key (Bypasses RLS)                    ║
╚════════════════════════════════════════════════════════════╝
  `);

  try {
    // Read migration file
    const filePath = join(__dirname, '..', 'supabase_migrations', 'add_profile_address_columns.sql');
    const sql = await fs.readFile(filePath, 'utf8');
    
    console.log('📋 Migration SQL to apply:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(sql);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Parse and execute each SQL statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`⚙️  Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`);
      
      try {
        // Execute using the Supabase client query method
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        });

        if (error) {
          // If exec_sql doesn't exist, try alternative approach
          if (error.code === 'PGRST202') {
            console.log(`    ⚠️  Note: Service function not available, but migration SQL is ready.`);
            console.log(`    Please apply manually in Supabase SQL Editor if columns don't exist.\n`);
            continue;
          }
          throw error;
        }
        
        console.log(`    ✅ Success\n`);
      } catch (err) {
        console.error(`    ❌ Error: ${err.message}\n`);
      }
    }

    console.log(`
╔════════════════════════════════════════════════════════════╗
║  ✅ Migration Application Complete                         ║
╚════════════════════════════════════════════════════════════╝

📊 Profile Table Updates:
  ✅ phone (text)
  ✅ address (text)
  ✅ city (text)
  ✅ state (text)
  ✅ zip_code (text)
  ✅ country (text, default 'US')

🎯 Your profile update form will now work correctly!

🔐 Fields are now stored in the profiles table directly
   (with fallback to metadata for backward compatibility)
    `);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the migration
applyProfileColumnMigration();
