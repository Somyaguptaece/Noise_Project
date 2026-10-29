import { evaluateWarrantyStatus, evaluateReturnStatus, evaluateDOAStatus, calculateDaysBetween } from '../src/utils/dateHelpers.js';

describe('Date & Policy Calculations', () => {
  const referenceDate = new Date('2026-10-29T12:00:00Z');

  describe('Warranty Eligibility', () => {
    test('marks purchase within 12 months as eligible', () => {
      const purchaseDate = new Date('2026-04-29T12:00:00Z'); // 6 months ago (approx 183 days)
      const res = evaluateWarrantyStatus(purchaseDate, 12, referenceDate);
      expect(res.isEligible).toBe(true);
      expect(res.statusLabel).toBe('ACTIVE_WARRANTY');
      expect(res.daysRemaining).toBeGreaterThan(0);
    });

    test('marks purchase past 12 months as expired', () => {
      const purchaseDate = new Date('2025-08-01T12:00:00Z'); // > 400 days ago
      const res = evaluateWarrantyStatus(purchaseDate, 12, referenceDate);
      expect(res.isEligible).toBe(false);
      expect(res.statusLabel).toBe('WARRANTY_EXPIRED');
      expect(res.daysRemaining).toBe(0);
    });

    test('handles missing purchase date gracefully', () => {
      const res = evaluateWarrantyStatus(null, 12, referenceDate);
      expect(res.isEligible).toBe(false);
      expect(res.reason).toContain('No purchase date');
    });
  });

  describe('Return Window Eligibility', () => {
    test('marks delivery within 7 days as eligible', () => {
      const deliveryDate = new Date('2026-10-27T12:00:00Z'); // 2 days ago
      const res = evaluateReturnStatus(deliveryDate, 7, referenceDate);
      expect(res.isEligible).toBe(true);
      expect(res.statusLabel).toBe('WITHIN_RETURN_WINDOW');
      expect(res.daysRemaining).toBe(5);
    });

    test('marks delivery at 10 days as expired', () => {
      const deliveryDate = new Date('2026-10-19T12:00:00Z'); // 10 days ago
      const res = evaluateReturnStatus(deliveryDate, 7, referenceDate);
      expect(res.isEligible).toBe(false);
      expect(res.statusLabel).toBe('RETURN_WINDOW_EXPIRED');
    });
  });

  describe('DOA Transit Damage Window', () => {
    test('marks delivery 24 hours ago as eligible DOA window', () => {
      const deliveryDate = new Date('2026-10-28T12:00:00Z'); // 24h ago
      const res = evaluateDOAStatus(deliveryDate, 48, referenceDate);
      expect(res.isEligible).toBe(true);
    });

    test('marks delivery 72 hours ago as outside DOA window', () => {
      const deliveryDate = new Date('2026-10-26T12:00:00Z'); // 72h ago
      const res = evaluateDOAStatus(deliveryDate, 48, referenceDate);
      expect(res.isEligible).toBe(false);
    });
  });
});
