import { Guild, VoiceChannel, CategoryChannel, GuildMember, User, ChannelType } from 'discord.js';
import { DynamicVoiceOptions, ChannelMetadata } from './types';
import { renderChannelName, validateBitrate, validateUserLimit, sanitizeChannelName } from './utils';
import { RateLimitQueue } from './rateLimitQueue';

/**
 * Handles creation, deletion, and modification of dynamic voice channels.
 * Uses a rate-limit queue to avoid 429 errors.
 */
export class ChannelManager {
  private queue: RateLimitQueue;
  private options: Required<Pick<DynamicVoiceOptions, 'defaultName' | 'defaultBitrate' | 'defaultUserLimit' | 'requestQueueDelayMs'>>;

  constructor(options: DynamicVoiceOptions) {
    this.queue = new RateLimitQueue(options.requestQueueDelayMs ?? 1000);
    this.options = {
      defaultName: options.defaultName ?? '{username}\'s voice',
      defaultBitrate: options.defaultBitrate ?? 64000,
      defaultUserLimit: options.defaultUserLimit ?? 0,
      requestQueueDelayMs: options.requestQueueDelayMs ?? 1000
    };
  }

  /**
   * Create a new voice channel for a user.
   * Returns the created channel and its metadata.
   */
  public async createChannelForUser(
    guild: Guild,
    creator: User,
    _member: GuildMember,
    parentCategory?: CategoryChannel | null
  ): Promise<{ channel: VoiceChannel; metadata: ChannelMetadata }> {
    const channelName = renderChannelName(this.options.defaultName, creator);
    const sanitizedName = sanitizeChannelName(channelName);
    const bitrate = validateBitrate(this.options.defaultBitrate);
    const userLimit = validateUserLimit(this.options.defaultUserLimit);

    const createdChannel = await this.queue.add(async () => {
      const created = await guild.channels.create({
        name: sanitizedName,
        type: ChannelType.GuildVoice,
        bitrate,
        userLimit,
        parent: parentCategory ?? undefined,
        reason: `Dynamic voice channel created for ${creator.tag}`
      });
      // Discord.js v14 returns a VoiceChannel when type is GuildVoice – no assertion needed.
      return created;
    });

    const metadata: ChannelMetadata = {
      channel: createdChannel,
      creatorId: creator.id,
      createdAt: new Date(),
      lastActivityAt: new Date()
    };

    return { channel: createdChannel, metadata };
  }

  /**
   * Delete a voice channel.
   */
  public async deleteChannel(channel: VoiceChannel): Promise<void> {
    await this.queue.add(async () => {
      if (channel.deletable) {
        await channel.delete('Dynamic voice channel – empty or timed out');
      }
    });
  }

  /**
   * Rename a channel.
   */
  public async renameChannel(channel: VoiceChannel, newName: string): Promise<void> {
    const sanitized = sanitizeChannelName(newName);
    await this.queue.add(async () => {
      await channel.setName(sanitized, 'Renamed by channel owner');
    });
  }

  /**
   * Update last activity timestamp for a channel (used for stale detection).
   */
  public updateActivity(metadata: ChannelMetadata): void {
    metadata.lastActivityAt = new Date();
  }
}