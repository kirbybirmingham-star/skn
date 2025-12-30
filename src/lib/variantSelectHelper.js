// Helper to select a product with resilient variant projections
import { productRatingsExist } from './ratingsChecker.js';

export const variantSelectCandidates = [
  'product_variants(id, name, images, inventory_quantity, price_in_cents)',
  'product_variants(id, title, images, inventory_quantity, price_in_cents)',
  'product_variants(*)'
];

export async function selectProductWithVariants(supabase, filterField, value) {
  let lastError = null;
  console.debug(`[variantSelectHelper] Attempting to select product by ${filterField}=${value}`);
  
  // First try including product_ratings when the relation exists; otherwise skip this pass
  const tryRatings = await productRatingsExist(supabase).catch(() => false);
  console.debug(`[variantSelectHelper] tryRatings=${tryRatings}`);
  
  if (tryRatings) {
    for (const vs of variantSelectCandidates) {
      const sel = `*, ${vs}, product_ratings(*)`;
      try {
        console.debug(`[variantSelectHelper] Trying with ratings: ${sel}`);
        const res = await supabase.from('products').select(sel).eq(filterField, value).maybeSingle();
        if (!res.error) {
          console.debug(`[variantSelectHelper] Success with: ${vs}`);
          return { data: res.data, error: null, used: vs };
        }
        lastError = res.error;
        const msg = String(res.error.message || '');
        if (msg.includes('Could not find a relationship') || msg.includes('does not exist') || msg.includes('column')) {
          console.debug(`[variantSelectHelper] Relation/column issue, trying next: ${msg}`);
          continue;
        } else {
          console.warn(`[variantSelectHelper] Fatal error with ratings query: ${msg}`);
          return { data: null, error: res.error, used: vs };
        }
      } catch (e) {
        console.warn(`[variantSelectHelper] Exception with ratings query:`, e.message);
        lastError = e;
      }
    }
  }

  // Try without product_ratings
  for (const vs of variantSelectCandidates) {
    const sel = `*, ${vs}`;
    try {
      console.debug(`[variantSelectHelper] Trying without ratings: ${sel}`);
      const res = await supabase.from('products').select(sel).eq(filterField, value).maybeSingle();
      if (!res.error) {
        console.debug(`[variantSelectHelper] Success without ratings: ${vs}`);
        return { data: res.data, error: null, used: vs };
      }
      lastError = res.error;
      const msg = String(res.error.message || '');
      if (msg.includes('Could not find a relationship') || msg.includes('does not exist') || msg.includes('column')) {
        console.debug(`[variantSelectHelper] Relation/column issue, trying next: ${msg}`);
        continue;
      } else {
        console.warn(`[variantSelectHelper] Fatal error without ratings: ${msg}`);
        return { data: null, error: res.error, used: vs };
      }
    } catch (e) {
      console.warn(`[variantSelectHelper] Exception without ratings:`, e.message);
      lastError = e;
    }
  }

  // Final fallback: try selecting just the product without variant relations
  console.debug(`[variantSelectHelper] All variant attempts failed, trying basic select`);
  try {
    const res = await supabase.from('products').select('*').eq(filterField, value).maybeSingle();
    if (!res.error) {
      console.debug(`[variantSelectHelper] Success with basic select`);
      return { data: res.data, error: null, used: 'basic' };
    }
    lastError = res.error;
    console.warn(`[variantSelectHelper] Basic select also failed:`, res.error?.message);
  } catch (e) {
    console.warn(`[variantSelectHelper] Basic select threw exception:`, e.message);
    lastError = e;
  }

  console.error(`[variantSelectHelper] All attempts failed`);
  return { data: null, error: lastError || new Error('Unknown error'), used: null };
}

export default { selectProductWithVariants, variantSelectCandidates };
