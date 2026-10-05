import { SmsCommandParser } from './sms-command-parser';

describe('SmsCommandParser', () => {
  describe('Accept / Decline commands', () => {
    it('parses single digit "1" as ACCEPT', () => {
      const res = SmsCommandParser.parse('1');
      expect(res.type).toBe('ACCEPT');
      expect(res.shortCode).toBeUndefined();
    });

    it('parses "1 184" as ACCEPT with short code "184"', () => {
      const res = SmsCommandParser.parse('1 184');
      expect(res.type).toBe('ACCEPT');
      expect(res.shortCode).toBe('184');
    });

    it('parses "1 #184" stripping hash prefix', () => {
      const res = SmsCommandParser.parse('1 #184');
      expect(res.type).toBe('ACCEPT');
      expect(res.shortCode).toBe('184');
    });

    it('parses "ACCEPT 184" case-insensitively', () => {
      const res = SmsCommandParser.parse('accept 184');
      expect(res.type).toBe('ACCEPT');
      expect(res.shortCode).toBe('184');
    });

    it('parses "2" and "2 #184" as DECLINE', () => {
      const res1 = SmsCommandParser.parse('2');
      expect(res1.type).toBe('DECLINE');

      const res2 = SmsCommandParser.parse('2 #184');
      expect(res2.type).toBe('DECLINE');
      expect(res2.shortCode).toBe('184');
    });
  });

  describe('Driver availability commands', () => {
    it('parses "ON" and "ONLINE" with leading/trailing whitespaces', () => {
      expect(SmsCommandParser.parse('ON').type).toBe('ONLINE');
      expect(SmsCommandParser.parse('  on  ').type).toBe('ONLINE');
      expect(SmsCommandParser.parse('online').type).toBe('ONLINE');
    });

    it('parses "OFF" and "OFFLINE"', () => {
      expect(SmsCommandParser.parse('OFF').type).toBe('OFFLINE');
      expect(SmsCommandParser.parse('offline').type).toBe('OFFLINE');
    });
  });

  describe('Location reporting commands', () => {
    it('parses "AT SCHOOL"', () => {
      const res = SmsCommandParser.parse('AT SCHOOL');
      expect(res.type).toBe('LOCATION_ZONE');
      expect(res.zoneCode).toBe('SCHOOL');
    });

    it('parses lowercase "at public market" preserving tokens uppercase', () => {
      const res = SmsCommandParser.parse('at public market');
      expect(res.type).toBe('LOCATION_ZONE');
      expect(res.zoneCode).toBe('PUBLIC MARKET');
    });

    it('returns UNKNOWN if AT has no zone specified', () => {
      const res = SmsCommandParser.parse('AT');
      expect(res.type).toBe('UNKNOWN');
    });
  });

  describe('Ride lifecycle status commands', () => {
    it('parses "ARRIVED"', () => {
      expect(SmsCommandParser.parse('ARRIVED').type).toBe('ARRIVED');
      expect(SmsCommandParser.parse('arrived').type).toBe('ARRIVED');
    });

    it('parses "START"', () => {
      expect(SmsCommandParser.parse('START').type).toBe('START');
    });

    it('parses "DONE"', () => {
      expect(SmsCommandParser.parse('DONE').type).toBe('DONE');
    });
  });

  describe('Help and unknown inputs', () => {
    it('parses "HELP" and "?"', () => {
      expect(SmsCommandParser.parse('HELP').type).toBe('HELP');
      expect(SmsCommandParser.parse('?').type).toBe('HELP');
    });

    it('returns UNKNOWN for unrecognized strings and empty input', () => {
      expect(SmsCommandParser.parse('').type).toBe('UNKNOWN');
      expect(SmsCommandParser.parse('   ').type).toBe('UNKNOWN');
      expect(SmsCommandParser.parse('Hello world!').type).toBe('UNKNOWN');
    });
  });
});
