// ryde-capital/backend/src/modules/admin/repository.ts
// Data access layer for Admin driver verification, document reviews, and audits

import { supabaseServiceClient } from '../../config/supabase.js';
import type { Database, DriverOnboardingStatus } from '@ryde/shared';

export type DriverRow = Database['public']['Tables']['drivers']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type IdentityDocumentRow = Database['public']['Tables']['identity_documents']['Row'];
export type DrivingLicenseRow = Database['public']['Tables']['driving_licenses']['Row'];

export interface AdminDriverListItem {
  id: string;
  user_id: string;
  driver_code: string;
  full_name: string | null;
  phone: string;
  city: string | null;
  state: string | null;
  onboarding_status: DriverOnboardingStatus;
  verification_status: string;
  submitted_at: string | null;
  created_at: string;
}

export interface IAdminRepository {
  listDrivers(
    status?: DriverOnboardingStatus,
    page?: number,
    limit?: number,
  ): Promise<{ drivers: AdminDriverListItem[]; total: number; page: number; limit: number }>;
  getDriverDetails(driverId: string): Promise<{
    driver: DriverRow;
    profile: ProfileRow;
    identityDocuments: IdentityDocumentRow[];
    drivingLicense: DrivingLicenseRow | null;
  } | null>;
  approveDriver(
    driverId: string,
    adminId: string,
  ): Promise<{ driver: DriverRow; profile: ProfileRow }>;
  rejectDriver(
    driverId: string,
    adminId: string,
    reason: string,
  ): Promise<{ driver: DriverRow; profile: ProfileRow }>;
  createSignedDownloadUrl(bucket: string, path: string, expiresIn: number): Promise<string>;
  createNotification(userId: string, title: string, body: string, type: string): Promise<void>;
  createAuditLog(log: {
    user_id: string;
    action: string;
    entity_type: string;
    entity_id?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}

export class AdminRepository implements IAdminRepository {
  async listDrivers(
    status?: DriverOnboardingStatus,
    page = 1,
    limit = 20,
  ): Promise<{ drivers: AdminDriverListItem[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;

    let query = supabaseServiceClient
      .from('drivers')
      .select(
        'id, user_id, driver_code, city, state, onboarding_status, verification_status, submitted_at, created_at, profiles!inner(full_name, phone)',
        { count: 'exact' },
      );

    if (status) {
      query = query.eq('onboarding_status', status);
    }

    const { data, count, error } = await query
      .order('submitted_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    interface RawDriverQueryRow {
      id: string;
      user_id: string;
      driver_code: string;
      city: string | null;
      state: string | null;
      onboarding_status: DriverOnboardingStatus;
      verification_status: string;
      submitted_at: string | null;
      created_at: string;
      profiles?: {
        full_name?: string | null;
        phone?: string | null;
      } | null;
    }

    const drivers: AdminDriverListItem[] = ((data as unknown as RawDriverQueryRow[]) || []).map(
      row => ({
        id: row.id,
        user_id: row.user_id,
        driver_code: row.driver_code,
        full_name: row.profiles?.full_name ?? null,
        phone: row.profiles?.phone ?? '',
        city: row.city,
        state: row.state,
        onboarding_status: row.onboarding_status,
        verification_status: row.verification_status,
        submitted_at: row.submitted_at,
        created_at: row.created_at,
      }),
    );

    return {
      drivers,
      total: count ?? drivers.length,
      page,
      limit,
    };
  }

  async getDriverDetails(driverId: string): Promise<{
    driver: DriverRow;
    profile: ProfileRow;
    identityDocuments: IdentityDocumentRow[];
    drivingLicense: DrivingLicenseRow | null;
  } | null> {
    const { data: driver, error: driverError } = await supabaseServiceClient
      .from('drivers')
      .select('*')
      .eq('id', driverId)
      .maybeSingle();

    if (driverError) throw driverError;
    if (!driver) return null;

    const { data: profile, error: profileError } = await supabaseServiceClient
      .from('profiles')
      .select('*')
      .eq('id', driver.user_id)
      .single();

    if (profileError) throw profileError;

    const { data: identityDocuments, error: idDocsError } = await supabaseServiceClient
      .from('identity_documents')
      .select('*')
      .eq('user_id', driver.user_id);

    if (idDocsError) throw idDocsError;

    const { data: drivingLicense, error: dlError } = await supabaseServiceClient
      .from('driving_licenses')
      .select('*')
      .eq('driver_id', driver.id)
      .maybeSingle();

    if (dlError) throw dlError;

    return {
      driver,
      profile,
      identityDocuments: identityDocuments || [],
      drivingLicense,
    };
  }

  async approveDriver(
    driverId: string,
    adminId: string,
  ): Promise<{ driver: DriverRow; profile: ProfileRow }> {
    const now = new Date().toISOString();

    // 1. Update driver status
    const { data: driver, error: driverErr } = await supabaseServiceClient
      .from('drivers')
      .update({
        onboarding_status: 'approved',
        verification_status: 'approved',
        approved_by: adminId,
        approved_at: now,
        rejection_reason: null,
      })
      .eq('id', driverId)
      .select('*')
      .single();

    if (driverErr) throw driverErr;

    // 2. Update identity documents
    await supabaseServiceClient
      .from('identity_documents')
      .update({
        verification_status: 'approved',
        reviewed_by: adminId,
        reviewed_at: now,
      })
      .eq('user_id', driver.user_id);

    // 3. Update driving license
    await supabaseServiceClient
      .from('driving_licenses')
      .update({
        verification_status: 'approved',
      })
      .eq('driver_id', driver.id);

    const { data: profile } = await supabaseServiceClient
      .from('profiles')
      .select('*')
      .eq('id', driver.user_id)
      .single();

    return { driver, profile: profile! };
  }

  async rejectDriver(
    driverId: string,
    adminId: string,
    reason: string,
  ): Promise<{ driver: DriverRow; profile: ProfileRow }> {
    const { data: driver, error: driverErr } = await supabaseServiceClient
      .from('drivers')
      .update({
        onboarding_status: 'rejected',
        verification_status: 'rejected',
        rejection_reason: reason,
        approved_by: adminId,
      })
      .eq('id', driverId)
      .select('*')
      .single();

    if (driverErr) throw driverErr;

    // Update driving license to rejected
    await supabaseServiceClient
      .from('driving_licenses')
      .update({
        verification_status: 'rejected',
      })
      .eq('driver_id', driver.id);

    const { data: profile } = await supabaseServiceClient
      .from('profiles')
      .select('*')
      .eq('id', driver.user_id)
      .single();

    return { driver, profile: profile! };
  }

  async createSignedDownloadUrl(bucket: string, path: string, expiresIn: number): Promise<string> {
    const { data, error } = await supabaseServiceClient.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  }

  async createNotification(
    userId: string,
    title: string,
    body: string,
    type: string,
  ): Promise<void> {
    const { error } = await supabaseServiceClient.from('notifications').insert({
      user_id: userId,
      title,
      body,
      type,
    });
    if (error) {
      console.error('Failed to create notification:', error);
    }
  }

  async createAuditLog(log: {
    user_id: string;
    action: string;
    entity_type: string;
    entity_id?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const { error } = await supabaseServiceClient.from('audit_logs').insert({
      user_id: log.user_id,
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id ?? null,
      metadata: log.metadata ?? {},
    });
    if (error) {
      console.error('Failed to write audit log in admin repository:', error);
    }
  }
}

export const adminRepository = new AdminRepository();
