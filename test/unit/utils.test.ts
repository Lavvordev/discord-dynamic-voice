import {
  sanitizeChannelName,
  renderChannelName,
  getTemplatePlaceholders,
  validateUserLimit,
  validateBitrate
} from '../../src/utils';

describe('utils', () => {
  describe('sanitizeChannelName', () => {
    test('removes disallowed characters', () => {
      const input = 'My *cool? Voice: Channel@';
      const result = sanitizeChannelName(input);
      expect(result).toBe('My cool Voice Channel');
    });

    test('truncates long names', () => {
      const long = 'a'.repeat(200);
      const result = sanitizeChannelName(long);
      expect(result.length).toBeLessThanOrEqual(100);
      expect(result.endsWith('...')).toBe(true);
    });

    test('falls back to default for empty input', () => {
      expect(sanitizeChannelName('')).toBe('voice-channel');
      expect(sanitizeChannelName('   ')).toBe('voice-channel');
    });
  });

  describe('renderChannelName', () => {
    test('replaces placeholders correctly', () => {
      const user = { username: 'john', displayName: 'Johnny', id: '12345' };
      const template = '{username}\'s space - {id}';
      const result = renderChannelName(template, user);
      expect(result).toBe('john\'s space - 12345');
    });

    test('uses username when displayName missing', () => {
      const user = { username: 'john', displayName: undefined as any, id: '12345' };
      const template = '{displayname}';
      const result = renderChannelName(template, user);
      expect(result).toBe('john');
    });
  });

  describe('getTemplatePlaceholders', () => {
    test('extracts placeholders', () => {
      const template = '{username} and {displayname} and {id}';
      const placeholders = getTemplatePlaceholders(template);
      expect(placeholders).toEqual(['username', 'displayname', 'id']);
    });

    test('returns empty array for none', () => {
      expect(getTemplatePlaceholders('no braces')).toEqual([]);
    });
  });

  describe('validateUserLimit', () => {
    test('clamps within 0-99', () => {
      expect(validateUserLimit(-5)).toBe(0);
      expect(validateUserLimit(0)).toBe(0);
      expect(validateUserLimit(50)).toBe(50);
      expect(validateUserLimit(150)).toBe(99);
      expect(validateUserLimit(NaN)).toBe(0);
    });
  });

  describe('validateBitrate', () => {
    test('clamps within Discord range', () => {
      expect(validateBitrate(1000)).toBe(8000);
      expect(validateBitrate(64000)).toBe(64000);
      expect(validateBitrate(1000000)).toBe(512000);
      expect(validateBitrate(NaN)).toBe(64000);
    });
  });
});