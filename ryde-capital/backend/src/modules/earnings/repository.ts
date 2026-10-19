// ryde-capital/backend/src/modules/earnings/repository.ts
// Phase 5: Earnings and Payout Accounts Repository

import { supabaseServiceClient } from '../../config/supabase.js';
import type { Database } from '@ryde/shared';

export type DriverEarningsRow = Database['public']['Tables']['driver_earnings']['Row'];
export type PayoutAccountRow = Database['public']['Tables']['payout_accounts']['Row'];
export type PayoutAccountInsert = Database['public']['Tables']['payout_accounts']['Insert'];

export interface EarningsTripDetail {
  id: string;
  tripId: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  settlementStatus: string;
  createdAt: string;
  booking?: {
    pickupAddress: string;
    destinationAddress: string;
    vehicleType?: string;
  };
}

export interface IEarningsRepository {
  getDriverByUserId(userId: string): Promise<Database['public']['Tables']['drivers']['Row'] | null>;
  getEarningsSummary(driverId: string): Promise<{
    today: { gross: number; net: number; tripsCount: number };
    thisWeek: { gross: number; net: number; tripsCount: number };
    thisMonth: { gross: number; net: number; tripsCount: number };
    total: { gross: number; net: number; tripsCount: number };
    pendingSettlement: { amount: number; tripsCount: number };
  }>;
  getEarningsList(
    driverId: string,
    page: number,
    limit: number,
    period: string,
  ): Promise<{
    earnings: EarningsTripDetail[];
    total: number;
  }>;
  getPayoutAccounts(driverId: string): Promise<PayoutAccountRow[]>;
  getPayoutAccountById(driverId: string, id: string): Promise<PayoutAccountRow | null>;
  getDefaultPayoutAccount(driverId: string): Promise<PayoutAccountRow | null>;
  createPayoutAccount(data: PayoutAccountInsert): Promise<PayoutAccountRow>;
  setDefaultPayoutAccount(driverId: string, id: string): Promise<void>;
  deletePayoutAccount(driverId: string, id: string): Promise<void>;
  getPendingEarningsByDriver(): Promise<
    Array<{
      driverId: string;
      earningIds: string[];
      totalNet: number;
    }>
  >;
  markEarningsSettled(earningIds: string[]): Promise<void>;
}

export class EarningsRepository implements IEarningsRepository {
  async getDriverByUserId(userId: string): Promise<Database['public']['Tables']['drivers']['Row'] | null> {
    const { data, error } = await supabaseServiceClient
      .from('drivers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  }

  async getEarningsSummary(driverId: string) {
    const { data, error } = await supabaseServiceClient
      .from('driver_earnings')
      .select('gross_amount, platform_fee, net_amount, settlement_status, created_at')
      .eq('driver_id', driverId);

    if (error || !data) {
      return {
        today: { gross: 0, net: 0, tripsCount: 0 },
        thisWeek: { gross: 0, net: 0, tripsCount: 0 },
        thisMonth: { gross: 0, net: 0, tripsCount: 0 },
        total: { gross: 0, net: 0, tripsCount: 0 },
        pendingSettlement: { amount: 0, tripsCount: 0 },
      };
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Start of this week (Monday)
    const day = now.getDay();
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diffToMonday).getTime();

    // Start of this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let todayGross = 0;
    let todayNet = 0;
    let todayTrips = 0;

    let weekGross = 0;
    let weekNet = 0;
    let weekTrips = 0;

    let monthGross = 0;
    let monthNet = 0;
    let monthTrips = 0;

    let totalGross = 0;
    let totalNet = 0;
    let totalTrips = 0;

    let pendingAmount = 0;
    let pendingTrips = 0;

    for (const row of data) {
      const gross = Number(row.gross_amount);
      const net = Number(row.net_amount);
      const time = new Date(row.created_at).getTime();

      totalGross += gross;
      totalNet += net;
      totalTrips++;

      if (time >= startOfToday) {
        todayGross += gross;
        todayNet += net;
        todayTrips++;
      }

      if (time >= startOfWeek) {
        weekGross += gross;
        weekNet += net;
        weekTrips++;
      }

      if (time >= startOfMonth) {
        monthGross += gross;
        monthNet += net;
        monthTrips++;
      }

      if (row.settlement_status === 'pending') {
        pendingAmount += net;
        pendingTrips++;
      }
    }

    return {
      today: {
        gross: Math.round((todayGross + 1e-7) * 100) / 100,
        net: Math.round((todayNet + 1e-7) * 100) / 100,
        tripsCount: todayTrips,
      },
      thisWeek: {
        gross: Math.round((weekGross + 1e-7) * 100) / 100,
        net: Math.round((weekNet + 1e-7) * 100) / 100,
        tripsCount: weekTrips,
      },
      thisMonth: {
        gross: Math.round((monthGross + 1e-7) * 100) / 100,
        net: Math.round((monthNet + 1e-7) * 100) / 100,
        tripsCount: monthTrips,
      },
      total: {
        gross: Math.round((totalGross + 1e-7) * 100) / 100,
        net: Math.round((totalNet + 1e-7) * 100) / 100,
        tripsCount: totalTrips,
      },
      pendingSettlement: {
        amount: Math.round((pendingAmount + 1e-7) * 100) / 100,
        tripsCount: pendingTrips,
      },
    };
  }

  async getEarningsList(driverId: string, page: number, limit: number, period: string) {
    let query = supabaseServiceClient
      .from('driver_earnings')
      .select(
        `
        id,
        trip_id,
        gross_amount,
        platform_fee,
        net_amount,
        settlement_status,
        created_at,
        trip:trips(
          id,
          booking:bookings(
            pickup_address,
            destination_address,
            vehicle_type
          )
        )
      `,
        { count: 'exact' },
      )
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    const now = new Date();
    if (period === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      query = query.gte('created_at', startOfToday);
    } else if (period === 'week') {
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diffToMonday).toISOString();
      query = query.gte('created_at', startOfWeek);
    } else if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      query = query.gte('created_at', startOfMonth);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, count, error } = await query.range(from, to);

    if (error || !data) {
      return { earnings: [], total: 0 };
    }

    const earnings: EarningsTripDetail[] = data.map((item: any) => {
      const bookingData = item.trip?.booking;
      return {
        id: item.id,
        tripId: item.trip_id,
        grossAmount: Number(item.gross_amount),
        platformFee: Number(item.platform_fee),
        netAmount: Number(item.net_amount),
        settlementStatus: item.settlement_status,
        createdAt: item.created_at,
        booking: bookingData
          ? {
              pickupAddress: bookingData.pickup_address,
              destinationAddress: bookingData.destination_address,
              vehicleType: bookingData.vehicle_type,
            }
          : undefined,
      };
    });

    return {
      earnings,
      total: count || 0,
    };
  }

