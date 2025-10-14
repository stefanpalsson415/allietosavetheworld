import { formatDateLocal, parseLocalDate, getStartOfDay, getEndOfDay, isSameDay } from './dateUtils';

describe('dateUtils', () => {
  describe('formatDateLocal', () => {
    it('should format date correctly without timezone shift', () => {
      // Test with a date at midnight
      const date = new Date(2024, 5, 12, 0, 0, 0); // June 12, 2024 at midnight
      expect(formatDateLocal(date)).toBe('2024-06-12');
    });

    it('should handle dates at end of day', () => {
      const date = new Date(2024, 5, 12, 23, 59, 59); // June 12, 2024 at 11:59:59 PM
      expect(formatDateLocal(date)).toBe('2024-06-12');
    });

    it('should handle null/undefined dates', () => {
      const today = new Date();
      const expectedToday = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
      
      expect(formatDateLocal(null)).toBe(expectedToday);
      expect(formatDateLocal(undefined)).toBe(expectedToday);
    });
  });

  describe('parseLocalDate', () => {
    it('should parse date string correctly', () => {
      const dateString = '2024-06-12';
      const result = parseLocalDate(dateString);
      
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(5); // June is month 5 (0-indexed)
      expect(result.getDate()).toBe(12);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });

    it('should handle invalid input', () => {
      const today = new Date();
      const result1 = parseLocalDate(null);
      const result2 = parseLocalDate('');
      
      expect(result1.toDateString()).toBe(today.toDateString());
      expect(result2.toDateString()).toBe(today.toDateString());
    });
  });

  describe('timezone shift comparison', () => {
    it('should avoid timezone shift that happens with toISOString', () => {
      // Create a date at midnight in a timezone behind UTC
      const date = new Date(2024, 5, 12, 0, 0, 0); // June 12, 2024 at midnight local time
      
      // Using toISOString might give us June 11 if we're in a timezone behind UTC
      const isoString = date.toISOString().split('T')[0];
      
      // Our formatDateLocal should always give us June 12
      const localString = formatDateLocal(date);
      
      // Log for debugging
      console.log('Date object:', date);
      console.log('ISO string:', isoString);
      console.log('Local string:', localString);
      console.log('Timezone offset:', date.getTimezoneOffset());
      
      // Our local format should always preserve the intended date
      expect(localString).toBe('2024-06-12');
    });
  });
});