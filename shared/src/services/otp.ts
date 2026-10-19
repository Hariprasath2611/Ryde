export interface SendOtpOptions {
  phone: string;
  channel?: 'sms' | 'whatsapp';
}

export interface SendOtpResult {
  success: boolean;
  messageId?: string;
  expiresInSeconds?: number;
}

export interface VerifyOtpResult {
  success: boolean;
  valid: boolean;
  error?: string;
}

export interface IOtpService {
  sendOtp(options: SendOtpOptions): Promise<SendOtpResult>;
  verifyOtp(phone: string, otp: string): Promise<VerifyOtpResult>;
}
