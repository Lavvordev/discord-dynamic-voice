export function sanitizeChannelName(input: string): string {
  if (!input || input.trim().length === 0) {
    return 'voice-channel';
  }

  // Discord disallowed characters: * ? : @ & % # < > \ / | [ ] { } ` ~
  // Remove them without unnecessary escapes – just list them literally inside a character class.
  const disallowed = /[*?:@&%#<>\\/|[\]{}`~]/g;
  let sanitized = input.replace(disallowed, '');
  sanitized = sanitized.replace(/\s+/g, ' ');
  sanitized = sanitized.trim();

  if (sanitized.length > 100) {
    sanitized = sanitized.slice(0, 97) + '...';
  }
  if (sanitized.length === 0) {
    sanitized = 'voice-channel';
  }
  return sanitized;
}

export function renderChannelName(
  template: string,
  user: { username: string; displayName?: string; id: string }
): string {
  let name = template;
  name = name.replace(/\{username\}/g, user.username);
  name = name.replace(/\{displayname\}/g, user.displayName ?? user.username);
  name = name.replace(/\{id\}/g, user.id);
  return sanitizeChannelName(name);
}

export function getTemplatePlaceholders(template: string): string[] {
  const matches = template.match(/\{([^}]+)\}/g);
  if (!matches) return [];
  return matches.map(m => m.slice(1, -1));
}

export function validateUserLimit(limit: number): number {
  if (isNaN(limit)) return 0;
  if (limit < 0) return 0;
  if (limit > 99) return 99;
  return limit;
}

export function validateBitrate(bitrate: number): number {
  if (isNaN(bitrate)) return 64000;
  if (bitrate < 8000) return 8000;
  if (bitrate > 512000) return 512000;
  return bitrate;
}

export function debounce<F extends (...args: never[]) => void>(func: F, waitMs: number): F {
  let timeout: NodeJS.Timeout | null = null;
  return ((...args: never[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitMs);
  }) as F;
}