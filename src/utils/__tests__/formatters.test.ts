import {
  formatCurrency,
  formatPercentage,
  formatDate,
  formatMonthYear,
  formatNumber,
  formatNumberWithDecimals,
  getAssetKey
} from '../formatters';

describe('Formatters', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers correctly', () => {
      expect(formatCurrency(1000)).toBe('R$ 1.000,00');
      expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
      expect(formatCurrency(0.99)).toBe('R$ 0,99');
    });

    it('should format negative numbers correctly', () => {
      expect(formatCurrency(-1000)).toBe('-R$ 1.000,00');
      expect(formatCurrency(-1234.56)).toBe('-R$ 1.234,56');
    });

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('R$ 0,00');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentages correctly', () => {
      expect(formatPercentage(10)).toBe('0,10%');
      expect(formatPercentage(100)).toBe('1,00%');
      expect(formatPercentage(15.5)).toBe('0,16%');
    });

    it('should format zero correctly', () => {
      expect(formatPercentage(0)).toBe('0,00%');
    });

    it('should format negative percentages correctly', () => {
      expect(formatPercentage(-10)).toBe('-0,10%');
    });
  });

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date(2023, 0, 15); // January 15, 2023
      expect(formatDate(date)).toBe('15/01/2023');
    });
  });

  describe('formatMonthYear', () => {
    it('should format month and year correctly', () => {
      const date = new Date(2023, 0, 15); // January 15, 2023
      expect(formatMonthYear(date)).toBe('janeiro de 2023');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers correctly', () => {
      expect(formatNumber(1000)).toBe('1.000');
      expect(formatNumber(1234.56)).toBe('1.234,56');
      expect(formatNumber(0.99)).toBe('0,99');
    });

    it('should format negative numbers correctly', () => {
      expect(formatNumber(-1000)).toBe('-1.000');
      expect(formatNumber(-1234.56)).toBe('-1.234,56');
    });

    it('should format zero correctly', () => {
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('formatNumberWithDecimals', () => {
    it('should format numbers with specified decimals', () => {
      expect(formatNumberWithDecimals(1000, 2)).toBe('1.000,00');
      expect(formatNumberWithDecimals(1234.56, 3)).toBe('1.234,560');
      expect(formatNumberWithDecimals(0.99, 4)).toBe('0,9900');
    });

    it('should format negative numbers with specified decimals', () => {
      expect(formatNumberWithDecimals(-1000, 2)).toBe('-1.000,00');
      expect(formatNumberWithDecimals(-1234.56, 3)).toBe('-1.234,560');
    });

    it('should format zero with specified decimals', () => {
      expect(formatNumberWithDecimals(0, 2)).toBe('0,00');
      expect(formatNumberWithDecimals(0, 4)).toBe('0,0000');
    });
  });

  describe('getAssetKey', () => {

    it('should keep digits that distinguish share classes of the same company', () => {
      expect(getAssetKey('ITUB3')).toBe('ITUB3');
      expect(getAssetKey('ITUB4')).toBe('ITUB4');
      expect(getAssetKey('ITUB3')).not.toBe(getAssetKey('ITUB4'));
    });

    it('should strip the trailing ticker/company name after " - "', () => {
      expect(getAssetKey('PETR4 - PETROBRAS PN')).toBe('PETR4');
    });

    it('should strip only the fractional-share "F" suffix', () => {
      expect(getAssetKey('ITSA4F')).toBe('ITSA4');
      expect(getAssetKey('ITSA4')).toBe('ITSA4');
    });

    it('should uppercase and trim the ticker', () => {
      expect(getAssetKey('  petr4  ')).toBe('PETR4');
    });

    it('should return UNKNOWN for empty/undefined input', () => {
      expect(getAssetKey('' as unknown as string)).toBe('UNKNOWN');
      expect(getAssetKey(undefined as unknown as string)).toBe('UNKNOWN');
    });

  });
});
