import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
const envPath = path.join(process.cwd(), '..', 'server', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
const env = {};
for (const line of lines) {
  if (line.includes('=')) {
    const [key, ...val] = line.split('=');
    env[key.trim()] = val.join('=').trim().replace(/['\"]/g, '');
  }
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function createUser() {
  // Get command line arguments
  const userEmail = process.argv[2];
  const userPassword = process.argv[3];
  const userRole = process.argv[4] || 'buyer';

  if (!userEmail || !userPassword) {
    console.log(`
❌ Error: Email and password are required

Usage: node scripts/create-user.js <email> <password> [role]

Examples:
  node scripts/create-user.js john@example.com pass123 buyer
  node scripts/create-user.js seller@example.com sellerpass vendor
  node scripts/create-user.js admin@example.com adminpass admin

Available roles: buyer, vendor, admin
    `);
    process.exit(1);
  }

  // Validate role
  const validRoles = ['buyer', 'vendor', 'seller', 'admin'];
  if (!validRoles.includes(userRole)) {
    console.log(`❌ Invalid role: ${userRole}. Must be one of: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  console.log(`Creating user: ${userEmail} with role: ${userRole}`);

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true,
      user_metadata: {
        role: userRole,
        full_name: userEmail.split('@')[0],
        roles: [userRole]
      }
    });

    if (authError) {
      console.error('❌ Auth creation failed:', authError.message);
      process.exit(1);
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: userEmail,
        full_name: userEmail.split('@')[0],
        role: userRole,
        roles: [userRole],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError.message);
      process.exit(1);
    } else {
      console.log('✅ Profile created');
    }

    // Create vendor store if vendor/seller role
    if (userRole === 'vendor' || userRole === 'seller') {
      const { error: vendorError } = await supabase
        .from('vendors')
        .insert({
          owner_id: authData.user.id,
          business_name: `${userEmail.split('@')[0]} Store`,
          slug: `${userEmail.split('@')[0].toLowerCase()}-store`,
          description: `Store for ${userEmail.split('@')[0]}`,
          is_active: true,
          created_at: new Date().toISOString()
        });

      if (vendorError) {
        console.error('❌ Vendor creation failed:', vendorError.message);
        process.exit(1);
      } else {
        console.log('✅ Vendor store created');
      }
    }

    console.log(`
🎉 USER CREATED SUCCESSFULLY!

Email: ${userEmail}
Password: ${userPassword}
Role: ${userRole}

You can now sign in with these credentials.

For admin users: Access admin panel at /dashboard/admin
For vendor users: Access vendor panel at /dashboard/vendor
For buyer users: Browse marketplace at /marketplace
    `);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

createUser().catch(console.error);