import { formatCurrency, formatHourlyRate } from '@/utils/currencyUtils';

describe('currencyUtils', () => {
  describe('formatCurrency', () => {
    it('formats 0 as "$0.00"', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('formats 1 as "$1.00"', () => {
      expect(formatCurrency(1)).toBe('$1.00');
    });

    it('formats 100 as "$100.00"', () => {
      expect(formatCurrency(100)).toBe('$100.00');
    });

    it('formats 1000 as "$1,000.00"', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
    });

    it('formats 10000 as "$10,000.00"', () => {
      expect(formatCurrency(10000)).toBe('$10,000.00');
    });

    it('formats decimal amounts correctly', () => {
      expect(formatCurrency(1250.50)).toBe('$1,250.50');
      expect(formatCurrency(75.99)).toBe('$75.99');
      expect(formatCurrency(0.01)).toBe('$0.01');
    });

    it('handles null values gracefully', () => {
      expect(formatCurrency(null as any)).toBe('—');
    });

    it('handles undefined values gracefully', () => {
      expect(formatCurrency(undefined as any)).toBe('—');
    });

    it('handles NaN values gracefully', () => {
      expect(formatCurrency(NaN)).toBe('—');
    });

    it('formats large amounts correctly', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    it('formats amounts with many decimal places (rounds to 2)', () => {
      expect(formatCurrency(75.999)).toBe('$76.00');
      expect(formatCurrency(75.991)).toBe('$75.99');
    });
  });

  describe('formatHourlyRate', () => {
    it('formats 0 as "$0.00/hr"', () => {
      expect(formatHourlyRate(0)).toBe('$0.00/hr');
    });

    it('formats 75.50 as "$75.50/hr"', () => {
      expect(formatHourlyRate(75.50)).toBe('$75.50/hr');
    });

    it('formats 100 as "$100.00/hr"', () => {
      expect(formatHourlyRate(100)).toBe('$100.00/hr');
    });

    it('formats 1000 as "$1,000.00/hr"', () => {
      expect(formatHourlyRate(1000)).toBe('$1,000.00/hr');
    });

    it('formats decimal rates correctly', () => {
      expect(formatHourlyRate(75.99)).toBe('$75.99/hr');
      expect(formatHourlyRate(0.01)).toBe('$0.01/hr');
      expect(formatHourlyRate(150.25)).toBe('$150.25/hr');
    });

    it('handles null values gracefully', () => {
      expect(formatHourlyRate(null)).toBe('—');
    });

    it('handles undefined values gracefully', () => {
      expect(formatHourlyRate(undefined)).toBe('—');
    });

    it('handles NaN values gracefully', () => {
      expect(formatHourlyRate(NaN)).toBe('—');
    });

    it('formats large rates correctly', () => {
      expect(formatHourlyRate(1000000)).toBe('$1,000,000.00/hr');
    });

    it('formats rates with many decimal places (rounds to 2)', () => {
      expect(formatHourlyRate(75.999)).toBe('$76.00/hr');
      expect(formatHourlyRate(75.991)).toBe('$75.99/hr');
    });
  });
});
