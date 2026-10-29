/**
 * Deterministic Date & Policy Window Calculation Utilities
 */

export function calculateDaysBetween(startDate, endDate = new Date()) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diffMs = end - start;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function calculateHoursBetween(startDate, endDate = new Date()) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diffMs = end - start;
  return Math.floor(diffMs / (1000 * 60 * 60));
}

export function evaluateWarrantyStatus(purchaseDate, warrantyMonths = 12, referenceDate = new Date()) {
  if (!purchaseDate) {
    return {
      isEligible: false,
      reason: 'No purchase date available for warranty calculation',
      daysElapsed: null,
      daysRemaining: null
    };
  }

  const daysElapsed = calculateDaysBetween(purchaseDate, referenceDate);
  const totalWarrantyDays = warrantyMonths * 30.5; // approximately 366 days for 12 months
  const daysRemaining = Math.max(0, Math.floor(totalWarrantyDays - daysElapsed));
  const isEligible = daysElapsed <= totalWarrantyDays;

  return {
    isEligible,
    daysElapsed,
    daysRemaining,
    warrantyMonths,
    totalWarrantyDays: Math.floor(totalWarrantyDays),
    statusLabel: isEligible ? 'ACTIVE_WARRANTY' : 'WARRANTY_EXPIRED',
    reason: isEligible
      ? `Within ${warrantyMonths}-month warranty window (${daysElapsed} days elapsed, ${daysRemaining} days remaining)`
      : `Warranty expired (${daysElapsed} days elapsed, exceeds ${warrantyMonths} months / ${Math.floor(totalWarrantyDays)} days)`
  };
}

export function evaluateReturnStatus(deliveryDate, returnWindowDays = 7, referenceDate = new Date()) {
  if (!deliveryDate) {
    return {
      isEligible: false,
      reason: 'Order has not been delivered or delivery date is unrecorded',
      daysElapsed: null,
      daysRemaining: null
    };
  }

  const daysElapsed = calculateDaysBetween(deliveryDate, referenceDate);
  const daysRemaining = Math.max(0, returnWindowDays - daysElapsed);
  const isEligible = daysElapsed <= returnWindowDays;

  return {
    isEligible,
    daysElapsed,
    daysRemaining,
    returnWindowDays,
    statusLabel: isEligible ? 'WITHIN_RETURN_WINDOW' : 'RETURN_WINDOW_EXPIRED',
    reason: isEligible
      ? `Delivered ${daysElapsed} days ago (within ${returnWindowDays}-day return window, ${daysRemaining} days remaining)`
      : `Return window expired (delivered ${daysElapsed} days ago, exceeds ${returnWindowDays}-day policy)`
  };
}

export function evaluateDOAStatus(deliveryDate, doaWindowHours = 48, referenceDate = new Date()) {
  if (!deliveryDate) {
    return {
      isEligible: false,
      reason: 'No delivery confirmation available'
    };
  }

  const hoursElapsed = calculateHoursBetween(deliveryDate, referenceDate);
  const isEligible = hoursElapsed <= doaWindowHours;

  return {
    isEligible,
    hoursElapsed,
    doaWindowHours,
    reason: isEligible
      ? `Reported ${hoursElapsed} hours post-delivery (within ${doaWindowHours}-hour DOA damage window)`
      : `Reported ${hoursElapsed} hours post-delivery (exceeds ${doaWindowHours}-hour DOA damage window)`
  };
}
