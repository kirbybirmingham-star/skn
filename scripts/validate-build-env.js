#!/usr/bin/env node
/**
 * Pre-build environment validator.
 * 
 * Ensures that production builds have required environment variables set.
 * Fails the build if:
 * - VITE_API_URL is missing or empty
 * - VITE_API_URL points to localhost (dev-only)
 * - VITE_SUPABASE_URL is missing
 * 
 * Run this as part of your build process before `vite build`:
 *   node scripts/validate-build-env.js && vite build
 */

const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

console.log(`[validate-build-env] NODE_ENV=${process.env.NODE_ENV}`);

if (isProd) {
  const errors = [];
  const warnings = [];

  // Check VITE_API_URL
  const apiUrl = process.env.VITE_API_URL || '';
  if (!apiUrl) {
    errors.push('VITE_API_URL is not set. Set it to your backend URL (e.g., https://backend.example.com).');
  } else if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
    errors.push(`VITE_API_URL is set to a localhost URL: "${apiUrl}". This will fail in production.`);
  } else {
    console.log(`✅ VITE_API_URL is set: ${apiUrl}`);
  }

  // Check VITE_SUPABASE_URL
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is not set. This is required for authentication.');
  } else {
    console.log(`✅ VITE_SUPABASE_URL is set: ${supabaseUrl}`);
  }

  // Check VITE_SUPABASE_ANON_KEY
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  if (!anonKey) {
    warnings.push('VITE_SUPABASE_ANON_KEY is not set. Authentication may not work.');
  } else {
    console.log('✅ VITE_SUPABASE_ANON_KEY is set');
  }

  // Log results
  if (errors.length > 0) {
    console.error('\n❌ Build environment validation FAILED:');
    errors.forEach((err, i) => console.error(`  ${i + 1}. ${err}`));
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Build environment warnings:');
    warnings.forEach((warn, i) => console.warn(`  ${i + 1}. ${warn}`));
  }

  console.log('\n✅ All required environment variables are set. Ready to build.');
} else {
  console.log('[validate-build-env] Skipping validation (development build).');
}
