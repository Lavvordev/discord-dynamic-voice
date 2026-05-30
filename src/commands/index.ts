/**
 * Command handler exports for slash command integration.
 * These functions assume you have already validated the interaction
 * and have access to the DynamicVoiceManager instance.
 * 
 * The developer must create their own slash command registration.
 * This module provides the business logic for each command.
 */
export { handleRename } from './rename';
export { handleLimit } from './limit';
export { handleLock } from './lock';
export { handleUnlock } from './unlock';