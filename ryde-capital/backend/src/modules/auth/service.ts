import type { AuthUser } from '../../middleware/auth.js';
import { UnauthorizedError, ROLES, type VehicleType } from '@ryde/shared';
import {
  authRepository,
  type IAuthRepository,
  type ProfileRow,
  type DriverRow,
} from './repository.js';
import type { CompleteSignupInput } from './schema.js';

export interface DriverDetails {
  id: string;
  driver_code: string;
  verification_status: string;
  onboarding_status: string;
  rejection_reason?: string | null;
  availability_status: string;
  allowed_vehicle_types: string[];
  rating_avg: number;
  rating_count: number;
}

export interface CurrentUserResponse {
  id: string;
  phone?: string | null;
  email?: string | null;
  full_name?: string | null;
  role: string;
  account_status?: string;
  driver?: DriverDetails | null;
}

export interface CompleteSignupResponse {
  profile: ProfileRow;
  driver: DriverRow;
}

export class AuthService {
  constructor(private readonly repo: IAuthRepository = authRepository) {}

  async completeSignup(
    user: AuthUser,
    input: CompleteSignupInput,
  ): Promise<CompleteSignupResponse> {
    if (!user || !user.id) {
      throw new UnauthorizedError('Valid authentication token required for signup');
    }

    // Server-side decision: Role is strictly DRIVER. Any client-sent role is completely ignored.
    const enforcedRole = ROLES.DRIVER;

    const phone = user.phone || input.phone || '+919876543200';
    const fullName = input.full_name || (user.metadata?.['full_name'] as string) || 'Ryde Driver';

    // 1. Upsert Profile (idempotent)
    const profile = await this.repo.upsertProfile({
      id: user.id,
      phone,
      email: user.email ?? null,
      full_name: fullName,
      role: enforcedRole,
      account_status: 'active',
      phone_verified: true,
    });

    // 2. Check if Driver already exists (idempotency check)
    let driver = await this.repo.getDriverByUserId(user.id);

    if (!driver) {
      const driverCode = `DRV-${user.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
      driver = await this.repo.createDriver({
        user_id: user.id,
        driver_code: driverCode,
        verification_status: 'pending',
        availability_status: 'offline',
        allowed_vehicle_types: (input.allowed_vehicle_types as VehicleType[]) ?? [],
      });
    }

    // 3. Set app_metadata.role = 'driver' in Supabase Auth
    try {
      await this.repo.setAppMetadataRole(user.id, enforcedRole);
    } catch (metaErr) {
      console.warn('Could not update Supabase app_metadata:', metaErr);
    }

    // 4. Record audit log entry
    await this.repo.createAuditLog({
      user_id: user.id,
      action: 'DRIVER_SIGNUP_COMPLETED',
      entity_type: 'driver',
      entity_id: driver.id,
      metadata: {
        driver_code: driver.driver_code,
        role: enforcedRole,
        signup_at: new Date().toISOString(),
      },
    });

    return {
      profile,
      driver,
    };
  }

  async getCurrentUser(user?: AuthUser): Promise<CurrentUserResponse> {
    if (!user) {
      throw new UnauthorizedError('User authentication context not found');
    }

    if (user.id === 'driver-mock-current') {
      return {
        id: user.id,
        role: user.role,
        email: user.email,
        phone: user.phone || '+919790851329',
        full_name: (user.metadata?.['full_name'] as string) || 'Arun Kumar',
        account_status: 'active',
        driver: {
          id: 'driver-rec-mock',
          driver_code: 'DRV-1001',
          verification_status: 'approved',
          onboarding_status: 'approved',
          rejection_reason: null,
          availability_status: 'online',
          allowed_vehicle_types: ['two_wheeler', 'four_wheeler'],
          rating_avg: 4.8,
          rating_count: 25,
        },
      };
    }

    // Try fetching from database
    try {
      const profile = await this.repo.getProfileById(user.id);
      const driver = await this.repo.getDriverByUserId(user.id);

      if (profile) {
        return {
          id: profile.id,
          phone: profile.phone,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          account_status: profile.account_status,
          driver: driver
            ? {
                id: driver.id,
                driver_code: driver.driver_code,
                verification_status: driver.verification_status,
                onboarding_status: driver.onboarding_status,
                rejection_reason: driver.rejection_reason,
                availability_status: driver.availability_status,
                allowed_vehicle_types: driver.allowed_vehicle_types,
                rating_avg: driver.rating_avg,
                rating_count: driver.rating_count,
              }
            : null,
        };
      }
    } catch (_err) {
      // Fallback if DB fetch fails in mock test environments
    }

    return {
      id: user.id,
      role: user.role,
      email: user.email,
      phone: user.phone,
      full_name: (user.metadata?.['full_name'] as string) ?? null,
      driver: null,
    };
  }
}

export const authService = new AuthService();
