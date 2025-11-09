import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env') });

// Initialize Supabase client with service role key
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const STORAGE_STRUCTURE = {
  'listing-images': [
    'products/',
    'products/thumbnails/',
    'vendors/',
    'vendors/logos/',
    'vendors/banners/',
    'categories/',
    'categories/icons/',
    'categories/banners/'
  ],
  'avatars': [
    'users/',
    'users/originals/',
    'users/large/',
    'users/medium/',
    'users/thumbs/',
    'vendors/',
    'vendors/originals/',
    'vendors/large/',
    'vendors/medium/',
    'vendors/thumbs/'
  ]
};

/**
 * Creates a folder in a Supabase storage bucket by uploading an empty file
 * @param {string} bucketName - Name of the bucket
 * @param {string} folderPath - Path of the folder to create
 */
async function createFolder(bucketName, folderPath) {
  try {
    // Create an empty file with a .keep extension to maintain the folder
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(`${folderPath}.keep`, new Uint8Array(0), {
        contentType: 'application/x-empty',
        cacheControl: '0'
      });

    if (error) {
      console.error(`Error creating folder ${folderPath} in ${bucketName}:`, error.message);
      return false;
    }

    console.log(`Created folder: ${folderPath} in bucket: ${bucketName}`);
    return true;
  } catch (error) {
    console.error(`Unexpected error creating folder ${folderPath}:`, error);
    return false;
  }
}

/**
 * Initialize the storage structure for the application
 */
async function initializeStorage() {
  console.log('Starting storage initialization...');

  for (const [bucketName, folders] of Object.entries(STORAGE_STRUCTURE)) {
    console.log(`\nInitializing bucket: ${bucketName}`);
    
    // Create folders
    for (const folder of folders) {
      await createFolder(bucketName, folder);
    }
  }

  console.log('\nStorage initialization completed.');
}

// Run the initialization
initializeStorage().catch(console.error);

export { initializeStorage, createFolder };