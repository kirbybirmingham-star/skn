import cron from 'node-cron';
import { processPayouts } from './payouts.js';

// Schedule to run once a day at midnight
cron.schedule('0 0 * * *', () => {
  console.log('Running daily payout processing...');
  processPayouts();
});

console.log('Cron job for payouts scheduled.');
