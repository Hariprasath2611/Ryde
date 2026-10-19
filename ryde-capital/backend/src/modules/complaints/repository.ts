// ryde-capital/backend/src/modules/complaints/repository.ts
// Phase 5: Complaints Repository

import { supabaseServiceClient } from '../../config/supabase.js';

export interface ComplaintRow {
  id: string;
  trip_id: string | null;
  reported_by: string;
  complaint_type: string;
  description: string;
  complaint_status: 'filed' | 'investigating' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
}

export interface IComplaintsRepository {
  createComplaint(data: {
    trip_id?: string | null;
    reported_by: string;
    complaint_type: string;
    description: string;
  }): Promise<ComplaintRow>;
  getComplaints(
    reportedBy: string,
    page: number,
    limit: number,
    status?: string,
  ): Promise<{ complaints: ComplaintRow[]; total: number }>;
}

export class ComplaintsRepository implements IComplaintsRepository {
  async createComplaint(data: {
    trip_id?: string | null;
    reported_by: string;
    complaint_type: string;
    description: string;
  }): Promise<ComplaintRow> {
    const { data: created, error } = await supabaseServiceClient
      .from('complaints')
      .insert({
        trip_id: data.trip_id || null,
        reported_by: data.reported_by,
        complaint_type: data.complaint_type,
        description: data.description,
        complaint_status: 'filed',
      })
      .select()
      .single();

    if (error || !created) {
      throw error || new Error('Failed to file complaint');
    }

    return created as ComplaintRow;
  }

  async getComplaints(
    reportedBy: string,
    page: number,
    limit: number,
    status?: string,
  ): Promise<{ complaints: ComplaintRow[]; total: number }> {
    let query = supabaseServiceClient
      .from('complaints')
      .select('*', { count: 'exact' })
      .eq('reported_by', reportedBy)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('complaint_status', status);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, count, error } = await query.range(from, to);

    if (error) {
      throw error;
    }

    return {
      complaints: (data as ComplaintRow[]) || [],
      total: count || 0,
    };
  }
}

export const complaintsRepository = new ComplaintsRepository();