  async getPayoutAccounts(driverId: string): Promise<PayoutAccountRow[]> {
    const { data, error } = await supabaseServiceClient
      .from('payout_accounts')
      .select('*')
      .eq('driver_id', driverId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data;
  }

  async getPayoutAccountById(driverId: string, id: string): Promise<PayoutAccountRow | null> {
    const { data, error } = await supabaseServiceClient
      .from('payout_accounts')
      .select('*')
      .eq('driver_id', driverId)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  }

  async getDefaultPayoutAccount(driverId: string): Promise<PayoutAccountRow | null> {
    const { data, error } = await supabaseServiceClient
      .from('payout_accounts')
      .select('*')
      .eq('driver_id', driverId)
      .eq('is_default', true)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  }

  async createPayoutAccount(data: PayoutAccountInsert): Promise<PayoutAccountRow> {
    // If setting default, unset existing default first
    if (data.is_default) {
      await supabaseServiceClient
        .from('payout_accounts')
        .update({ is_default: false })
        .eq('driver_id', data.driver_id)
        .eq('is_default', true);
    }

    const { data: inserted, error } = await supabaseServiceClient
      .from('payout_accounts')
      .insert(data)
      .select()
      .single();

    if (error || !inserted) {
      throw error || new Error('Failed to create payout account');
    }

    return inserted;
  }

  async setDefaultPayoutAccount(driverId: string, id: string): Promise<void> {
    // 1. Unset all defaults for driver
    await supabaseServiceClient
      .from('payout_accounts')
      .update({ is_default: false })
      .eq('driver_id', driverId);

    // 2. Set this one to default
    const { error } = await supabaseServiceClient
      .from('payout_accounts')
      .update({ is_default: true })
      .eq('driver_id', driverId)
      .eq('id', id);

    if (error) throw error;
  }

  async deletePayoutAccount(driverId: string, id: string): Promise<void> {
    const { error } = await supabaseServiceClient
      .from('payout_accounts')
      .delete()
      .eq('driver_id', driverId)
      .eq('id', id);

    if (error) throw error;
  }

  async getPendingEarningsByDriver() {
    const { data, error } = await supabaseServiceClient
      .from('driver_earnings')
      .select('id, driver_id, net_amount')
      .eq('settlement_status', 'pending');

    if (error || !data || data.length === 0) return [];

    const grouped = new Map<string, { earningIds: string[]; totalNet: number }>();
    for (const row of data) {
      const existing = grouped.get(row.driver_id) || { earningIds: [], totalNet: 0 };
      existing.earningIds.push(row.id);
      existing.totalNet += Number(row.net_amount);
      grouped.set(row.driver_id, existing);
    }

    return Array.from(grouped.entries()).map(([driverId, val]) => ({
      driverId,
      earningIds: val.earningIds,
      totalNet: Math.round((val.totalNet + 1e-7) * 100) / 100,
    }));
  }

  async markEarningsSettled(earningIds: string[]): Promise<void> {
    if (earningIds.length === 0) return;
    const { error } = await supabaseServiceClient
      .from('driver_earnings')
      .update({ settlement_status: 'settled' })
      .in('id', earningIds);

    if (error) throw error;
  }
}

export const earningsRepository = new EarningsRepository();
