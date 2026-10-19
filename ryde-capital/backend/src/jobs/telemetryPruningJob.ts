// ryde-capital/backend/src/jobs/telemetryPruningJob.ts
// Phase 6 Task 2: Background retention job to prune stale trip and driver telemetry history (>30 days)

import { supabaseServiceClient } from '../config/supabase.js';
import { createLogger } from '@ryde/shared';

const logger = createLogger({ serviceName: 'telemetry-pruning-job' });

export interface PruneResult {
  success: boolean;
  prunedTripLocations: number;
  prunedDriverLocations: number;
  cutoffDate: string;
}

export async function pruneTelemetryJob(retentionDays = 30): Promise<PruneResult> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Attempt database stored procedure first
    const { data, error } = await supabaseServiceClient.rpc('prune_stale_telemetry', {
      retention_days: retentionDays,
    });

    if (!error && data && data.length > 0) {
      const tripCount = Number(data[0].pruned_trip_locations) || 0;
      const driverCount = Number(data[0].pruned_driver_locations) || 0;
      logger.info(
        { prunedTripLocations: tripCount, prunedDriverLocations: driverCount, retentionDays },
        `[TelemetryPruning] Successfully pruned telemetry older than ${retentionDays} days`,
      );
      return {
        success: true,
        prunedTripLocations: tripCount,
        prunedDriverLocations: driverCount,
        cutoffDate: cutoff,
      };
    }

    // Direct fallback deletion for environments where the RPC might not be migrated yet
    const { count: tripCount } = await supabaseServiceClient
      .from('trip_locations')
      .delete({ count: 'exact' })
      .lt('recorded_at', cutoff);

    const { count: driverCount } = await supabaseServiceClient
      .from('driver_locations')
      .delete({ count: 'exact' })
      .lt('updated_at', cutoff);

    logger.info(
      { prunedTripLocations: tripCount ?? 0, prunedDriverLocations: driverCount ?? 0, retentionDays },
      `[TelemetryPruning] Fallback pruned telemetry older than ${retentionDays} days`,
    );

    return {
      success: true,
      prunedTripLocations: tripCount ?? 0,
      prunedDriverLocations: driverCount ?? 0,
      cutoffDate: cutoff,
    };
  } catch (err) {
    logger.error({ err, retentionDays }, '[TelemetryPruning] Failed to prune stale telemetry');
    return {
      success: false,
      prunedTripLocations: 0,
      prunedDriverLocations: 0,
      cutoffDate: cutoff,
    };
  }
}
