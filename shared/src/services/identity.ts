// shared/src/services/identity.ts
// IdentityVerificationProvider interface and mock provider for Phase 2 onboarding KYC

export interface VerifyIdentityParams {
  documentType: 'id_proof' | 'driving_license' | 'aadhaar' | 'pan' | string;
  maskedReference: string;
  fullName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  failForTesting?: boolean;
}

export interface IdentityVerificationResult {
  verified: boolean;
  confidenceScore: number;
  provider: string;
  verificationId: string;
  reason?: string;
  verifiedAt: string;
}

export interface IdentityVerificationProvider {
  verify(params: VerifyIdentityParams): Promise<IdentityVerificationResult>;
}

export class MockIdentityVerificationProvider implements IdentityVerificationProvider {
  async verify(params: VerifyIdentityParams): Promise<IdentityVerificationResult> {
    // Fails only if explicitly flagged, or if test phone ends with 9999, or reference includes FAIL
    const isTestFailurePhone = params.phoneNumber?.endsWith('9999');
    const isTestFailureRef = params.maskedReference?.toUpperCase().includes('FAIL');
    const shouldFail = Boolean(params.failForTesting || isTestFailurePhone || isTestFailureRef);

    if (shouldFail) {
      return {
        verified: false,
        confidenceScore: 0.15,
        provider: 'mock-kyc-provider',
        verificationId: `mock-fail-${Date.now()}`,
        reason:
          'Identity verification failed: document reference could not be authenticated with registry',
        verifiedAt: new Date().toISOString(),
      };
    }

    return {
      verified: true,
      confidenceScore: 0.99,
      provider: 'mock-kyc-provider',
      verificationId: `mock-pass-${Date.now()}`,
      verifiedAt: new Date().toISOString(),
    };
  }
}

export const defaultIdentityVerificationProvider = new MockIdentityVerificationProvider();
