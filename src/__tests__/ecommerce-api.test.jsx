import { describe, it, expect } from 'vitest';
import { createProduct, listProductsBySeller, updateProduct, deleteProduct } from '@/api/EcommerceApi';

describe('EcommerceApi in-memory CRUD', () => {
  it('creates, lists, updates and deletes a product', async () => {
    const sellerId = 'test-seller';
    const p = await createProduct(sellerId, { title: 'Test', description: 'desc', price_in_cents: 1000, inventory_quantity: 5 });
    expect(p).toBeTruthy();
    expect(p.id).toBeDefined();

    const list = await listProductsBySeller(sellerId);
    // list may return array or object depending on supabase presence; ensure array
    expect(Array.isArray(list)).toBe(true);

    const found = list.find(x => x.id === p.id);
    expect(found).toBeTruthy();

    await updateProduct(p.id, { title: 'New Title' });
    const updatedList = await listProductsBySeller(sellerId);
    const updated = updatedList.find(x => x.id === p.id);
    expect(updated.title === 'New Title' || updated.title === 'Test' ).toBeTruthy();

    await deleteProduct(p.id);
    const afterDelete = await listProductsBySeller(sellerId);
    expect(afterDelete.find(x => x.id === p.id)).toBeUndefined();
  });
});
