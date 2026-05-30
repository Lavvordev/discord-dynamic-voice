import { VoiceChannel } from 'discord.js';

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
}

export interface StoredChannelData {
  channelId: string;
  creatorId: string;
  guildId: string;
  createdAt: number;
  lastActivityAt: number;
}

export interface ChannelMetadata {
  channel: VoiceChannel;
  creatorId: string;
  createdAt: Date;
  lastActivityAt: Date;
}

export interface Events {
  channelCreated: (channel: VoiceChannel, creator: { tag: string; id: string }) => void;
  channelEmpty: (channel: VoiceChannel) => void;
  ownerSwapped: (channel: VoiceChannel, newOwner: { tag: string; id: string }) => void;
  error: (error: Error) => void;
}