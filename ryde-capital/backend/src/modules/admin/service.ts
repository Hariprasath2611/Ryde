// ryde-capital/backend/src/modules/admin/service.ts
// Business logic for Admin driver onboarding reviews, 60s signed document URLs, approvals, and rejections

import { NotFoundError, BadRequestError, type DriverOnboardingStatus } from '@ryde/shared';
import {
  adminRepository,
  type IAdminRepository,
  type AdminDriverListItem,
  type DriverRow,
  type ProfileRow,
} from './repository.js';

export interface DriverReviewDetailsResponse {
  driver: DriverRow;
  profile: ProfileRow;
  documents: {
    profilePhoto: {
      path: string | null;
      signedUrl: string | null;
      expiresInSeconds: number;
    };
    idProof: {
      documentType: string | null;
      maskedReference: string | null;
      path: string | null;
      signedUrl: string | null;
      verificationStatus: string;
      expiresInSeconds: number;
    } | null;
    license: {
      licenseNumber: string | null;
      licenseClasses: string[];
      expiryDate: string | null;
      frontFilePath: string | null;
      frontSignedUrl: string | null;
      backFilePath: string | null;
      backSignedUrl: string | null;
      verificationStatus: string;
      expiresInSeconds: number;
    } | null;
  };
}

export class AdminService {
  constructor(private readonly repo: IAdminRepository = adminRepository) {}

  async listDrivers(
    adminId: string,
    status?: DriverOnboardingStatus,
    page = 1,
    limit = 20,
  ): Promise<{ drivers: AdminDriverListItem[]; total: number; page: number; limit: number }> {
    const result = await this.repo.listDrivers(status, page, limit);

    await this.repo.createAuditLog({
      user_id: adminId,
      action: 'ADMIN_DRIVERS_LIST_VIEWED',
      entity_type: 'driver',
      metadata: { status, page, limit, count: result.drivers.length },
    });

    return result;
  }

  async getDriverReviewDetails(
    adminId: string,
    driverId: string,
  ): Promise<DriverReviewDetailsResponse> {
    const details = await this.repo.getDriverDetails(driverId);
    if (!details) {
      throw new NotFoundError('Driver record not found');
    }

    const { driver, profile, identityDocuments, drivingLicense } = details;
    const expiresIn = 60; // strictly 60 seconds as per requirements

    // 1. Signed URL for Profile Photo
    let profilePhotoUrl: string | null = null;
    if (driver.profile_photo_path) {
      try {
        profilePhotoUrl = await this.repo.createSignedDownloadUrl(
          'driver-docs',
          driver.profile_photo_path,
          expiresIn,
        );
      } catch (err) {
        console.warn('Failed to sign profile photo URL:', err);
      }
    }

    // 2. Signed URL for ID Proof
    let idProofResponse: DriverReviewDetailsResponse['documents']['idProof'] = null;
    const primaryIdDoc = identityDocuments[0];
    if (primaryIdDoc) {
      let idDocUrl: string | null = null;
      if (primaryIdDoc.file_path) {
        try {
          idDocUrl = await this.repo.createSignedDownloadUrl(
            'identity-docs',
            primaryIdDoc.file_path,
            expiresIn,
          );
        } catch (err) {
          console.warn('Failed to sign ID document URL:', err);
        }
      }

      idProofResponse = {
        documentType: primaryIdDoc.document_type,
        maskedReference: primaryIdDoc.masked_reference,
        path: primaryIdDoc.file_path,
        signedUrl: idDocUrl,
        verificationStatus: primaryIdDoc.verification_status,
        expiresInSeconds: expiresIn,
      };
    }

    // 3. Signed URLs for License Front and Back
    let licenseResponse: DriverReviewDetailsResponse['documents']['license'] = null;
    if (drivingLicense) {
      let frontUrl: string | null = null;
      let backUrl: string | null = null;

      if (drivingLicense.front_file_path || drivingLicense.file_path) {
        try {
          frontUrl = await this.repo.createSignedDownloadUrl(
            'driver-docs',
            drivingLicense.front_file_path || drivingLicense.file_path!,
            expiresIn,
          );
        } catch (err) {
          console.warn('Failed to sign license front URL:', err);
        }
      }

      if (drivingLicense.back_file_path) {
        try {
          backUrl = await this.repo.createSignedDownloadUrl(
            'driver-docs',
            drivingLicense.back_file_path,
            expiresIn,
          );
        } catch (err) {
          console.warn('Failed to sign license back URL:', err);
        }
      }

      licenseResponse = {
        licenseNumber: drivingLicense.license_number_masked,
        licenseClasses: drivingLicense.license_classes,
        expiryDate: drivingLicense.expiry_date,
        frontFilePath: drivingLicense.front_file_path || drivingLicense.file_path,
        frontSignedUrl: frontUrl,
        backFilePath: drivingLicense.back_file_path,
        backSignedUrl: backUrl,
        verificationStatus: drivingLicense.verification_status,
        expiresInSeconds: expiresIn,
      };
    }

    // Log document access audit row
    await this.repo.createAuditLog({
      user_id: adminId,
      action: 'ADMIN_DRIVER_DOCUMENTS_VIEWED',
      entity_type: 'driver',
      entity_id: driverId,
      metadata: {
        driver_code: driver.driver_code,
        has_id_doc: Boolean(primaryIdDoc),
        has_license: Boolean(drivingLicense),
        has_selfie: Boolean(driver.profile_photo_path),
        access_timestamp: new Date().toISOString(),
      },
    });

    return {
      driver,
      profile,
      documents: {
        profilePhoto: {
          path: driver.profile_photo_path,
          signedUrl: profilePhotoUrl,
          expiresInSeconds: expiresIn,
        },
        idProof: idProofResponse,
        license: licenseResponse,
      },
    };
  }

