// ryde-capital/backend/src/config/licenseVehicleMapping.ts
// Motor Vehicles Act & MoRTH License Class to Platform Vehicle Type Mapping

import type { VehicleType } from '@ryde/shared';

/**
 * Class-to-vehicle-type mapping.
 * IMPORTANT: This mapping must be verified and updated in accordance with the latest
 * Motor Vehicles Act (1988), Central Motor Vehicles Rules (CMVR 1989), and Ministry
 * of Road Transport and Highways (MoRTH) regulatory notifications.
 *
 * Indian License Classification Standards:
 * - MCWOG: Motor Cycle Without Gear (mopeds/scooters < 50cc)
 * - MCWG: Motor Cycle With Gear -> covers 'two_wheeler'
 * - 3W-NT / 3W-CAB / AUTO: Three Wheeler passenger vehicle -> covers 'three_wheeler'
 * - LMV / LMV-NT / LMV-TR: Light Motor Vehicle (motor cars, jeeps, cabs) -> covers 'four_wheeler'
 * - TRANS / HMV: Transport / Heavy Commercial -> covers 'four_wheeler' and 'three_wheeler'
 */
export const LICENSE_CLASS_TO_VEHICLE_TYPE: Record<string, VehicleType[]> = {
  MCWOG: ['two_wheeler'],
  MCWG: ['two_wheeler'],
  '3W-NT': ['three_wheeler'],
  '3W-CAB': ['three_wheeler'],
  AUTO: ['three_wheeler'],
  LMV: ['four_wheeler'],
  'LMV-NT': ['four_wheeler'],
  'LMV-TR': ['four_wheeler'],
  TRANS: ['four_wheeler', 'three_wheeler'],
  HMV: ['four_wheeler', 'three_wheeler'],
  // Platform canonical vehicle types mapping to themselves
  two_wheeler: ['two_wheeler'],
  three_wheeler: ['three_wheeler'],
  four_wheeler: ['four_wheeler'],
};

/**
 * Checks if the given license classes cover all requested allowed vehicle types.
 */
export function validateLicenseCoversVehicleTypes(
  licenseClasses: string[],
  requestedVehicleTypes: VehicleType[],
): { valid: boolean; missingVehicleTypes: VehicleType[] } {
  if (!requestedVehicleTypes || requestedVehicleTypes.length === 0) {
    return { valid: true, missingVehicleTypes: [] };
  }

  // Aggregate all vehicle types covered by the driver's license classes
  const coveredTypes = new Set<VehicleType>();
  for (const licClass of licenseClasses) {
    const types =
      LICENSE_CLASS_TO_VEHICLE_TYPE[licClass.toUpperCase()] ||
      LICENSE_CLASS_TO_VEHICLE_TYPE[licClass.toLowerCase()] ||
      [];
    for (const t of types) {
      coveredTypes.add(t);
    }
  }

  const missing = requestedVehicleTypes.filter(vt => !coveredTypes.has(vt));

  return {
    valid: missing.length === 0,
    missingVehicleTypes: missing,
  };
}

/**
 * Checks if a driving license expiry date is valid (strictly in the future).
 */
export function isLicenseExpiryValid(expiryDateStr: string): boolean {
  const expiryDate = new Date(expiryDateStr);
  if (isNaN(expiryDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return expiryDate > today;
}
