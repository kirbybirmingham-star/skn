import React, { useEffect, useState, useContext } from 'react';
import { SupabaseAuthContext } from '@/contexts/SupabaseAuthContext';

export default function OnboardingDashboard() {
  const { session } = useContext(SupabaseAuthContext);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load vendor for current user - endpoint should return vendor owned by user
    const token = session?.access_token;
    if (!token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    fetch('/api/onboarding/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(r => r.json())
      .then(data => {
        if (data?.vendor) setVendor(data.vendor);
        else setError(data.error || 'No vendor');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [session?.access_token]);

  if (loading) return <div>Loading…</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!vendor) return <div>No vendor found. Go to Become Seller to create one.</div>;

  const documents = vendor.onboarding_data?.documents || [];
  const appeals = vendor.onboarding_data?.appeals || [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Onboarding Dashboard</h1>
      <div className="mb-4"><strong>Store:</strong> {vendor.name}</div>
      <div className="mb-4"><strong>Status:</strong> {vendor.onboarding_status}</div>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Uploaded Documents</h2>
        {documents.length === 0 ? (
          <div>No documents uploaded yet.</div>
        ) : (
          <ul>
            {documents.map(doc => (
              <li key={doc.id} className="mb-2">
                <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-600">{doc.name || doc.id}</a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Appeals</h2>
        {appeals.length === 0 ? <div>No appeals</div> : (
          <ul>
            {appeals.map(a => (
              <li key={a.id}>{a.created_at}: {a.reason}</li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex gap-3">
        <a href="/become-seller" className="px-4 py-2 bg-gray-200 rounded">Edit Seller Info</a>
        <a href="/onboarding" className="px-4 py-2 bg-blue-600 text-white rounded">Continue Onboarding</a>
      </div>
    </div>
  );
}
