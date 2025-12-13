import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    // Fallback: try to select and inspect
    const { data: rows, error: selectError } = await supabase
      .from('product_ratings')
      .select()
      .limit(1);

    if (selectError) {
      console.log('Error querying product_ratings:', selectError.message);
    } else {
      console.log('✓ Can query product_ratings table');
      if (rows && rows.length > 0) {
        console.log('Sample row:', rows[0]);
        console.log('\nColumns in table:', Object.keys(rows[0]));
      } else {
        console.log('Table is empty (no sample row), but columns are queryable.');
        // Try an empty select to get column names
        const { data: cols } = await supabase
          .from('product_ratings')
          .select()
          .limit(0);
        if (cols && cols.length >= 0) {
          console.log('Query succeeded - table structure is accessible');
        }
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
