// ryde-capital/backend/src/jobs/index.ts
// Background Jobs & Scheduled Tasks Registration

import { checkLicenseExpiryJob } from './licenseExpiryCheck.js';

export { checkLicenseExpiryJob };

export function startBackgroundJobs(): void {
  // In development/production, schedule daily license expiry check
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

  // Run on startup non-blocking
  checkLicenseExpiryJob().catch(err => {
    console.warn('Initial license expiry check failed:', err);
  });

  // Schedule daily interval
  setInterval(() => {
    checkLicenseExpiryJob().catch(err => {
      console.error('Scheduled daily license expiry check error:', err);
    });
  }, TWENTY_FOUR_HOURS_MS);
}
