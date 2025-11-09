import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SellerSignupForm from '@/components/auth/SellerSignupForm';

export default function SellerOnboarding() {
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSuccess = (data) => {
    // If the API returned an onboardingUrl, navigate there
    if (data?.onboardingUrl) {
      window.location.href = data.onboardingUrl;
      return;
    }
    // Or navigate to dashboard
    navigate('/dashboard');
  };

  // If token present, you might verify it and load existing vendor info.
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Seller Onboarding</h1>
      {!token ? (
        <div>
          <p className="mb-4">Create your seller account to start selling on our marketplace.</p>
          <SellerSignupForm onSuccess={handleSuccess} />
        </div>
      ) : (
        <div>
          <p className="mb-4">Continue onboarding for token: <strong>{token}</strong></p>
          <SellerSignupForm onSuccess={handleSuccess} />
        </div>
      )}
    </div>
  );
}