  async approveDriver(
    adminId: string,
    driverId: string,
  ): Promise<{ driver: DriverRow; profile: ProfileRow }> {
    const details = await this.repo.getDriverDetails(driverId);
    if (!details) {
      throw new NotFoundError('Driver record not found');
    }

    const { driver, profile } = await this.repo.approveDriver(driverId, adminId);

    // Write audit log
    await this.repo.createAuditLog({
      user_id: adminId,
      action: 'ADMIN_DRIVER_APPROVED',
      entity_type: 'driver',
      entity_id: driverId,
      metadata: {
        driver_code: driver.driver_code,
        approved_at: driver.approved_at,
      },
    });

    // Send driver in-app notification
    await this.repo.createNotification(
      driver.user_id,
      'Account Approved',
      'Congratulations! Your Ryde Capital driver profile has been approved. You can now go online and accept trips.',
      'driver_approved',
    );

    return { driver, profile };
  }

  async rejectDriver(
    adminId: string,
    driverId: string,
    reason: string,
  ): Promise<{ driver: DriverRow; profile: ProfileRow }> {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestError('Rejection reason is required.');
    }

    const details = await this.repo.getDriverDetails(driverId);
    if (!details) {
      throw new NotFoundError('Driver record not found');
    }

    const { driver, profile } = await this.repo.rejectDriver(driverId, adminId, reason.trim());

    // Write audit log
    await this.repo.createAuditLog({
      user_id: adminId,
      action: 'ADMIN_DRIVER_REJECTED',
      entity_type: 'driver',
      entity_id: driverId,
      metadata: {
        driver_code: driver.driver_code,
        rejection_reason: reason.trim(),
      },
    });

    // Send driver in-app notification
    await this.repo.createNotification(
      driver.user_id,
      'Verification Requires Attention',
      `Your driver verification was not approved: ${reason.trim()}. Please update your documents and resubmit.`,
      'driver_rejected',
    );

    return { driver, profile };
  }
}

export const adminService = new AdminService();
