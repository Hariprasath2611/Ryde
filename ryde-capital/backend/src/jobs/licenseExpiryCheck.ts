// ryde-capital/backend/src/jobs/licenseExpiryCheck.ts
// Daily job that flags drivers whose driving license has expired (verification_status = expired)

import { supabaseServiceClient } from '../config/supabase.js';

export interface LicenseExpiryCheckResult {
  checkedAt: string;
  expiredCount: number;
  affectedDriverIds: string[];
}

export async function checkLicenseExpiryJob(): Promise<LicenseExpiryCheckResult> {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  // Find driving licenses that have expired
  const { data: expiredLicenses, error: fetchErr } = await supabaseServiceClient
    .from('driving_licenses')
    .select('id, driver_id, expiry_date, verification_status')
    .lt('expiry_date', today!);

  if (fetchErr) {
    console.error('Error fetching expired licenses:', fetchErr);
    throw fetchErr;
  }

  const affectedDriverIds: string[] = [];

  for (const lic of expiredLicenses || []) {
    // Check if the driver is currently approved or pending (not yet marked expired)
    const { data: driver } = await supabaseServiceClient
      .from('drivers')
      .select('id, user_id, verification_status, availability_status')
      .eq('id', lic.driver_id)
      .single();

    if (driver && driver.verification_status !== 'expired') {
      affectedDriverIds.push(driver.id);

      // Update driver verification status to expired and take offline
      await supabaseServiceClient
        .from('drivers')
        .update({
          verification_status: 'expired',
          availability_status: 'offline',
        })
        .eq('id', driver.id);

      // Update driving license status to expired
      await supabaseServiceClient
        .from('driving_licenses')
        .update({
          verification_status: 'expired',
        })
        .eq('id', lic.id);

      // Notify the driver
      await supabaseServiceClient.from('notifications').insert({
        user_id: driver.user_id,
        title: 'Action Required: License Expired',
        body: 'Your driving license has expired. Your driver profile verification has been paused and your status set to offline. Please upload your renewed license to resume trips.',
        type: 'license_expired',
      });

      // Write audit log
      await supabaseServiceClient.from('audit_logs').insert({
        user_id: driver.user_id,
        action: 'DRIVER_LICENSE_EXPIRED_FLAGGED',
        entity_type: 'driver',
        entity_id: driver.id,
        metadata: {
          expiry_date: lic.expiry_date,
          job_run_at: now,
        },
      });
    }
  }

  return {
    checkedAt: now,
    expiredCount: affectedDriverIds.length,
    affectedDriverIds,
  };
}
