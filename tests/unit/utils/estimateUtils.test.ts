import {
  calculateEstimateComparison,
  getEstimateStatus,
  formatEstimateComparison,
  EstimateComparison
} from '@/utils/estimateUtils';

describe('estimateUtils', () => {
  describe('calculateEstimateComparison', () => {
    it('calculates over estimate correctly', () => {
      const result = calculateEstimateComparison(60, 75);
      expect(result.difference).toBe(15);
      expect(result.percentage).toBe(25);
      expect(result.status).toBe('over');
    });

    it('calculates under estimate correctly', () => {
      const result = calculateEstimateComparison(60, 45);
      expect(result.difference).toBe(-15);
      expect(result.percentage).toBe(-25);
      expect(result.status).toBe('under');
    });

    it('calculates on-track status when within threshold', () => {
      const result = calculateEstimateComparison(60, 62);
      expect(result.difference).toBe(2);
      expect(result.status).toBe('on-track');
    });

    it('handles exact match', () => {
      const result = calculateEstimateComparison(60, 60);
      expect(result.difference).toBe(0);
      expect(result.percentage).toBe(0);
      expect(result.status).toBe('on-track');
    });

    it('handles zero estimate (treats as on-track)', () => {
      const result = calculateEstimateComparison(0, 30);
      expect(result.difference).toBe(30);
      expect(result.percentage).toBe(0);
      expect(result.status).toBe('on-track');
    });

    it('handles negative estimate (edge case)', () => {
      const result = calculateEstimateComparison(-10, 30);
      expect(result.difference).toBe(30);
      expect(result.percentage).toBe(0);
      expect(result.status).toBe('on-track');
    });

    it('handles negative actual time (edge case)', () => {
      // When actual < 0, code treats it as if actual is 0, so difference is -estimate
      const result = calculateEstimateComparison(60, -10);
      expect(result.difference).toBe(-60); // -estimate, not actual - estimate
      expect(result.percentage).toBe(-100);
      expect(result.status).toBe('under');
    });

    it('uses custom threshold percentage', () => {
      const result = calculateEstimateComparison(100, 110, 15); // 15% threshold
      expect(result.status).toBe('on-track'); // 10% difference is within 15% threshold
    });

    it('uses custom threshold minutes', () => {
      const result = calculateEstimateComparison(100, 115, 5, 20); // 20 minute threshold
      expect(result.status).toBe('on-track'); // 15 minute difference is within 20 minute threshold
    });

    it('uses larger threshold when percentage threshold is larger', () => {
      // 5% of 1000 = 50 minutes, which is > 10 minutes threshold
      // 100 minute difference is > 50 minute threshold, so status should be 'over'
      const result = calculateEstimateComparison(1000, 1100, 5, 10);
      expect(result.status).toBe('over');
    });

    it('uses larger threshold when minutes threshold is larger', () => {
      // 5% of 100 = 5 minutes, which is < 20 minutes threshold
      // 15 minute difference is < 20 minute threshold, so status should be 'on-track'
      const result = calculateEstimateComparison(100, 115, 5, 20);
      expect(result.status).toBe('on-track');
    });

    it('rounds percentage to 2 decimal places', () => {
      const result = calculateEstimateComparison(60, 65);
      expect(result.percentage).toBe(8.33); // (5/60) * 100 = 8.333...
    });

    it('handles very large estimates', () => {
      const result = calculateEstimateComparison(10000, 10500);
      expect(result.difference).toBe(500);
      expect(result.percentage).toBe(5);
      expect(result.status).toBe('on-track'); // Within 5% threshold
    });

    it('handles very small estimates', () => {
      // Threshold is max(1*5%, 10) = max(0.05, 10) = 10 minutes
      // 1 minute difference is < 10 minute threshold, so status is 'on-track'
      const result = calculateEstimateComparison(1, 2);
      expect(result.difference).toBe(1);
      expect(result.percentage).toBe(100);
      expect(result.status).toBe('on-track'); // 1 minute difference is within 10 minute threshold
    });
  });

  describe('getEstimateStatus', () => {
    it('returns "over" for over estimate', () => {
      expect(getEstimateStatus(60, 75)).toBe('over');
    });

    it('returns "under" for under estimate', () => {
      expect(getEstimateStatus(60, 45)).toBe('under');
    });

    it('returns "on-track" for on-track estimate', () => {
      expect(getEstimateStatus(60, 62)).toBe('on-track');
    });

    it('uses custom thresholds', () => {
      expect(getEstimateStatus(100, 110, 15)).toBe('on-track');
    });
  });

  describe('formatEstimateComparison', () => {
    it('formats over estimate correctly', () => {
      const result = formatEstimateComparison(60, 75);
      expect(result).toContain('Over estimate');
      expect(result).toContain('15 minutes');
      expect(result).toContain('25%');
    });

    it('formats under estimate correctly', () => {
      const result = formatEstimateComparison(60, 45);
      expect(result).toContain('Under estimate');
      expect(result).toContain('15 minutes');
      expect(result).toContain('25%');
    });

    it('formats on-track estimate correctly', () => {
      const result = formatEstimateComparison(60, 60);
      expect(result).toBe('Exactly on estimate');
    });

    it('formats on-track with small difference', () => {
      const result = formatEstimateComparison(60, 62);
      expect(result).toContain('Within estimate');
      expect(result).toContain('2 minutes');
    });

    it('handles singular minute', () => {
      const result = formatEstimateComparison(60, 61);
      expect(result).toContain('1 minute');
      expect(result).not.toContain('1 minutes');
    });

    it('handles plural minutes', () => {
      const result = formatEstimateComparison(60, 65);
      expect(result).toContain('5 minutes');
    });

    it('handles zero estimate', () => {
      const result = formatEstimateComparison(0, 30);
      expect(result).toBe('No estimate set');
    });

    it('handles negative estimate', () => {
      const result = formatEstimateComparison(-10, 30);
      expect(result).toBe('No estimate set');
    });
  });
});
