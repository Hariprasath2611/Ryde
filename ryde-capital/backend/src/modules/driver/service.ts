// ryde-capital/backend/src/modules/driver/service.ts
// Business logic for Phase 2 driver onboarding, checklist calculation, upload URLs, and review submission

import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  defaultIdentityVerificationProvider,
  type VehicleType,
} from '@ryde/shared';
import {
  driverRepository,
  type IDriverRepository,
  type DriverRow,
  type ProfileRow,
  type IdentityDocumentRow,
  type DrivingLicenseRow,
} from './repository.js';
import type {
  UpdateDriverProfileInput,
  CreateUploadUrlInput,
  ConfirmDocumentInput,
  RecordConsentInput,
  DeleteAccountInput,
} from './schema.js';
import {
  isLicenseExpiryValid,
  validateLicenseCoversVehicleTypes,
} from '../../config/licenseVehicleMapping.js';

export interface ChecklistStep {
  name: string;
  status: 'completed' | 'pending';
  details: Record<string, unknown>;
}

export interface OnboardingChecklist {
  status: DriverRow['onboarding_status'];
  rejectionReason: string | null;
  submittedAt: string | null;
  progressPercentage: number;
  completedStepsCount: number;
  totalStepsCount: number;
  canSubmit: boolean;
  steps: {
    personalDetails: ChecklistStep;
    vehicleTypes: ChecklistStep;
    idProof: ChecklistStep;
    license: ChecklistStep;
    selfie: ChecklistStep;
  };
}

export interface DriverProfileAndChecklistResponse {
  driver: DriverRow;
  profile: ProfileRow;
  onboarding: OnboardingChecklist;
}

export class DriverService {
  constructor(private readonly repo: IDriverRepository = driverRepository) {}

  async getProfile(userId: string): Promise<DriverProfileAndChecklistResponse> {
    const driver = await this.repo.getDriverByUserId(userId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found. Complete signup first.');
    }

    const profile = await this.repo.getProfileById(userId);
    if (!profile) {
      throw new NotFoundError('User profile not found.');
    }

    const idDoc = await this.repo.getIdentityDocumentByUserId(userId);
    const license = await this.repo.getDrivingLicenseByDriverId(driver.id);

    const onboarding = this.calculateChecklist(driver, profile, idDoc, license);

    return {
      driver,
      profile,
      onboarding,
    };
  }

