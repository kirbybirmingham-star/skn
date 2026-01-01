import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateUserMetadata(email, ...roles) {
  try {
    // Find user by email via profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      console.error('User profile not found:', profileError);
      return;
    }

    // Update the profiles table with the new role
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: roles[0] }) // Set role to first role (admin)
      .eq('id', profile.id);

    if (updateError) {
      console.error('Failed to update profile:', updateError);
      return;
    }

    console.log(`Successfully updated profile for ${email}: role=${roles[0]}`);

  } catch (err) {
    console.error('Error:', err);
  }
}

// Get command line arguments
const [,, email, ...roles] = process.argv;

if (!email || roles.length === 0) {
  console.log('Usage: node update-user-metadata.js <email> <role1> [role2] ...');
  console.log('Example: node update-user-metadata.js user@example.com admin vendor');
  process.exit(1);
}

updateUserMetadata(email, ...roles);