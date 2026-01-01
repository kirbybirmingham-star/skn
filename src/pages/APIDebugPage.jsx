import React, { useState, useEffect } from 'react';
import { getProducts } from '@/api/EcommerceApi';

export default function APIDebugPage() {
  const [status, setStatus] = useState('loading');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const test = async () => {
      try {
        console.log('🧪 Starting API test...');
        const resp = await getProducts({ page: 1, perPage: 5 });
        
        console.log('✅ API Response:', resp);
        setResult(resp);
        setStatus('success');
      } catch (err) {
        console.error('❌ API Error:', err);
        setError(err.message || String(err));
        setStatus('error');
      }
    };

    test();
  }, []);

  if (status === 'loading') {
    return <div className="p-8">⏳ Testing API...</div>;
  }

  if (status === 'error') {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-bold text-red-900 mb-4">❌ API Error</h2>
        <pre className="bg-white p-4 rounded border border-red-200 overflow-auto">{error}</pre>
      </div>
    );
  }

  const { products, total } = result || {};

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">✅ API Test Results</h2>
        <div className="grid grid-cols-2 gap-4 mb-6 text-lg">
          <div><strong>Total Products:</strong> {total || 0}</div>
          <div><strong>Returned:</strong> {products?.length || 0}</div>
        </div>
      </div>

      {products && products.length > 0 ? (
        <div className="space-y-6">
          {products.map((product, idx) => (
            <div key={idx} className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
              <h3 className="text-lg font-bold mb-2">Product {idx + 1}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                <div><strong>ID:</strong> {product.id}</div>
                <div><strong>Title:</strong> {product.title || '(null)'}</div>
                <div><strong>Price:</strong> {product.base_price || '(null)'}</div>
                <div><strong>Currency:</strong> {product.currency || '(null)'}</div>
                <div><strong>Image:</strong> {product.image_url ? '✓' : '✗'}</div>
                <div><strong>Slug:</strong> {product.slug}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          ⚠️ No products returned from API
        </div>
      )}
    </div>
  );
}
