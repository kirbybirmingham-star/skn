import dotenv from 'dotenv';
import path from 'path';
import fetch from 'node-fetch';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function main() {
  const onboardingToken = process.argv[2];
  if (!onboardingToken) {
    console.error('Usage: node scripts/simulate-webhook.js <onboarding_token>');
    process.exit(1);
  }

  const payload = {
    onboarding_token: onboardingToken,
    status: 'kyc_completed',
    details: { notes: 'Simulated webhook - identity verified', timestamp: new Date().toISOString() }
  };

  const url = `${process.env.SERVER_URL || 'http://localhost:3001'}/api/onboarding/webhook`;
  console.log('Posting webhook to', url);
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await res.json();
  console.log('Response:', res.status, data);
}

main().catch(err => { console.error(err); process.exit(1); });
