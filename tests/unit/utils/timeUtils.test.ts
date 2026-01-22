import { formatDuration } from '@/utils/timeUtils';

describe('timeUtils', () => {
  describe('formatDuration', () => {
    it('formats 0 minutes as "0m"', () => {
      expect(formatDuration(0)).toBe('0m');
    });

    it('formats 30 minutes as "30m"', () => {
      expect(formatDuration(30)).toBe('30m');
    });

    it('formats 60 minutes as "1h"', () => {
      expect(formatDuration(60)).toBe('1h');
    });

    it('formats 90 minutes as "1h 30m"', () => {
      expect(formatDuration(90)).toBe('1h 30m');
    });

    it('formats 120 minutes as "2h"', () => {
      expect(formatDuration(120)).toBe('2h');
    });

    it('formats 150 minutes as "2h 30m"', () => {
      expect(formatDuration(150)).toBe('2h 30m');
    });

    it('formats 83 minutes as "1h 23m" (shows hours when hours > 0)', () => {
      expect(formatDuration(83)).toBe('1h 23m');
    });

    it('formats large durations correctly (1000 minutes)', () => {
      expect(formatDuration(1000)).toBe('16h 40m');
    });

    it('formats very large durations correctly (10000 minutes)', () => {
      expect(formatDuration(10000)).toBe('166h 40m');
    });

    it('rounds floating point minutes correctly', () => {
      expect(formatDuration(29.4)).toBe('29m');
      expect(formatDuration(29.6)).toBe('30m');
      expect(formatDuration(90.4)).toBe('1h 30m');
      expect(formatDuration(90.6)).toBe('1h 31m');
    });

    it('handles negative values by returning "0m"', () => {
      expect(formatDuration(-10)).toBe('0m');
      expect(formatDuration(-0.5)).toBe('0m');
    });

    it('handles edge case: exactly 1 hour', () => {
      expect(formatDuration(60)).toBe('1h');
    });

    it('handles edge case: 59 minutes', () => {
      expect(formatDuration(59)).toBe('59m');
    });

    it('handles edge case: 61 minutes', () => {
      expect(formatDuration(61)).toBe('1h 1m');
    });

    it('handles edge case: 119 minutes', () => {
      expect(formatDuration(119)).toBe('1h 59m');
    });
  });
});
