// ryde-capital/backend/src/modules/driver/repository.ts
// Data access layer for Phase 2 driver onboarding, profile updates, and document tracking

import { supabaseServiceClient } from '../../config/supabase.js';
import type { Database, VehicleType } from '@ryde/shared';

export type DriverRow = Database['public']['Tables']['drivers']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type IdentityDocumentRow = Database['public']['Tables']['identity_documents']['Row'];
export type DrivingLicenseRow = Database['public']['Tables']['driving_licenses']['Row'];

export interface IDriverRepository {
  getDriverByUserId(userId: string): Promise<DriverRow | null>;
  getProfileById(userId: string): Promise<ProfileRow | null>;
  getIdentityDocumentByUserId(userId: string): Promise<IdentityDocumentRow | null>;
  getDrivingLicenseByDriverId(driverId: string): Promise<DrivingLicenseRow | null>;
  updateDriver(driverId: string, data: Partial<DriverRow>): Promise<DriverRow>;
  updateProfile(userId: string, data: Partial<ProfileRow>): Promise<ProfileRow>;
  upsertIdentityDocument(data: {
    user_id: string;
    document_type: string;
    masked_reference: string;
    file_path: string;
    verification_status?: Database['public']['Enums']['verification_status'];
  }): Promise<IdentityDocumentRow>;
  upsertDrivingLicense(data: {
    driver_id: string;
    license_number_masked: string;
    license_classes: VehicleType[];
    expiry_date: string;
    front_file_path: string;
    back_file_path?: string | null;
    file_path?: string | null;
    verification_status?: Database['public']['Enums']['verification_status'];
  }): Promise<DrivingLicenseRow>;
  createSignedUploadUrl(
    bucket: string,
    path: string,
  ): Promise<{ signedUrl: string; token: string; path: string }>;
  createSignedDownloadUrl(bucket: string, path: string, expiresIn: number): Promise<string>;
  createAuditLog(log: {
    user_id: string;
    action: string;
    entity_type: string;
    entity_id?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}

export class DriverRepository implements IDriverRepository {
  async getDriverByUserId(userId: string): Promise<DriverRow | null> {
    const { data, error } = await supabaseServiceClient
      .from('drivers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getProfileById(userId: string): Promise<ProfileRow | null> {
    const { data, error } = await supabaseServiceClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getIdentityDocumentByUserId(userId: string): Promise<IdentityDocumentRow | null> {
    const { data, error } = await supabaseServiceClient
      .from('identity_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getDrivingLicenseByDriverId(driverId: string): Promise<DrivingLicenseRow | null> {
    const { data, error } = await supabaseServiceClient
      .from('driving_licenses')
      .select('*')
      .eq('driver_id', driverId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async updateDriver(driverId: string, data: Partial<DriverRow>): Promise<DriverRow> {
    const { data: updated, error } = await supabaseServiceClient
      .from('drivers')
      .update(data)
      .eq('id', driverId)
      .select('*')
      .single();

    if (error) throw error;
    return updated;
  }

  async updateProfile(userId: string, data: Partial<ProfileRow>): Promise<ProfileRow> {
    const { data: updated, error } = await supabaseServiceClient
      .from('profiles')
      .update(data)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return updated;
  }

  async upsertIdentityDocument(data: {
    user_id: string;
    document_type: string;
    masked_reference: string;
    file_path: string;
    verification_status?: Database['public']['Enums']['verification_status'];
  }): Promise<IdentityDocumentRow> {
    // Check if an identity document already exists for this user
    const existing = await this.getIdentityDocumentByUserId(data.user_id);
    if (existing) {
      const { data: updated, error } = await supabaseServiceClient
        .from('identity_documents')
        .update({
          document_type: data.document_type,
          masked_reference: data.masked_reference,
          file_path: data.file_path,
          verification_status: data.verification_status ?? 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('*')
        .single();

      if (error) throw error;
      return updated;
    }

    const { data: inserted, error } = await supabaseServiceClient
      .from('identity_documents')
      .insert({
        user_id: data.user_id,
        document_type: data.document_type,
        masked_reference: data.masked_reference,
        file_path: data.file_path,
        verification_status: data.verification_status ?? 'pending',
      })
      .select('*')
      .single();

    if (error) throw error;
    return inserted;
  }

  async upsertDrivingLicense(data: {
    driver_id: string;
    license_number_masked: string;
    license_classes: VehicleType[];
    expiry_date: string;
    front_file_path: string;
    back_file_path?: string | null;
    file_path?: string | null;
    verification_status?: Database['public']['Enums']['verification_status'];
  }): Promise<DrivingLicenseRow> {
    const existing = await this.getDrivingLicenseByDriverId(data.driver_id);
    if (existing) {
      const { data: updated, error } = await supabaseServiceClient
        .from('driving_licenses')
        .update({
          license_number_masked: data.license_number_masked,
          license_classes: data.license_classes,
          expiry_date: data.expiry_date,
          front_file_path: data.front_file_path,
          back_file_path: data.back_file_path ?? existing.back_file_path,
          file_path: data.file_path ?? data.front_file_path,
          verification_status: data.verification_status ?? 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('*')
        .single();

      if (error) throw error;
      return updated;
    }

    const { data: inserted, error } = await supabaseServiceClient
      .from('driving_licenses')
      .insert({
        driver_id: data.driver_id,
        license_number_masked: data.license_number_masked,
        license_classes: data.license_classes,
        expiry_date: data.expiry_date,
        front_file_path: data.front_file_path,
        back_file_path: data.back_file_path ?? null,
        file_path: data.file_path ?? data.front_file_path,
        verification_status: data.verification_status ?? 'pending',
      })
      .select('*')
      .single();

    if (error) throw error;
    return inserted;
  }

  async createSignedUploadUrl(
    bucket: string,
    path: string,
  ): Promise<{ signedUrl: string; token: string; path: string }> {
    const { data, error } = await supabaseServiceClient.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error) throw error;
    return data;
  }

  async createSignedDownloadUrl(bucket: string, path: string, expiresIn: number): Promise<string> {
    const { data, error } = await supabaseServiceClient.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
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
      console.error('Failed to write audit log in driver repository:', error);
    }
  }
}

export const driverRepository = new DriverRepository();
