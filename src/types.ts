import { VoiceChannel, Guild, User } from 'discord.js';

/**
 * Configuration options for DynamicVoiceManager.
 */
export interface DynamicVoiceOptions {
  /** ID of the creator (lobby) channel that users join to spawn a new VC */
  creatorChannelId: string;
  /** Channel name template. Supports {username}, {displayname}, {id} */
  defaultName?: string;
  /** Bitrate in kbps (default: 64000) */
  defaultBitrate?: number;
  /** Maximum user limit for new channels (0 = unlimited, default: 0) */
  defaultUserLimit?: number;
  /** Delete channel automatically when empty (default: true) */
  autoDeleteWhenEmpty?: boolean;
  /** Milliseconds to wait before deleting empty channel (default: 0) */
  emptyDeleteDelayMs?: number;
  /** Minimum cooldown in ms between channel creations per user (default: 5000) */
  creationCooldownMs?: number;
  /** Delay between channel creation requests to avoid rate limits (default: 1000) */
  requestQueueDelayMs?: number;
  /** Path to JSON persistence file (default: './dynamic-voice-state.json') */
  persistenceFilePath?: string;
}

/**
 * Stored data for each dynamic voice channel.
 */
export interface StoredChannelData {
  channelId: string;
  creatorId: string;
  guildId: string;
  createdAt: number;
  lastActivityAt: number;
}

/**
 * Internal map of channel ID to its metadata.
 */
export interface ChannelMetadata {
  channel: VoiceChannel;
  creatorId: string;
  createdAt: Date;
  lastActivityAt: Date;
}

/**
 * Event payloads for the manager's event emitter.
 */
export interface Events {
  channelCreated: (channel: VoiceChannel, creator: User) => void;
  channelEmpty: (channel: VoiceChannel) => void;
  ownerSwapped: (channel: VoiceChannel, newOwner: User) => void;
  error: (error: Error) => void;
}