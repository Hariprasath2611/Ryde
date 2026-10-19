// ryde-capital/backend/src/jobs/settlePendingEarningsJob.ts
// Phase 5: Weekly Driver Earnings Settlement Job

import { earningsService } from '../modules/earnings/service.js';

export async function settlePendingEarningsJob(): Promise<{ settledCount: number; totalAmount: number }> {
  try {
    const results = await earningsService.settleWeeklyEarnings();
    const totalAmount = results.reduce((acc, r) => acc + (r.amount || 0), 0);
    if (results.length > 0) {
      console.log(
        `[SettlementJob] Successfully settled earnings for ${results.length} drivers, total amount: ₹${totalAmount}`,
      );
    }
    return {
      settledCount: results.length,
      totalAmount,
    };
  } catch (error) {
    console.error('[SettlementJob] Error running weekly earnings settlement job:', error);
    throw error;
  }
}
