import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getTableSchema() {
  try {
    // Get schema for orders table
    console.log('\n=== ORDERS TABLE SCHEMA ===\n');
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select()
      .limit(1);

    if (ordersError) {
      console.error('Error querying orders:', ordersError);
    } else {
      console.log('Sample orders data:', JSON.stringify(ordersData, null, 2));
    }

    // Get schema for order_items table
    console.log('\n=== ORDER_ITEMS TABLE SCHEMA ===\n');
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select()
      .limit(1);

    if (itemsError) {
      console.error('Error querying order_items:', itemsError);
    } else {
      console.log('Sample order_items data:', JSON.stringify(itemsData, null, 2));
    }

    // Get schema for payments table
    console.log('\n=== PAYMENTS TABLE SCHEMA ===\n');
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select()
      .limit(1);

    if (paymentsError) {
      console.error('Error querying payments:', paymentsError);
    } else {
      console.log('Sample payments data:', JSON.stringify(paymentsData, null, 2));
    }

    // Try to get actual column metadata from Supabase introspection
    console.log('\n=== TABLE COLUMNS INFO ===\n');
    
    // Use Supabase's REST introspection
    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/?apikey=${process.env.VITE_SUPABASE_ANON_KEY}`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const introspection = await response.json();
      console.log('API Introspection:', JSON.stringify(introspection, null, 2));
    }

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

getTableSchema();
