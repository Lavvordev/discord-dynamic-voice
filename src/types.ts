import { VoiceChannel, GuildMember, User } from 'discord.js';

export interface DynamicVoiceOptions {
  creatorChannelId: string;
  defaultName?: string;
  defaultBitrate?: number;
  defaultUserLimit?: number;
  autoDeleteWhenEmpty?: boolean;
  emptyDeleteDelayMs?: number;
  creationCooldownMs?: number;
  requestQueueDelayMs?: number;
  persistenceFilePath?: string;
  storageAdapter?: StorageAdapter;
  enableActivityBadges?: boolean;
  premiumTiers?: PremiumTier[];
}

export interface StoredChannelData {
  channelId: string;
  creatorId: string;
  guildId: string;
  createdAt: number;
  lastActivityAt: number;
  cohosts?: string[];
  locked?: boolean;
  originalName?: string;
}

export interface ChannelMetadata {
  channel: VoiceChannel;
  creatorId: string;
  createdAt: Date;
  lastActivityAt: Date;
  cohosts?: string[];
}

export interface UserPreferences {
  defaultName?: string;
  defaultUserLimit?: number;
  defaultLocked?: boolean;
  defaultBitrate?: number;
}

export interface PremiumTier {
  roleId: string;
  defaultBitrate?: number;
  defaultUserLimit?: number;
  bypassCooldown?: boolean;
  nameTemplate?: string;
}

export interface KnockRequest {
  channelId: string;
  userId: string;
  userName: string;
  timestamp: number;
}

export interface StorageAdapter {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  getAll(prefix?: string): Promise<Map<string, unknown>>;
}

export interface Events {
  channelCreated: (channel: VoiceChannel, creator: User) => void;
  channelEmpty: (channel: VoiceChannel) => void;
  ownerSwapped: (channel: VoiceChannel, newOwner: User) => void;
  error: (error: Error) => void;
  knockRequest: (channel: VoiceChannel, knocker: User, owner: User) => void;
  claimWindowOpened: (channel: VoiceChannel, remainingMembers: GuildMember[]) => void;
  channelClaimed: (channel: VoiceChannel, newOwner: User) => void;
}