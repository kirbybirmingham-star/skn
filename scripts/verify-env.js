import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function verifySupabaseConnection() {
    console.log('Checking Supabase configuration...');
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    console.log('Supabase URL:', supabaseUrl ? 'Present' : 'Missing');
    console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing');

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing required Supabase configuration');
        return;
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase.from('products').select('count');
        
        if (error) {
            console.error('Failed to query products:', error);
            return;
        }

        console.log('Successfully connected to Supabase!');
        console.log('Found products:', data);
    } catch (err) {
        console.error('Error connecting to Supabase:', err);
    }
}

verifySupabaseConnection().catch(console.error);