  async updateProfile(
    userId: string,
    input: UpdateDriverProfileInput,
  ): Promise<DriverProfileAndChecklistResponse> {
    const driver = await this.repo.getDriverByUserId(userId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    // Do not allow mutation while actively under review
    if (driver.onboarding_status === 'under_review' || driver.onboarding_status === 'submitted') {
      throw new ForbiddenError(
        'Cannot update profile while documents are under review. Please wait for an approval or rejection decision.',
      );
    }

    // Update profile full_name if provided
    if (input.fullName) {
      await this.repo.updateProfile(userId, { full_name: input.fullName });
    }

    const driverUpdates: Partial<DriverRow> = {};
    if (input.dateOfBirth !== undefined) driverUpdates.date_of_birth = input.dateOfBirth;
    if (input.addressLine !== undefined) driverUpdates.address_line = input.addressLine;
    if (input.city !== undefined) driverUpdates.city = input.city;
    if (input.state !== undefined) driverUpdates.state = input.state;
    if (input.pincode !== undefined) driverUpdates.pincode = input.pincode;
    if (input.experienceYears !== undefined) driverUpdates.experience_years = input.experienceYears;
    if (input.allowedVehicleTypes !== undefined) {
      driverUpdates.allowed_vehicle_types = input.allowedVehicleTypes;
    }

    // If starting onboarding, transition not_started -> in_progress
    if (driver.onboarding_status === 'not_started') {
      driverUpdates.onboarding_status = 'in_progress';
    }

    await this.repo.updateDriver(driver.id, driverUpdates);

    return this.getProfile(userId);
  }

  async createUploadUrl(
    userId: string,
    input: CreateUploadUrlInput,
  ): Promise<{ signedUrl: string; filePath: string; token: string; expiresIn: number }> {
    const driver = await this.repo.getDriverByUserId(userId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    if (driver.onboarding_status === 'under_review' || driver.onboarding_status === 'submitted') {
      throw new ForbiddenError('Cannot upload documents while profile is under review.');
    }

    let bucket = 'driver-docs';
    if (input.type === 'id_proof') {
      bucket = 'identity-docs';
    }

    const ext =
      input.contentType === 'application/pdf'
        ? 'pdf'
        : input.contentType === 'image/png'
          ? 'png'
          : 'jpg';
    const filePath = `${userId}/${input.type}_${Date.now()}.${ext}`;

    const uploadData = await this.repo.createSignedUploadUrl(bucket, filePath);

    return {
      signedUrl: uploadData.signedUrl,
      filePath,
      token: uploadData.token,
      expiresIn: 900, // 15 minutes
    };
  }

  async confirmDocument(
    userId: string,
    input: ConfirmDocumentInput,
  ): Promise<DriverProfileAndChecklistResponse> {
    const driver = await this.repo.getDriverByUserId(userId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    // Security check: ensure path belongs to the requesting driver's userId
    if (!input.filePath.startsWith(`${userId}/`)) {
      throw new ForbiddenError(
        'Unauthorized: Driver can only upload and confirm their own documents.',
      );
    }

    if (input.type === 'id_proof') {
      if (!input.maskedReference) {
        throw new BadRequestError(
          'Masked reference is required for identity proof (e.g. XXXX-5678)',
        );
      }
      await this.repo.upsertIdentityDocument({
        user_id: userId,
        document_type: input.documentType || 'aadhaar',
        masked_reference: input.maskedReference,
        file_path: input.filePath,
      });
    } else if (input.type === 'profile_photo') {
      await this.repo.updateDriver(driver.id, {
        profile_photo_path: input.filePath,
      });
    } else if (input.type === 'license_front' || input.type === 'license_back') {
      const existingLicense = await this.repo.getDrivingLicenseByDriverId(driver.id);

      const frontPath =
        input.type === 'license_front'
          ? input.filePath
          : input.frontFilePath || existingLicense?.front_file_path || input.filePath;
      const backPath =
        input.type === 'license_back'
          ? input.filePath
          : input.backFilePath || existingLicense?.back_file_path || null;
      const maskedNumber =
        input.licenseNumberMasked || existingLicense?.license_number_masked || 'DL-XXXX-0000';
      const licenseClasses =
        (input.licenseClasses as VehicleType[]) ||
        existingLicense?.license_classes ||
        driver.allowed_vehicle_types;
      const expiryDate = input.expiryDate || existingLicense?.expiry_date || '2030-12-31';

      if (input.expiryDate && !isLicenseExpiryValid(input.expiryDate)) {
        throw new BadRequestError('Driving license expiry date must be strictly in the future.');
      }

      await this.repo.upsertDrivingLicense({
        driver_id: driver.id,
        license_number_masked: maskedNumber,
        license_classes: licenseClasses,
        expiry_date: expiryDate,
        front_file_path: frontPath,
        back_file_path: backPath,
        file_path: frontPath,
      });
    }

    // Advance not_started -> in_progress
    if (driver.onboarding_status === 'not_started') {
      await this.repo.updateDriver(driver.id, { onboarding_status: 'in_progress' });
    }

    return this.getProfile(userId);
  }

  async submitForReview(userId: string): Promise<DriverProfileAndChecklistResponse> {
    const { driver, profile, onboarding } = await this.getProfile(userId);

    if (!onboarding.canSubmit) {
      throw new BadRequestError(
        'Onboarding checklist is incomplete. Please finish all 5 checklist steps before submitting for review.',
      );
    }

    if (driver.onboarding_status === 'submitted' || driver.onboarding_status === 'under_review') {
      throw new BadRequestError(
        'Driver onboarding has already been submitted and is awaiting admin review.',
      );
    }

    if (driver.onboarding_status === 'approved') {
      throw new BadRequestError('Driver profile is already approved.');
    }

    // Call Identity Verification Provider (Mock KYC auto-pass unless test phone / flag)
    const verificationResult = await defaultIdentityVerificationProvider.verify({
      documentType: 'driving_license',
      maskedReference: onboarding.steps.license.details['licenseNumber'] as string,
      phoneNumber: profile.phone,
    });

    if (!verificationResult.verified) {
      throw new BadRequestError(
        verificationResult.reason ||
          'Identity verification check failed. Please verify your document details.',
      );
    }

    // Transition to submitted
    const updatedDriver = await this.repo.updateDriver(driver.id, {
      onboarding_status: 'submitted',
      submitted_at: new Date().toISOString(),
      rejection_reason: null,
    });

    // Write audit log
    await this.repo.createAuditLog({
      user_id: userId,
      action: 'DRIVER_ONBOARDING_SUBMITTED',
      entity_type: 'driver',
      entity_id: driver.id,
      metadata: {
        driver_code: driver.driver_code,
        allowed_vehicle_types: driver.allowed_vehicle_types,
        submitted_at: new Date().toISOString(),
      },
    });

    return {
      driver: updatedDriver,
      profile,
      onboarding: {
        ...onboarding,
        status: 'submitted',
        rejectionReason: null,
        submittedAt: updatedDriver.submitted_at,
        canSubmit: false,
      },
    };
  }

  private calculateChecklist(
    driver: DriverRow,
    profile: ProfileRow,
    idDoc: IdentityDocumentRow | null,
    license: DrivingLicenseRow | null,
  ): OnboardingChecklist {
    // 1. Personal Details
    const hasDob = Boolean(driver.date_of_birth);
    const hasAddress = Boolean(
      driver.address_line && driver.city && driver.state && driver.pincode,
    );
    const hasExp = driver.experience_years !== null && driver.experience_years !== undefined;
    const personalDetailsComplete = hasDob && hasAddress && hasExp;

    // 2. Vehicle Types
    const vehicleTypesComplete = Boolean(
      driver.allowed_vehicle_types && driver.allowed_vehicle_types.length > 0,
    );

    // 3. ID Proof
    const idProofComplete = Boolean(idDoc && idDoc.file_path && idDoc.masked_reference);

    // 4. Driving License
    const hasLicenseFiles = Boolean(license && license.front_file_path && license.back_file_path);
    const hasLicenseNumber = Boolean(license && license.license_number_masked);
    const isExpiryFuture = license ? isLicenseExpiryValid(license.expiry_date) : false;
    const licenseCoverage = license
      ? validateLicenseCoversVehicleTypes(license.license_classes, driver.allowed_vehicle_types)
      : { valid: false, missingVehicleTypes: driver.allowed_vehicle_types };
    const licenseComplete =
      hasLicenseFiles && hasLicenseNumber && isExpiryFuture && licenseCoverage.valid;

    // 5. Driver Selfie / Profile Photo
    const selfieComplete = Boolean(driver.profile_photo_path);

    const completedCount = [
      personalDetailsComplete,
      vehicleTypesComplete,
      idProofComplete,
      licenseComplete,
      selfieComplete,
    ].filter(Boolean).length;

    const isAllComplete = completedCount === 5;
    const isAllowedState =
      driver.onboarding_status === 'not_started' ||
      driver.onboarding_status === 'in_progress' ||
      driver.onboarding_status === 'rejected';

    return {
      status: driver.onboarding_status,
      rejectionReason: driver.rejection_reason,
      submittedAt: driver.submitted_at,
      progressPercentage: Math.round((completedCount / 5) * 100),
      completedStepsCount: completedCount,
      totalStepsCount: 5,
      canSubmit: isAllComplete && isAllowedState,
      steps: {
        personalDetails: {
          name: 'Personal Details',
          status: personalDetailsComplete ? 'completed' : 'pending',
          details: {
            fullName: profile.full_name,
            dateOfBirth: driver.date_of_birth,
            addressLine: driver.address_line,
            city: driver.city,
            state: driver.state,
            pincode: driver.pincode,
            experienceYears: driver.experience_years,
          },
        },
        vehicleTypes: {
          name: 'Allowed Vehicle Types',
          status: vehicleTypesComplete ? 'completed' : 'pending',
          details: {
            allowedVehicleTypes: driver.allowed_vehicle_types,
          },
        },
        idProof: {
          name: 'Identity Document Proof',
          status: idProofComplete ? 'completed' : 'pending',
          details: {
            documentType: idDoc?.document_type ?? null,
            maskedReference: idDoc?.masked_reference ?? null,
            filePath: idDoc?.file_path ?? null,
            verificationStatus: idDoc?.verification_status ?? 'pending',
          },
        },
        license: {
          name: 'Driving License',
          status: licenseComplete ? 'completed' : 'pending',
          details: {
            licenseNumber: license?.license_number_masked ?? null,
            licenseClasses: license?.license_classes ?? [],
            expiryDate: license?.expiry_date ?? null,
            frontFilePath: license?.front_file_path ?? null,
            backFilePath: license?.back_file_path ?? null,
            isExpiryValid: isExpiryFuture,
            coversVehicleTypes: licenseCoverage.valid,
            missingVehicleTypes: licenseCoverage.missingVehicleTypes,
            verificationStatus: license?.verification_status ?? 'pending',
          },
        },
        selfie: {
          name: 'Driver Profile Photo',
          status: selfieComplete ? 'completed' : 'pending',
          details: {
            profilePhotoPath: driver.profile_photo_path ?? null,
          },
        },
      },
    };
  }

  async recordConsent(
    userId: string,
    input: RecordConsentInput,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; purpose: string; version: string }> {
    const driver = await this.repo.getDriverByUserId(userId);
    if (!driver) throw new NotFoundError('Driver profile not found');

    await this.repo.recordConsent({
      driver_id: driver.id,
      purpose: input.purpose,
      consent_version: input.consentVersion,
      is_granted: input.isGranted,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    await this.repo.createAuditLog({
      user_id: userId,
      action: 'driver_consent_recorded',
      entity_type: 'driver_consent_logs',
      metadata: { purpose: input.purpose, version: input.consentVersion },
    });

    return { success: true, purpose: input.purpose, version: input.consentVersion };
  }

  async getConsents(userId: string): Promise<Record<string, unknown>[]> {
    const driver = await this.repo.getDriverByUserId(userId);
    if (!driver) throw new NotFoundError('Driver profile not found');
    return this.repo.getConsents(driver.id);
  }

  async requestAccountDeletion(
    userId: string,
    input: DeleteAccountInput,
  ): Promise<{
    message: string;
    scheduledDeletionAt: string;
    gracePeriodDays: number;
    status: string;
  }> {
    const driver = await this.repo.getDriverByUserId(userId);
    if (!driver) throw new NotFoundError('Driver profile not found');

    const existing = await this.repo.getPendingDeletion(driver.id);
    if (existing) {
      return {
        message: 'Account deletion is already scheduled',
        scheduledDeletionAt: existing.scheduled_deletion_at,
        gracePeriodDays: 30,
        status: existing.status,
      };
    }

    const res = await this.repo.requestAccountDeletion(driver.id, input.reason);

    await this.repo.createAuditLog({
      user_id: userId,
      action: 'account_deletion_requested',
      entity_type: 'account_deletion_requests',
      metadata: { reason: input.reason, scheduled_deletion_at: res.scheduled_deletion_at },
    });

    return {
      message:
        'Account deletion scheduled. You have a 30-day statutory grace period during which you can cancel this request. Availability has been set to offline.',
      scheduledDeletionAt: res.scheduled_deletion_at,
      gracePeriodDays: 30,
      status: res.status,
    };
  }

  async cancelAccountDeletion(userId: string): Promise<{ message: string; success: boolean }> {
    const driver = await this.repo.getDriverByUserId(userId);
    if (!driver) throw new NotFoundError('Driver profile not found');

    const cancelled = await this.repo.cancelAccountDeletion(driver.id);
    if (!cancelled) {
      throw new BadRequestError('No pending account deletion request found to cancel');
    }

    await this.repo.createAuditLog({
      user_id: userId,
      action: 'account_deletion_cancelled',
      entity_type: 'account_deletion_requests',
      metadata: { driver_id: driver.id },
    });

    return {
      message: 'Account deletion request has been cancelled successfully. Your account is active.',
      success: true,
    };
  }

  async exportPersonalData(userId: string): Promise<Record<string, unknown>> {
    const driver = await this.repo.getDriverByUserId(userId);
    if (!driver) throw new NotFoundError('Driver profile not found');

    const exportData = await this.repo.getExportData(driver.id, userId);

    await this.repo.createAuditLog({
      user_id: userId,
      action: 'driver_personal_data_exported',
      entity_type: 'drivers',
      entity_id: driver.id,
      metadata: { compliance: 'DPDP_Act_2023' },
    });

    return exportData;
  }
}

export const driverService = new DriverService();
