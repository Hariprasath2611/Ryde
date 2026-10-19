/**
 * Brand constants for Ryde Capital
 */
export const BRAND = {
  name: 'Ryde Capital',
  shortName: 'Ryde',
  tagline: 'Your vehicle. Our driver.',
  tealPart: 'Ryde',
  amberPart: 'Capital',
} as const;

export const OTP_CONFIG = {
  LOGIN_OTP_LENGTH: 6,
  ARRIVAL_OTP_LENGTH: 4,
  RESEND_SECONDS: 30,
  WAITING_FREE_MINUTES: 5,
} as const;
