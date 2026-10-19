// ryde-capital/backend/src/jobs/index.ts
// Background Jobs & Scheduled Tasks Registration

import { checkLicenseExpiryJob } from './licenseExpiryCheck.js';
import { checkStaleDriversJob } from './staleDriverCheck.js';
import { checkStaleWaitingTripsJob } from './staleWaitingTripCheck.js';
import { settlePendingEarningsJob } from './settlePendingEarningsJob.js';

export {
  checkLicenseExpiryJob,
  checkStaleDriversJob,
  checkStaleWaitingTripsJob,
  settlePendingEarningsJob,
};


export function startBackgroundJobs(): void {
  // In development/production, schedule daily license expiry check
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const THIRTY_SECONDS_MS = 30 * 1000;
  const SIXTY_SECONDS_MS = 60 * 1000;

  // Run initial checks non-blocking
  checkLicenseExpiryJob().catch((err) => {
    console.warn('Initial license expiry check failed:', err);
  });

  checkStaleDriversJob().catch((err) => {
    console.warn('Initial stale driver check failed:', err);
  });

  checkStaleWaitingTripsJob().catch((err) => {
    console.warn('Initial stale waiting trip check failed:', err);
  });

  // Schedule daily interval for license expiry
  setInterval(() => {
    checkLicenseExpiryJob().catch((err) => {
      console.error('Scheduled daily license expiry check error:', err);
    });
  }, TWENTY_FOUR_HOURS_MS);

  // Schedule 30-second interval for stale driver check
  setInterval(() => {
    checkStaleDriversJob().catch((err) => {
      console.error('Scheduled stale driver check error:', err);
    });
  }, THIRTY_SECONDS_MS);

  // Schedule 60-second interval for stale waiting trip cancel check
  setInterval(() => {
    checkStaleWaitingTripsJob().catch((err) => {
      console.error('Scheduled stale waiting trip check error:', err);
    });
  }, SIXTY_SECONDS_MS);
}

