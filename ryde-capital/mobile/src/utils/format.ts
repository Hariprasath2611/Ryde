/**
 * Formatting utilities for Indian currency and en-IN localization
 */

export function formatINR(amount: number): string {
  // Format with rupee sign and Indian numbering system (lakhs, crores)
  const abs = Math.abs(amount);
  const isNegative = amount < 0;

  // Manual reliable Indian number format (works across all JS engines)
  const str = Math.floor(abs).toString();
  let result = '';

  if (str.length <= 3) {
    result = str;
  } else {
    const lastThree = str.slice(-3);
    const otherDigits = str.slice(0, -3);
    const withCommas = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    result = `${withCommas},${lastThree}`;
  }

  return `${isNegative ? '-₹' : '₹'}${result}`;
}

export function formatTripDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`;
}
