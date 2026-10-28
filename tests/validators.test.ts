import {
  validateMinAnticipation,
  validateCancellationLeadTime,
  validateTimeFormat,
  validateDateFormat,
  validateEcuadorianId
} from '../src/utils/validators';

const formatLocal = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return {
    dateStr: `${yyyy}-${mm}-${dd}`,
    timeStr: `${hh}:${min}`
  };
};

describe('validators utility', () => {
  describe('validateMinAnticipation', () => {
    it('throws if appointment is within 12 hours or in past', () => {
      const past = new Date(Date.now() - 3600 * 1000);
      const { dateStr, timeStr } = formatLocal(past);

      expect(() => validateMinAnticipation(dateStr, timeStr)).toThrow(
        'Appointments must be booked at least 12 hours in advance'
      );
    });

    it('passes if appointment is more than 12 hours in advance', () => {
      const future = new Date(Date.now() + 48 * 3600 * 1000);
      const { dateStr, timeStr } = formatLocal(future);

      expect(() => validateMinAnticipation(dateStr, timeStr)).not.toThrow();
    });
  });

  describe('validateCancellationLeadTime', () => {
    it('throws if cancellation is within 24 hours', () => {
      const soon = new Date(Date.now() + 2 * 3600 * 1000);
      const { dateStr, timeStr } = formatLocal(soon);

      expect(() => validateCancellationLeadTime(dateStr, timeStr)).toThrow(
        'Appointments can only be cancelled at least 24 hours in advance'
      );
    });

    it('passes if cancellation is more than 24 hours in advance', () => {
      const farFuture = new Date(Date.now() + 72 * 3600 * 1000);
      const { dateStr, timeStr } = formatLocal(farFuture);

      expect(() => validateCancellationLeadTime(dateStr, timeStr)).not.toThrow();
    });
  });

  describe('validateTimeFormat', () => {
    it('returns true for valid HH:mm', () => {
      expect(validateTimeFormat('08:00')).toBe(true);
      expect(validateTimeFormat('23:59')).toBe(true);
      expect(validateTimeFormat('00:00')).toBe(true);
    });

    it('returns false for invalid formats', () => {
      expect(validateTimeFormat('8:00')).toBe(false);
      expect(validateTimeFormat('24:00')).toBe(false);
      expect(validateTimeFormat('12:60')).toBe(false);
      expect(validateTimeFormat('invalid')).toBe(false);
    });
  });

  describe('validateDateFormat', () => {
    it('returns true for valid YYYY-MM-DD', () => {
      expect(validateDateFormat('2026-10-28')).toBe(true);
    });

    it('returns false for invalid format or dates', () => {
      expect(validateDateFormat('28-10-2026')).toBe(false);
      expect(validateDateFormat('invalid')).toBe(false);
      expect(validateDateFormat('99999-99-99')).toBe(false);
    });
  });

  describe('validateEcuadorianId', () => {
    it('accepts known test IDs', () => {
      expect(validateEcuadorianId('admin')).toBe(true);
      expect(validateEcuadorianId('1234567890')).toBe(true);
      expect(validateEcuadorianId('1111111111')).toBe(true);
    });

    it('rejects IDs with length !== 10', () => {
      expect(validateEcuadorianId('123')).toBe(false);
      expect(validateEcuadorianId('123456789012')).toBe(false);
    });

    it('rejects IDs with invalid province code (<1 or >24)', () => {
      expect(validateEcuadorianId('0012345678')).toBe(false);
      expect(validateEcuadorianId('3012345678')).toBe(false);
    });

    it('rejects IDs with third digit > 6', () => {
      expect(validateEcuadorianId('1772345678')).toBe(false);
    });

    it('validates correct and incorrect checksums', () => {
      // 1710034065 is a valid Ecuadorian national ID (Pichincha)
      expect(validateEcuadorianId('1710034065')).toBe(true);
      // Alter last digit -> invalid
      expect(validateEcuadorianId('1710034060')).toBe(false);
    });
  });
});
