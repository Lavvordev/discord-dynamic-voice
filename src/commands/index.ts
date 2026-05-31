/**
 * Command handler exports for slash command integration.
 * These functions assume you have already validated the interaction
 * and have access to the DynamicVoiceManager instance.
 */

// Existing commands (v1.0.7)
export { handleRename } from './rename';
export { handleLimit } from './limit';
export { handleLock } from './lock';
export { handleUnlock } from './unlock';

// New commands (v1.0.8)
export { handleHide, handleUnhide } from './hide';
export { handlePermit, handleBlock } from './permit';
export { handleKnock } from './knock';
export { handleAddCohost, handleRemoveCohost } from './cohost';
export { handleClaim } from './claim';