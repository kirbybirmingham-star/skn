import React, { useEffect, useState, useContext } from 'react';
import { SupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { CheckCircle, Clock } from 'lucide-react';

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

  // Calculate progress: 0 = not started, 1 = account created, 2 = kyc_in_progress, 3 = approved
  const getProgressStep = () => {
    if (vendor.onboarding_status === 'approved') return 3;
    if (vendor.onboarding_status === 'pending' || vendor.onboarding_status === 'kyc_in_progress') return 2;
    if (vendor.onboarding_status === 'started') return 1;
    return 0;
  };

  const getStatusLabel = (status) => {
    if (!status) return 'Not Started';
    if (status === 'approved') return 'Approved';
    if (status === 'pending') return 'Under Review';
    if (status === 'kyc_in_progress') return 'KYC In Progress';
    if (status === 'started') return 'Setup Complete';
    if (status === 'rejected') return 'Rejected';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const progressStep = getProgressStep();
  const progressPercent = (progressStep / 3) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Onboarding Dashboard</h1>
      
      {/* Store Info */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="mb-3"><strong>Store:</strong> {vendor.name}</div>
        <div className="mb-4"><strong>Status:</strong> <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
          vendor.onboarding_status === 'approved' ? 'bg-green-200 text-green-800' :
          vendor.onboarding_status === 'rejected' ? 'bg-red-200 text-red-800' :
          vendor.onboarding_status === 'pending' || vendor.onboarding_status === 'kyc_in_progress' ? 'bg-yellow-200 text-yellow-800' :
          'bg-blue-200 text-blue-800'
        }`}>{getStatusLabel(vendor.onboarding_status)}</span></div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-700 font-semibold">Onboarding Progress</span>
            <span className="text-sm font-bold">{progressStep} of 3</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Progress Steps */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${progressStep >= 1 ? 'bg-green-100' : 'bg-gray-100'}`}>
              {progressStep >= 1 ? (
                <CheckCircle className="w-7 h-7 text-green-600" />
              ) : (
                <span className="text-gray-400 font-bold text-lg">1</span>
              )}
            </div>
            <span className="text-xs text-center text-gray-700 font-medium">Account Created</span>
          </div>
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
              progressStep >= 2 
                ? (progressStep > 2 ? 'bg-green-100' : 'bg-yellow-100')
                : 'bg-gray-100'
            }`}>
              {progressStep > 2 ? (
                <CheckCircle className="w-7 h-7 text-green-600" />
              ) : progressStep === 2 ? (
                <Clock className="w-7 h-7 text-yellow-600 animate-spin" />
              ) : (
                <span className="text-gray-400 font-bold text-lg">2</span>
              )}
            </div>
            <span className="text-xs text-center text-gray-700 font-medium">KYC Verification</span>
          </div>
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${progressStep >= 3 ? 'bg-green-100' : 'bg-gray-100'}`}>
              {progressStep >= 3 ? (
                <CheckCircle className="w-7 h-7 text-green-600" />
              ) : (
                <span className="text-gray-400 font-bold text-lg">3</span>
              )}
            </div>
            <span className="text-xs text-center text-gray-700 font-medium">Approval</span>
          </div>
        </div>
      </div>

      {/* Documents Section */}
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
