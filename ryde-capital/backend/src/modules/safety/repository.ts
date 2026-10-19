// ryde-capital/backend/src/modules/safety/repository.ts
// Phase 5: Safety, Emergency Contacts, SOS Events & Trip Shares Repository

import { supabaseServiceClient } from '../../config/supabase.js';
import type {
  CreateEmergencyContactInput,
  UpdateEmergencyContactInput,
} from './schema.js';

export interface EmergencyContactRow {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  relationship: string | null;
  created_at: string;
  updated_at: string;
}

export interface SosEventRow {
  id: string;
  trip_id: string;
  triggered_by: string;
  location: unknown;
  sos_status: 'triggered' | 'investigating' | 'resolved' | 'cancelled';
  reverse_geocoded_address: string | null;
  notes: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  triggered_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TripShareRow {
  id: string;
  trip_id: string;
  share_token: string;
  expires_at: string;
  created_at: string;
}

export interface ISafetyRepository {
  getEmergencyContacts(userId: string): Promise<EmergencyContactRow[]>;
  countEmergencyContacts(userId: string): Promise<number>;
  createEmergencyContact(
    userId: string,
    contact: CreateEmergencyContactInput,
  ): Promise<EmergencyContactRow>;
  getEmergencyContactById(
    userId: string,
    contactId: string,
  ): Promise<EmergencyContactRow | null>;
  updateEmergencyContact(
    userId: string,
    contactId: string,
    contact: UpdateEmergencyContactInput,
  ): Promise<EmergencyContactRow>;
  deleteEmergencyContact(userId: string, contactId: string): Promise<boolean>;
  getRecentSosForTrip(tripId: string, windowSeconds: number): Promise<SosEventRow | null>;
  createSosEvent(data: {
    trip_id: string;
    triggered_by: string;
    latitude: number;
    longitude: number;
    reverse_geocoded_address?: string;
    notes?: string;
  }): Promise<SosEventRow>;
  getSosEventById(id: string): Promise<SosEventRow | null>;
  cancelSosEvent(id: string, notes?: string): Promise<SosEventRow>;
  acknowledgeSosEvent(id: string, acknowledgedBy: string, notes?: string): Promise<SosEventRow>;
  resolveSosEvent(id: string, resolvedBy: string, notes: string): Promise<SosEventRow>;
  listOpenSosEvents(): Promise<Array<SosEventRow & { driver_name?: string; driver_phone?: string }>>;
  createTripShare(tripId: string, token: string, expiresAt: string): Promise<TripShareRow>;
  getTripShareByToken(token: string): Promise<TripShareRow | null>;
  logAudit(data: {
    userId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}

export class SafetyRepository implements ISafetyRepository {
  async getEmergencyContacts(userId: string): Promise<EmergencyContactRow[]> {
    const { data, error } = await supabaseServiceClient
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as EmergencyContactRow[]) || [];
  }

  async countEmergencyContacts(userId: string): Promise<number> {
    const { count, error } = await supabaseServiceClient
      .from('emergency_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) return 0;
    return count || 0;
  }

  async createEmergencyContact(
    userId: string,
    contact: CreateEmergencyContactInput,
  ): Promise<EmergencyContactRow> {
    const { data, error } = await supabaseServiceClient
      .from('emergency_contacts')
      .insert({
        user_id: userId,
        name: contact.name,
        phone: contact.phone.trim(),
        relationship: contact.relationship,
      })
      .select()
      .single();

    if (error || !data) {
      throw error || new Error('Failed to create emergency contact');
    }
    return data as EmergencyContactRow;
  }

  async getEmergencyContactById(
    userId: string,
    contactId: string,
  ): Promise<EmergencyContactRow | null> {
    const { data, error } = await supabaseServiceClient
      .from('emergency_contacts')
      .select('*')
      .eq('id', contactId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return data as EmergencyContactRow;
  }

  async updateEmergencyContact(
    userId: string,
    contactId: string,
    contact: UpdateEmergencyContactInput,
  ): Promise<EmergencyContactRow> {
    const updatePayload: Record<string, unknown> = {};
    if (contact.name !== undefined) updatePayload['name'] = contact.name;
    if (contact.relationship !== undefined) updatePayload['relationship'] = contact.relationship;
    if (contact.phone !== undefined) updatePayload['phone'] = contact.phone.trim();

    const { data, error } = await supabaseServiceClient
      .from('emergency_contacts')
      .update(updatePayload)
      .eq('id', contactId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error('Failed to update emergency contact');
    }
    return data as EmergencyContactRow;
  }

  async deleteEmergencyContact(userId: string, contactId: string): Promise<boolean> {
    const { error, count } = await supabaseServiceClient
      .from('emergency_contacts')
      .delete()
      .eq('id', contactId)
      .eq('user_id', userId);

    if (error) throw error;
    return (count || 0) > 0;
  }

  async getRecentSosForTrip(tripId: string, windowSeconds: number): Promise<SosEventRow | null> {
    const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();
    const { data, error } = await supabaseServiceClient
      .from('sos_events')
      .select('*')
      .eq('trip_id', tripId)
      .gte('triggered_at', windowStart)
      .neq('sos_status', 'cancelled')
      .order('triggered_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as SosEventRow;
  }

  async createSosEvent(data: {
    trip_id: string;
    triggered_by: string;
    latitude: number;
    longitude: number;
    reverse_geocoded_address?: string;
    notes?: string;
  }): Promise<SosEventRow> {
    // PostGIS point string: POINT(lng lat)
    const pointStr = `POINT(${data.longitude} ${data.latitude})`;

    const { data: created, error } = await supabaseServiceClient
      .from('sos_events')
      .insert({
        trip_id: data.trip_id,
        triggered_by: data.triggered_by,
        location: pointStr,
        sos_status: 'triggered',
        reverse_geocoded_address: data.reverse_geocoded_address || null,
        notes: data.notes || null,
        triggered_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !created) {
      throw error || new Error('Failed to create SOS event');
    }
    return created as SosEventRow;
  }

  async getSosEventById(id: string): Promise<SosEventRow | null> {
    const { data, error } = await supabaseServiceClient
      .from('sos_events')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return data as SosEventRow;
  }

  async cancelSosEvent(id: string, notes?: string): Promise<SosEventRow> {
    const { data, error } = await supabaseServiceClient
      .from('sos_events')
      .update({
        sos_status: 'cancelled',
        notes: notes || 'Cancelled as false alarm',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error('Failed to cancel SOS event');
    }
    return data as SosEventRow;
  }

  async acknowledgeSosEvent(
    id: string,
    acknowledgedBy: string,
    notes?: string,
  ): Promise<SosEventRow> {
    const updatePayload: Record<string, unknown> = {
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: acknowledgedBy,
      sos_status: 'investigating',
    };
    if (notes) updatePayload['notes'] = notes;

    const { data, error } = await supabaseServiceClient
      .from('sos_events')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error('Failed to acknowledge SOS event');
    }
    return data as SosEventRow;
  }

  async resolveSosEvent(id: string, resolvedBy: string, notes: string): Promise<SosEventRow> {
    const { data, error } = await supabaseServiceClient
      .from('sos_events')
      .update({
        sos_status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
        notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error('Failed to resolve SOS event');
    }
    return data as SosEventRow;
  }

  async listOpenSosEvents(): Promise<Array<SosEventRow & { driver_name?: string; driver_phone?: string }>> {
    const { data, error } = await supabaseServiceClient
      .from('sos_events')
      .select(`
        *,
        triggered_profile:triggered_by(full_name, phone)
      `)
      .in('sos_status', ['triggered', 'investigating'])
      .order('triggered_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      ...row,
      driver_name: row.triggered_profile?.full_name || 'Driver',
      driver_phone: row.triggered_profile?.phone || '',
    }));
  }

  async createTripShare(tripId: string, token: string, expiresAt: string): Promise<TripShareRow> {
    const { data, error } = await supabaseServiceClient
      .from('trip_shares')
      .insert({
        trip_id: tripId,
        share_token: token,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error || !data) {
      throw error || new Error('Failed to create trip share token');
    }
    return data as TripShareRow;
  }

  async getTripShareByToken(token: string): Promise<TripShareRow | null> {
    const { data, error } = await supabaseServiceClient
      .from('trip_shares')
      .select('*')
      .eq('share_token', token)
      .maybeSingle();

    if (error || !data) return null;
    return data as TripShareRow;
  }

  async logAudit(data: {
    userId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await supabaseServiceClient
      .from('audit_logs')
      .insert({
        user_id: data.userId || null,
        action: data.action,
        entity_type: data.entityType,
        entity_id: data.entityId ? String(data.entityId) : null,
        metadata: data.metadata || {},
      })
      .then(
        () => {},
        (err) => console.warn('[AuditLog] Warning: failed to record audit log:', err),
      );
  }
}

export const safetyRepository = new SafetyRepository();
