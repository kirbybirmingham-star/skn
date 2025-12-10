// Lightweight checker for optional rating tables. Caches results to avoid repeated failed selects.
const cache = {
  product_ratings: null,
  vendor_ratings: null,
};

async function hasTable(supabase, tableName) {
  if (!supabase) return false;
  if (cache[tableName] !== null) return cache[tableName];
  try {
    const res = await supabase.from(tableName).select('id').limit(1);
    if (res.error) {
      const msg = String(res.error.message || '').toLowerCase();
      const code = String(res.error.code || '').toLowerCase();
      // Table doesn't exist
      if (msg.includes('could not find') || msg.includes('does not exist') || msg.includes('schema cache')) {
        cache[tableName] = false;
        return false;
      }
      // 404 or permission errors: treat as table doesn't exist or not accessible
      if (code === '404' || msg.includes('not found')) {
        cache[tableName] = false;
        return false;
      }
      // Other errors: assume table exists but other permission issue, so skip querying it
      console.warn(`[ratingsChecker] ${tableName} check failed with error:`, res.error.message, 'assuming table not accessible');
      cache[tableName] = false;
      return false;
    }
    cache[tableName] = Array.isArray(res.data) ? true : !!res.data;
    return cache[tableName];
  } catch (e) {
    console.warn(`[ratingsChecker] ${tableName} check threw error:`, e.message);
    cache[tableName] = false;
    return false;
  }
}

export async function productRatingsExist(supabase) {
  return hasTable(supabase, 'product_ratings');
}

export async function vendorRatingsExist(supabase) {
  return hasTable(supabase, 'vendor_ratings');
}

export default { productRatingsExist, vendorRatingsExist };
