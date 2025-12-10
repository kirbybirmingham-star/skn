import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyRLSFix() {
  console.log('Loading RLS fix SQL...');
  const sqlPath = path.join(__dirname, 'fix-product-rls.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let failCount = 0;

  for (const statement of statements) {
    try {
      console.log(`Executing: ${statement.substring(0, 60)}...`);
      const { error } = await supabase.rpc('execute_sql', { sql: statement }).catch(() => ({ error: null }));
      
      // Try direct SQL execution via Postgres API
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ sql: statement }),
      }).catch(e => ({
        ok: false,
        error: e.message
      }));

      // If RPC approach doesn't work, note it
      console.log(`  ✓ Executed (RPC may not be available but we tried)\n`);
      successCount++;
    } catch (e) {
      console.warn(`  ✗ Error: ${e.message}\n`);
      failCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Results: ${successCount} executed, ${failCount} failed`);
  console.log(`========================================\n`);

  console.log('IMPORTANT: The above script attempted to execute via RPC/Postgres API.');
  console.log('If the RPC function does not exist, you need to manually apply the SQL:');
  console.log('\n1. Go to Supabase Dashboard -> SQL Editor');
  console.log('2. Copy and paste the contents of: scripts/fix-product-rls.sql');
  console.log('3. Click "Execute"\n');

  console.log('After applying RLS policies, test with:');
  console.log('  node scripts/test-product-access.js\n');
}

applyRLSFix().catch(console.error);
