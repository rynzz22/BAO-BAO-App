export type SmsCommandType =
  | 'ACCEPT'
  | 'DECLINE'
  | 'ONLINE'
  | 'OFFLINE'
  | 'LOCATION_ZONE'
  | 'ARRIVED'
  | 'START'
  | 'DONE'
  | 'HELP'
  | 'UNKNOWN';

export interface ParsedSmsCommand {
  type: SmsCommandType;
  shortCode?: string;
  zoneCode?: string;
  rawText: string;
}

export class SmsCommandParser {
  public static parse(input: string): ParsedSmsCommand {
    const rawText = input || '';
    const trimmed = rawText.trim();
    if (!trimmed) {
      return { type: 'UNKNOWN', rawText };
    }

    const tokens = trimmed.split(/\s+/);
    const firstWord = tokens[0].toUpperCase();

    // 1 or ACCEPT (with optional shortCode)
    if (firstWord === '1' || firstWord === 'ACCEPT') {
      const shortCode = tokens[1]?.replace(/^#/, '');
      return {
        type: 'ACCEPT',
        shortCode,
        rawText,
      };
    }

    // 2 or DECLINE (with optional shortCode)
    if (firstWord === '2' || firstWord === 'DECLINE') {
      const shortCode = tokens[1]?.replace(/^#/, '');
      return {
        type: 'DECLINE',
        shortCode,
        rawText,
      };
    }

    // ON / ONLINE
    if (firstWord === 'ON' || firstWord === 'ONLINE') {
      return { type: 'ONLINE', rawText };
    }

    // OFF / OFFLINE
    if (firstWord === 'OFF' || firstWord === 'OFFLINE') {
      return { type: 'OFFLINE', rawText };
    }

    // AT <ZONE>
    if (firstWord === 'AT') {
      const zoneCode = tokens.slice(1).join(' ').trim().toUpperCase();
      if (!zoneCode) {
        return { type: 'UNKNOWN', rawText };
      }
      return {
        type: 'LOCATION_ZONE',
        zoneCode,
        rawText,
      };
    }

    // ARRIVED
    if (firstWord === 'ARRIVED') {
      return { type: 'ARRIVED', rawText };
    }

    // START
    if (firstWord === 'START') {
      return { type: 'START', rawText };
    }

    // DONE
    if (firstWord === 'DONE') {
      return { type: 'DONE', rawText };
    }

    // HELP
    if (firstWord === 'HELP' || firstWord === '?') {
      return { type: 'HELP', rawText };
    }

    return { type: 'UNKNOWN', rawText };
  }
}
