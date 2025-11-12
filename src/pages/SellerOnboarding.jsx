import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import SellerSignupForm from '@/components/auth/SellerSignupForm';

export default function SellerOnboarding() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { session } = useContext(SupabaseAuthContext);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/onboarding/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data?.vendor) setVendor(data.vendor);
        else setError(data.error || 'Could not load vendor');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSuccess = (data) => {
    // If the API returned an onboardingUrl, navigate there
    if (data?.onboardingUrl) {
      window.location.href = data.onboardingUrl;
      return;
    }
    // Or navigate to dashboard
    navigate('/dashboard');
  };

  const startKyc = async () => {
    if (!vendor || !session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding/start-kyc', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }, 
        body: JSON.stringify({ vendor_id: vendor.id }) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'KYC start failed');
      // redirect to provider
      if (data.providerUrl) window.location.href = data.providerUrl;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Seller Onboarding</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {!token ? (
        <div>
          <p className="mb-4">Create your seller account to start selling on our marketplace.</p>
          <SellerSignupForm onSuccess={handleSuccess} />
        </div>
      ) : (
        <div>
          <p className="mb-4">Continue onboarding for token: <strong>{token}</strong></p>
          {loading && <div className="mb-4">Loading…</div>}
          {vendor && (
            <div className="space-y-3">
              <div><strong>Store:</strong> {vendor.name}</div>
              <div><strong>Status:</strong> {vendor.onboarding_status}</div>
              <div>
                <button onClick={startKyc} className="px-4 py-2 bg-blue-600 text-white rounded">Start Identity Verification</button>
              </div>
            </div>
          )}
          {!vendor && !loading && <SellerSignupForm onSuccess={handleSuccess} />}
        </div>
      )}
    </div>
  );
}
