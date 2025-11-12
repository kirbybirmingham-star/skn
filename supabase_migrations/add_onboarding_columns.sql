-- Add onboarding fields for KYC/KYB and seller onboarding
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS onboarding_status text DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS onboarding_token text,
  ADD COLUMN IF NOT EXISTS kyc_provider text,
  ADD COLUMN IF NOT EXISTS kyc_id text,
  ADD COLUMN IF NOT EXISTS kyb_id text,
  ADD COLUMN IF NOT EXISTS onboarding_data jsonb DEFAULT '{}'::jsonb;

-- Optional index for fast lookup by onboarding_token
CREATE INDEX IF NOT EXISTS vendors_onboarding_token_idx ON public.vendors(onboarding_token);
