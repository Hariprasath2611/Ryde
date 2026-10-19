import { supabaseServiceClient } from '../../config/supabase.js';
import type { Database, UserRole, AccountStatus, VerificationStatus, AvailabilityStatus, VehicleType } from '@ryde/shared';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type DriverRow = Database['public']['Tables']['drivers']['Row'];

export interface IAuthRepository {
  getProfileById(userId: string): Promise<ProfileRow | null>;
  getDriverByUserId(userId: string): Promise<DriverRow | null>;
  upsertProfile(profile: {
    id: string;
    phone: string;
    email?: string | null;
    full_name?: string | null;
    role: UserRole;
    account_status: AccountStatus;
    phone_verified: boolean;
  }): Promise<ProfileRow>;
  createDriver(driver: {
    user_id: string;
    driver_code: string;
    verification_status: VerificationStatus;
    availability_status: AvailabilityStatus;
    allowed_vehicle_types: VehicleType[];
  }): Promise<DriverRow>;
  setAppMetadataRole(userId: string, role: UserRole): Promise<void>;
  createAuditLog(log: {
    user_id: string;
    action: string;
    entity_type: string;
    entity_id?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}

export class AuthRepository implements IAuthRepository {
  async getProfileById(userId: string): Promise<ProfileRow | null> {
    const { data, error } = await supabaseServiceClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getDriverByUserId(userId: string): Promise<DriverRow | null> {
    const { data, error } = await supabaseServiceClient
      .from('drivers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async upsertProfile(profile: {
    id: string;
    phone: string;
    email?: string | null;
    full_name?: string | null;
    role: UserRole;
    account_status: AccountStatus;
    phone_verified: boolean;
  }): Promise<ProfileRow> {
    const { data, error } = await supabaseServiceClient
      .from('profiles')
      .upsert(profile, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async createDriver(driver: {
    user_id: string;
    driver_code: string;
    verification_status: VerificationStatus;
    availability_status: AvailabilityStatus;
    allowed_vehicle_types: VehicleType[];
  }): Promise<DriverRow> {
    const { data, error } = await supabaseServiceClient
      .from('drivers')
      .insert(driver)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async setAppMetadataRole(userId: string, role: UserRole): Promise<void> {
    const { error } = await supabaseServiceClient.auth.admin.updateUserById(userId, {
      app_metadata: { role },
    });
    if (error) throw error;
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
      // Log audit failures without blocking execution
      console.error('Failed to write audit log:', error);
    }
  }
}

export const authRepository = new AuthRepository();
