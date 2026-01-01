import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Upload, AlertCircle, FileText, Building, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const KycOnboarding = ({ isVendor = false }) => {
  const { session, profile, refreshProfile } = useContext(SupabaseAuthContext);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const verificationType = isVendor ? 'business' : 'individual';
  const statusField = isVendor ? 'kyb_status' : 'kyc_status';

  useEffect(() => {
    checkVerificationStatus();
  }, [session, isVendor]);

  const checkVerificationStatus = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/kyc/status?type=${verificationType}&userId=${session.user.id}${isVendor ? `&vendorId=${profile?.vendor_id}` : ''}`);
      const data = await response.json();
      setVerificationStatus(data);
    } catch (error) {
      console.error('Error checking KYC status:', error);
    } finally {
      setLoading(false);
    }
  };

  const startVerification = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/kyc/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          verificationType,
          userId: session.user.id,
          vendorId: isVendor ? profile?.vendor_id : null
        })
      });

      const data = await response.json();

      if (data.success) {
        await checkVerificationStatus();
        toast({
          title: 'Verification Started',
          description: 'Your verification process has begun. Please upload the required documents.'
        });
      }
    } catch (error) {
      console.error('Error starting verification:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to start verification process.'
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (documentType, file) => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);
      formData.append('verificationId', verificationStatus.id);

      const response = await fetch('/api/kyc/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        await checkVerificationStatus();
        toast({
          title: 'Document Uploaded',
          description: `${documentType.replace('_', ' ').toUpperCase()} uploaded successfully.`
        });
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Failed to upload document. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      not_started: { variant: 'secondary', label: 'Not Started', icon: AlertCircle },
      pending_documents: { variant: 'outline', label: 'Documents Needed', icon: Upload },
      submitted: { variant: 'default', label: 'Under Review', icon: FileText },
      approved: { variant: 'default', label: 'Verified', icon: CheckCircle, className: 'bg-green-500' },
      rejected: { variant: 'destructive', label: 'Rejected', icon: AlertCircle }
    };

    const config = statusConfig[status] || statusConfig.not_started;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className || ''}`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getRequiredDocuments = () => {
    if (isVendor) {
      return [
        { type: 'business_license', label: 'Business License', description: 'Official business registration document' },
        { type: 'tax_id', label: 'Tax ID', description: 'Business tax identification number' },
        { type: 'bank_statement', label: 'Bank Statement', description: 'Recent business bank statement (3 months)' }
      ];
    }

    return [
      { type: 'id_card', label: 'ID Card', description: 'Government-issued photo ID' },
      { type: 'passport', label: 'Passport', description: 'Valid passport (alternative to ID)' },
      { type: 'utility_bill', label: 'Utility Bill', description: 'Recent utility bill for address verification' }
    ];
  };

  const getProgressValue = () => {
    if (!verificationStatus) return 0;

    const statusProgress = {
      not_started: 0,
      pending_documents: 25,
      submitted: 75,
      approved: 100,
      rejected: 0
    };

    return statusProgress[verificationStatus.status] || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isApproved = verificationStatus?.status === 'approved';
  const canUploadDocuments = ['pending_documents', 'submitted'].includes(verificationStatus?.status);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          {isVendor ? <Building className="w-6 h-6" /> : <User className="w-6 h-6" />}
          <h1 className="text-2xl font-bold">
            {isVendor ? 'Business Verification' : 'Identity Verification'}
          </h1>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">Verification Progress</span>
          {verificationStatus && getStatusBadge(verificationStatus.status)}
        </div>

        <Progress value={getProgressValue()} className="mb-6" />
      </div>

      {isApproved ? (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Verification Complete!</h3>
            <p className="text-muted-foreground mb-4">
              Your {isVendor ? 'business' : 'identity'} has been successfully verified.
              You now have full access to all marketplace features.
            </p>
            <Button onClick={() => navigate(isVendor ? '/dashboard/vendor' : '/marketplace')}>
              {isVendor ? 'Go to Vendor Dashboard' : 'Browse Marketplace'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {!verificationStatus || verificationStatus.status === 'not_started' ? (
            <Card>
              <CardHeader>
                <CardTitle>Start Verification Process</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground">
                  To ensure a safe marketplace for all users, we require {isVendor ? 'business' : 'identity'} verification.
                  This process helps prevent fraud and ensures compliance with regulations.
                </p>
                <Button onClick={startVerification} disabled={loading}>
                  Start Verification
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Required Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getRequiredDocuments().map((doc) => {
                      const uploadedDoc = verificationStatus?.documents?.find(d => d.document_type === doc.type);
                      const isUploaded = !!uploadedDoc;
                      const status = uploadedDoc?.status || 'not_uploaded';

                      return (
                        <div key={doc.type} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{doc.label}</h4>
                            <p className="text-sm text-muted-foreground">{doc.description}</p>
                            {isUploaded && (
                              <Badge variant="outline" className="mt-1">
                                {status === 'submitted' ? 'Under Review' : status}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isUploaded ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : canUploadDocuments ? (
                              <div>
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) => uploadDocument(doc.type, e.target.files[0])}
                                  className="hidden"
                                  id={`upload-${doc.type}`}
                                  disabled={uploading}
                                />
                                <label htmlFor={`upload-${doc.type}`}>
                                  <Button variant="outline" size="sm" asChild>
                                    <span className="cursor-pointer">
                                      <Upload className="w-4 h-4 mr-1" />
                                      Upload
                                    </span>
                                  </Button>
                                </label>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {verificationStatus?.status === 'submitted' && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                    <h3 className="font-semibold mb-2">Documents Submitted</h3>
                    <p className="text-muted-foreground">
                      Your documents are being reviewed. This process typically takes 1-2 business days.
                      You'll receive a notification once the review is complete.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default KycOnboarding;