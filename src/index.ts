/**
 * discord-dynamic-voice
 * 
 * A plug-and-play manager for Discord bots that creates temporary voice channels.
 * Users join a designated "creator" channel, get a private channel they control,
 * and it auto-deletes when empty.
 * 
 * Exports:
 * - DynamicVoiceManager: main class
 * - Command handlers: handleRename, handleLimit, handleLock, handleUnlock
 * - Types and utilities
 */

// Main manager
export { DynamicVoiceManager } from './manager';

// Command handlers (for slash commands integration)
export {
  handleRename,
  handleLimit,
  handleLock,
  handleUnlock
} from './commands';

// Types for external use
export type {
  DynamicVoiceOptions,
  StoredChannelData,
  ChannelMetadata,
  Events
} from './types';

// Utility functions (in case developers need them)
export {
  sanitizeChannelName,
  renderChannelName,
  validateUserLimit,
  validateBitrate
} from './utils';

// Persistence manager (advanced usage)
export { PersistenceManager } from './persistence';