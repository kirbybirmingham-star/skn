import { KYC } from 'kyc-kyb';

const kyc = new KYC({
  apiKey: process.env.KYC_PROVIDER_API_KEY,
});

export const startKycCheck = async (vendor) => {
  // Implementation for starting a KYC check
};

export const handleKycWebhook = async (payload) => {
  // Implementation for handling KYC webhooks
};
