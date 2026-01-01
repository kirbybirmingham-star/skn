import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getVendorByOwner } from '@/api/EcommerceApi';
import { CheckCircle, XCircle, Clock, Shield, FileText, CreditCard } from 'lucide-react';

const VendorVerification = () => {
  const { user, session } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState({
    identity: 'pending',
    business: 'pending',
    bank: 'pending',
    documents: 'pending'
  });

  useEffect(() => {
    const loadVendor = async () => {
      if (!user?.id) return;

      try {
        const vendorData = await getVendorByOwner(user.id);
        if (vendorData) {
          setVendor(vendorData);
          // Mock verification status - in real app this would come from database
          setVerificationStatus({
            identity: vendorData.identity_verified ? 'verified' : 'pending',
            business: vendorData.business_verified ? 'verified' : 'pending',
            bank: vendorData.bank_verified ? 'verified' : 'pending',
            documents: vendorData.documents_verified ? 'verified' : 'pending'
          });
        }
      } catch (error) {
        console.error('Failed to load vendor data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVendor();
  }, [user]);

  const handleStartVerification = async (type) => {
    if (!vendor?.id || !session?.access_token) return;

    try {
      // This would integrate with a KYC provider like Onfido, Jumio, etc.
      const response = await fetch('/api/onboarding/start-kyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          vendor_id: vendor.id,
          verification_type: type
        })
      });

      const data = await response.json();

      if (response.ok && data.providerUrl) {
        window.open(data.providerUrl, '_blank');
      } else {
        alert(data.error || 'Could not start verification');
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert('Failed to start verification. Please try again.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (loading) {
    return <div>Loading verification status...</div>;
  }

  if (!vendor) {
    return <div>No store found. Please complete your vendor setup first.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Verification</h1>
        <p className="text-gray-600">Account verification is optional for demo purposes</p>
      </div>

      <div className="grid gap-6">
        {/* Verification Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(verificationStatus.identity)}
                  <div>
                    <p className="font-medium">Identity</p>
                    <p className="text-sm text-gray-500">Personal verification</p>
                  </div>
                </div>
                {getStatusBadge(verificationStatus.identity)}
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(verificationStatus.business)}
                  <div>
                    <p className="font-medium">Business</p>
                    <p className="text-sm text-gray-500">Business details</p>
                  </div>
                </div>
                {getStatusBadge(verificationStatus.business)}
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(verificationStatus.bank)}
                  <div>
                    <p className="font-medium">Banking</p>
                    <p className="text-sm text-gray-500">Payment setup</p>
                  </div>
                </div>
                {getStatusBadge(verificationStatus.bank)}
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(verificationStatus.documents)}
                  <div>
                    <p className="font-medium">Documents</p>
                    <p className="text-sm text-gray-500">Legal documents</p>
                  </div>
                </div>
                {getStatusBadge(verificationStatus.documents)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Identity Verification */}
            <div className="border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Identity Verification</h3>
                    <p className="text-sm text-gray-600">Verify your personal identity</p>
                  </div>
                </div>
                {getStatusBadge(verificationStatus.identity)}
              </div>

              {verificationStatus.identity === 'pending' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Complete identity verification to ensure account security and comply with regulations.
                  </p>
                  <Button onClick={() => handleStartVerification('identity')}>
                    Start Identity Verification
                  </Button>
                </div>
              )}

              {verificationStatus.identity === 'verified' && (
                <p className="text-sm text-green-600">✓ Identity verification completed successfully.</p>
              )}
            </div>

            {/* Business Verification */}
            <div className="border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Business Verification</h3>
                    <p className="text-sm text-gray-600">Verify your business information</p>
                  </div>
                </div>
                {getStatusBadge(verificationStatus.business)}
              </div>

              {verificationStatus.business === 'pending' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Provide business registration details and verify business ownership.
                  </p>
                  <Button onClick={() => handleStartVerification('business')}>
                    Start Business Verification
                  </Button>
                </div>
              )}

              {verificationStatus.business === 'verified' && (
                <p className="text-sm text-green-600">✓ Business verification completed successfully.</p>
              )}
            </div>

            {/* Banking Verification */}
            <div className="border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Banking Setup</h3>
                    <p className="text-sm text-gray-600">Connect your bank account for payouts</p>
                  </div>
                </div>
                {getStatusBadge(verificationStatus.bank)}
              </div>

              {verificationStatus.bank === 'pending' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Connect your bank account to receive payments from sales.
                  </p>
                  <Button onClick={() => handleStartVerification('banking')}>
                    Setup Banking
                  </Button>
                </div>
              )}

              {verificationStatus.bank === 'verified' && (
                <p className="text-sm text-green-600">✓ Banking setup completed successfully.</p>
              )}
            </div>

            {/* Document Verification */}
            <div className="border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Document Verification</h3>
                    <p className="text-sm text-gray-600">Upload required legal documents</p>
                  </div>
                </div>
                {getStatusBadge(verificationStatus.documents)}
              </div>

              {verificationStatus.documents === 'pending' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Upload business licenses, tax documents, and other required paperwork.
                  </p>
                  <Button onClick={() => handleStartVerification('documents')}>
                    Upload Documents
                  </Button>
                </div>
              )}

              {verificationStatus.documents === 'verified' && (
                <p className="text-sm text-green-600">✓ Document verification completed successfully.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Requirements Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Verification Requirements</h3>
                <p className="text-sm text-blue-700 mt-1">
                  All verification steps must be completed before you can start selling products on the platform.
                  This ensures buyer protection and regulatory compliance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorVerification;