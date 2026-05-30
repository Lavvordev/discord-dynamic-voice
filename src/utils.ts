/**
 * Sanitise a potential channel name.
 * Discord channel names have restrictions: max 100 chars, no ":", "*", "?", etc.
 * I've seen bots crash because a username contained a backslash or emoji that broke the name.
 *
 * @param input - Raw name template or user-provided string
 * @returns Sanitised name safe for Discord voice channel
 */
export function sanitizeChannelName(input: string): string {
  if (!input || input.trim().length === 0) {
    return 'voice-channel';
  }

  // Replace Discord-disallowed characters with spaces or hyphens
  // Disallowed: * ? : @ & % # < > \\ / | [ ] { } ` ~
  let sanitized = input.replace(/[\*\?:\@&%#<>\\\/\|\[\]\{\}`~]/g, '');
  // Replace multiple spaces with a single space
  sanitized = sanitized.replace(/\s+/g, ' ');
  // Trim leading/trailing spaces
  sanitized = sanitized.trim();

  // Discord max channel name length is 100 characters
  if (sanitized.length > 100) {
    sanitized = sanitized.slice(0, 97) + '...';
  }

  // Fallback if everything got stripped
  if (sanitized.length === 0) {
    sanitized = 'voice-channel';
  }

  return sanitized;
}

/**
 * Replace placeholders in a channel name template.
 * Supported placeholders: {username}, {displayname}, {id}
 *
 * @param template - String containing placeholders
 * @param user - Discord User object
 * @returns Rendered name
 */
export function renderChannelName(template: string, user: { username: string; displayName?: string; id: string }): string {
  let name = template;
  name = name.replace(/\{username\}/g, user.username);
  name = name.replace(/\{displayname\}/g, user.displayName ?? user.username);
  name = name.replace(/\{id\}/g, user.id);
  return sanitizeChannelName(name);
}

/**
 * Extract the template placeholders present in a string.
 * Used for debugging or validation.
 */
export function getTemplatePlaceholders(template: string): string[] {
  const matches = template.match(/\{([^}]+)\}/g);
  if (!matches) return [];
  return matches.map(m => m.slice(1, -1));
}

/**
 * Validate that a user limit is within Discord's range (0-99).
 * 0 means unlimited.
 */
export function validateUserLimit(limit: number): number {
  if (isNaN(limit)) return 0;
  if (limit < 0) return 0;
  if (limit > 99) return 99;
  return limit;
}

/**
 * Validate bitrate (Discord: 8-512 kbps for regular servers, up to 384 for boosted).
 * We just clamp to a safe range.
 */
export function validateBitrate(bitrate: number): number {
  if (isNaN(bitrate)) return 64000;
  if (bitrate < 8000) return 8000;
  if (bitrate > 512000) return 512000;
  return bitrate;
}

/**
 * Simple debounce utility for reducing file writes.
 */
export function debounce<F extends (...args: any[]) => any>(func: F, waitMs: number): F {
  let timeout: NodeJS.Timeout | null = null;
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitMs);
  }) as F;
}