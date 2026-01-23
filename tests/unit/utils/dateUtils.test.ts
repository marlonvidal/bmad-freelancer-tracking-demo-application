import {
  getTodayRange,
  getCurrentWeekRange,
  getCurrentMonthRange,
  isDateInRange,
  DateRange
} from '@/utils/dateUtils';

describe('dateUtils', () => {
  describe('getTodayRange', () => {
    it('returns today\'s date range with start at 00:00:00 and end at 23:59:59', () => {
      const range = getTodayRange();
      const now = new Date();
      
      // Check that start is today at 00:00:00
      expect(range.start.getFullYear()).toBe(now.getFullYear());
      expect(range.start.getMonth()).toBe(now.getMonth());
      expect(range.start.getDate()).toBe(now.getDate());
      expect(range.start.getHours()).toBe(0);
      expect(range.start.getMinutes()).toBe(0);
      expect(range.start.getSeconds()).toBe(0);
      expect(range.start.getMilliseconds()).toBe(0);
      
      // Check that end is today at 23:59:59.999
      expect(range.end.getFullYear()).toBe(now.getFullYear());
      expect(range.end.getMonth()).toBe(now.getMonth());
      expect(range.end.getDate()).toBe(now.getDate());
      expect(range.end.getHours()).toBe(23);
      expect(range.end.getMinutes()).toBe(59);
      expect(range.end.getSeconds()).toBe(59);
      expect(range.end.getMilliseconds()).toBe(999);
    });

    it('returns different ranges for different days', () => {
      jest.useFakeTimers();
      
      const today = new Date(2026, 0, 15, 12, 0, 0);
      jest.setSystemTime(today);
      const range1 = getTodayRange();
      
      // Simulate next day
      const tomorrow = new Date(2026, 0, 16, 12, 0, 0);
      jest.setSystemTime(tomorrow);
      const range2 = getTodayRange();
      
      expect(range2.start.getTime()).not.toBe(range1.start.getTime());
      
      jest.useRealTimers();
    });
  });

  describe('getCurrentWeekRange', () => {
    it('returns week range starting on Sunday and ending on Saturday', () => {
      const range = getCurrentWeekRange();
      
      // Check that start is Sunday (day 0)
      expect(range.start.getDay()).toBe(0);
      expect(range.start.getHours()).toBe(0);
      expect(range.start.getMinutes()).toBe(0);
      expect(range.start.getSeconds()).toBe(0);
      
      // Check that end is Saturday (day 6)
      expect(range.end.getDay()).toBe(6);
      expect(range.end.getHours()).toBe(23);
      expect(range.end.getMinutes()).toBe(59);
      expect(range.end.getSeconds()).toBe(59);
    });

    it('returns range that includes today', () => {
      const range = getCurrentWeekRange();
      const today = new Date();
      
      expect(isDateInRange(today, range)).toBe(true);
    });

    it('handles week boundaries correctly', () => {
      // Test with a known date: Jan 22, 2026 is a Thursday
      jest.useFakeTimers();
      const testDate = new Date(2026, 0, 22); // Jan 22, 2026 (Thursday, day 4)
      jest.setSystemTime(testDate);
      
      const range = getCurrentWeekRange();
      
      // Jan 18, 2026 is Sunday (start of week)
      // Jan 24, 2026 is Saturday (end of week)
      expect(range.start.getDate()).toBe(18);
      expect(range.end.getDate()).toBe(24);
      
      jest.useRealTimers();
    });

    it('handles month boundaries within a week', () => {
      // Test with Feb 1, 2026 which is a Sunday - week should be Feb 1-7
      jest.useFakeTimers();
      const testDate = new Date(2026, 1, 1); // Feb 1, 2026 (Sunday)
      jest.setSystemTime(testDate);
      
      const range = getCurrentWeekRange();
      
      // Week should start on Feb 1 (Sunday) and end on Feb 7 (Saturday)
      expect(range.start.getMonth()).toBe(1); // February
      expect(range.start.getDate()).toBe(1);
      expect(range.end.getMonth()).toBe(1); // February
      expect(range.end.getDate()).toBe(7);
      
      jest.useRealTimers();
    });
  });

  describe('getCurrentMonthRange', () => {
    it('returns month range starting on first day and ending on last day', () => {
      const range = getCurrentMonthRange();
      
      // Check that start is first day of month at 00:00:00
      expect(range.start.getDate()).toBe(1);
      expect(range.start.getHours()).toBe(0);
      expect(range.start.getMinutes()).toBe(0);
      expect(range.start.getSeconds()).toBe(0);
      
      // Check that end is last day of month at 23:59:59
      expect(range.end.getHours()).toBe(23);
      expect(range.end.getMinutes()).toBe(59);
      expect(range.end.getSeconds()).toBe(59);
    });

    it('returns range that includes today', () => {
      const range = getCurrentMonthRange();
      const today = new Date();
      
      expect(isDateInRange(today, range)).toBe(true);
    });

    it('handles different month lengths correctly', () => {
      jest.useFakeTimers();
      
      // Test January (31 days)
      const janDate = new Date(2026, 0, 15); // Jan 15, 2026
      jest.setSystemTime(janDate);
      const janRange = getCurrentMonthRange();
      expect(janRange.start.getDate()).toBe(1);
      expect(janRange.end.getDate()).toBe(31);
      
      // Test February (28 days in 2026, non-leap year)
      const febDate = new Date(2026, 1, 15); // Feb 15, 2026
      jest.setSystemTime(febDate);
      const febRange = getCurrentMonthRange();
      expect(febRange.start.getDate()).toBe(1);
      expect(febRange.end.getDate()).toBe(28);
      
      // Test February in leap year (29 days)
      const leapFebDate = new Date(2024, 1, 15); // Feb 15, 2024 (leap year)
      jest.setSystemTime(leapFebDate);
      const leapFebRange = getCurrentMonthRange();
      expect(leapFebRange.start.getDate()).toBe(1);
      expect(leapFebRange.end.getDate()).toBe(29);
      
      // Test April (30 days)
      const aprDate = new Date(2026, 3, 15); // Apr 15, 2026
      jest.setSystemTime(aprDate);
      const aprRange = getCurrentMonthRange();
      expect(aprRange.start.getDate()).toBe(1);
      expect(aprRange.end.getDate()).toBe(30);
      
      jest.useRealTimers();
    });

    it('handles year boundaries correctly', () => {
      jest.useFakeTimers();
      
      // Test December (last month of year)
      const decDate = new Date(2026, 11, 15); // Dec 15, 2026
      jest.setSystemTime(decDate);
      
      const decRange = getCurrentMonthRange();
      expect(decRange.start.getMonth()).toBe(11); // December
      expect(decRange.start.getFullYear()).toBe(2026);
      expect(decRange.end.getMonth()).toBe(11); // December
      expect(decRange.end.getFullYear()).toBe(2026);
      expect(decRange.end.getDate()).toBe(31);
      
      jest.useRealTimers();
    });
  });

  describe('isDateInRange', () => {
    it('returns true for date exactly at range start', () => {
      const range: DateRange = {
        start: new Date(2026, 0, 15, 0, 0, 0, 0),
        end: new Date(2026, 0, 20, 23, 59, 59, 999)
      };
      const date = new Date(2026, 0, 15, 0, 0, 0, 0);
      
      expect(isDateInRange(date, range)).toBe(true);
    });

    it('returns true for date exactly at range end', () => {
      const range: DateRange = {
        start: new Date(2026, 0, 15, 0, 0, 0, 0),
        end: new Date(2026, 0, 20, 23, 59, 59, 999)
      };
      const date = new Date(2026, 0, 20, 23, 59, 59, 999);
      
      expect(isDateInRange(date, range)).toBe(true);
    });

    it('returns true for date within range', () => {
      const range: DateRange = {
        start: new Date(2026, 0, 15, 0, 0, 0, 0),
        end: new Date(2026, 0, 20, 23, 59, 59, 999)
      };
      const date = new Date(2026, 0, 17, 12, 30, 0, 0);
      
      expect(isDateInRange(date, range)).toBe(true);
    });

    it('returns false for date before range start', () => {
      const range: DateRange = {
        start: new Date(2026, 0, 15, 0, 0, 0, 0),
        end: new Date(2026, 0, 20, 23, 59, 59, 999)
      };
      const date = new Date(2026, 0, 14, 23, 59, 59, 999);
      
      expect(isDateInRange(date, range)).toBe(false);
    });

    it('returns false for date after range end', () => {
      const range: DateRange = {
        start: new Date(2026, 0, 15, 0, 0, 0, 0),
        end: new Date(2026, 0, 20, 23, 59, 59, 999)
      };
      const date = new Date(2026, 0, 21, 0, 0, 0, 0);
      
      expect(isDateInRange(date, range)).toBe(false);
    });

    it('handles same-day range correctly', () => {
      const range: DateRange = {
        start: new Date(2026, 0, 15, 0, 0, 0, 0),
        end: new Date(2026, 0, 15, 23, 59, 59, 999)
      };
      
      expect(isDateInRange(new Date(2026, 0, 15, 0, 0, 0, 0), range)).toBe(true);
      expect(isDateInRange(new Date(2026, 0, 15, 12, 0, 0, 0), range)).toBe(true);
      expect(isDateInRange(new Date(2026, 0, 15, 23, 59, 59, 999), range)).toBe(true);
      expect(isDateInRange(new Date(2026, 0, 14, 23, 59, 59, 999), range)).toBe(false);
      expect(isDateInRange(new Date(2026, 0, 16, 0, 0, 0, 0), range)).toBe(false);
    });

    it('handles time precision correctly', () => {
      const range: DateRange = {
        start: new Date(2026, 0, 15, 10, 30, 0, 0),
        end: new Date(2026, 0, 15, 15, 45, 0, 0)
      };
      
      // Just before start
      expect(isDateInRange(new Date(2026, 0, 15, 10, 29, 59, 999), range)).toBe(false);
      // Exactly at start
      expect(isDateInRange(new Date(2026, 0, 15, 10, 30, 0, 0), range)).toBe(true);
      // In middle
      expect(isDateInRange(new Date(2026, 0, 15, 12, 0, 0, 0), range)).toBe(true);
      // Exactly at end
      expect(isDateInRange(new Date(2026, 0, 15, 15, 45, 0, 0), range)).toBe(true);
      // Just after end
      expect(isDateInRange(new Date(2026, 0, 15, 15, 45, 0, 1), range)).toBe(false);
    });
  });
});
