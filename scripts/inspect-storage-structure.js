import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Recursively list all files in a bucket path
 */
async function listBucketFiles(bucketName, path = '', depth = 0, maxDepth = 10) {
  if (depth > maxDepth) return [];
  
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(path, { limit: 1000 });
    
    if (error) {
      console.error(`  Error listing ${path || 'root'}: ${error.message}`);
      return [];
    }
    
    let results = [];
    
    for (const item of data || []) {
      const fullPath = path ? `${path}/${item.name}` : item.name;
      
      if (item.id === null) {
        // It's a folder
        results.push({
          type: 'folder',
          name: item.name,
          path: fullPath,
          depth: depth
        });
        // Recursively list folder contents
        const subItems = await listBucketFiles(bucketName, fullPath, depth + 1, maxDepth);
        results = results.concat(subItems);
      } else {
        // It's a file
        results.push({
          type: 'file',
          name: item.name,
          path: fullPath,
          depth: depth,
          size: item.metadata?.size || 0,
          created: item.created_at,
          updated: item.updated_at,
          mimetype: item.metadata?.mimetype || 'unknown'
        });
      }
    }
    
    return results;
  } catch (err) {
    console.error(`Error processing bucket ${bucketName}: ${err.message}`);
    return [];
  }
}

/**
 * Format size in human-readable format
 */
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generate tree view of files
 */
function generateTreeView(items) {
  let tree = '';
  
  for (const item of items) {
    const indent = '│  '.repeat(item.depth);
    const prefix = item.type === 'folder' ? '📁 ' : '📄 ';
    
    if (item.type === 'folder') {
      tree += `${indent}${prefix}${item.name}/\n`;
    } else {
      const size = formatSize(item.size);
      tree += `${indent}${prefix}${item.name} (${size})\n`;
    }
  }
  
  return tree;
}

/**
 * Generate statistics
 */
function generateStats(items) {
  const stats = {
    totalFolders: items.filter(i => i.type === 'folder').length,
    totalFiles: items.filter(i => i.type === 'file').length,
    totalSize: items.filter(i => i.type === 'file').reduce((sum, i) => sum + (i.size || 0), 0),
    byType: {},
    byFolder: {}
  };
  
  // Count by file type
  for (const item of items.filter(i => i.type === 'file')) {
    const ext = item.name.split('.').pop() || 'no-ext';
    stats.byType[ext] = (stats.byType[ext] || 0) + 1;
  }
  
  // Count by folder
  for (const item of items.filter(i => i.type === 'file')) {
    const folder = item.path.includes('/') ? item.path.split('/')[0] : 'root';
    stats.byFolder[folder] = (stats.byFolder[folder] || 0) + 1;
  }
  
  return stats;
}

/**
 * Main inspection function
 */
async function inspectStorage() {
  try {
    console.log('🔍 Inspecting Live Supabase Storage Structure...\n');
    
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
      return;
    }
    
    console.log(`📊 Found ${buckets.length} bucket(s)\n`);
    
    const reportData = {
      timestamp: new Date().toISOString(),
      buckets: []
    };
    
    // Inspect each bucket
    for (const bucket of buckets) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📂 Bucket: ${bucket.name}`);
      console.log(`${'='.repeat(60)}`);
      console.log(`  ID: ${bucket.id}`);
      console.log(`  Public: ${bucket.public ? '🟢 Yes' : '🔴 No'}`);
      console.log(`  Created: ${bucket.created_at}`);
      console.log(`  Updated: ${bucket.updated_at}`);
      
      // List all files in bucket
      console.log('\n📋 Listing files...');
      const items = await listBucketFiles(bucket.name);
      
      console.log(`\n📈 Statistics:`);
      const stats = generateStats(items);
      console.log(`  - Total folders: ${stats.totalFolders}`);
      console.log(`  - Total files: ${stats.totalFiles}`);
      console.log(`  - Total size: ${formatSize(stats.totalSize)}`);
      
      if (Object.keys(stats.byType).length > 0) {
        console.log(`\n  By file type:`);
        for (const [ext, count] of Object.entries(stats.byType).sort((a, b) => b[1] - a[1])) {
          console.log(`    - .${ext}: ${count} file(s)`);
        }
      }
      
      if (Object.keys(stats.byFolder).length > 0) {
        console.log(`\n  By folder:`);
        for (const [folder, count] of Object.entries(stats.byFolder).sort((a, b) => b[1] - a[1])) {
          console.log(`    - ${folder}: ${count} file(s)`);
        }
      }
      
      console.log(`\n📂 File Tree:\n`);
      console.log(generateTreeView(items));
      
      reportData.buckets.push({
        name: bucket.name,
        id: bucket.id,
        public: bucket.public,
        stats: stats,
        items: items
      });
    }
    
    // Save report to JSON
    const reportPath = path.join(process.cwd(), 'storage-structure-report.json');
    await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n💾 Report saved to: ${reportPath}`);
    
    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 SUMMARY');
    console.log(`${'='.repeat(60)}`);
    console.log(`Total buckets: ${buckets.length}`);
    const totalFiles = reportData.buckets.reduce((sum, b) => sum + (b.stats.totalFiles || 0), 0);
    const totalSize = reportData.buckets.reduce((sum, b) => sum + (b.stats.totalSize || 0), 0);
    console.log(`Total files: ${totalFiles}`);
    console.log(`Total storage used: ${formatSize(totalSize)}`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run inspection
inspectStorage().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
