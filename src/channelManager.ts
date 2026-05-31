import { Guild, VoiceChannel, CategoryChannel, GuildMember, User, ChannelType } from 'discord.js';
import { DynamicVoiceOptions, ChannelMetadata } from './types';
import { renderChannelName, validateBitrate, validateUserLimit, sanitizeChannelName } from './utils';
import { RateLimitQueue } from './rateLimitQueue';

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

  public async createChannelForUser(
    guild: Guild,
    creator: User,
    _member: GuildMember,
    parentCategory?: CategoryChannel | null,
    customName?: string,
    customBitrate?: number,
    customUserLimit?: number
  ): Promise<{ channel: VoiceChannel; metadata: ChannelMetadata }> {
    const channelName = customName ?? renderChannelName(this.options.defaultName, creator);
    const sanitizedName = sanitizeChannelName(channelName);
    const bitrate = validateBitrate(customBitrate ?? this.options.defaultBitrate);
    const userLimit = validateUserLimit(customUserLimit ?? this.options.defaultUserLimit);

    const createdChannel = await this.queue.add(async () => {
      const created = await guild.channels.create({
        name: sanitizedName,
        type: ChannelType.GuildVoice,
        bitrate,
        userLimit,
        parent: parentCategory ?? undefined,
        reason: `Dynamic voice channel created for ${creator.tag}`
      });
      return created;
    });

    const metadata: ChannelMetadata = {
      channel: createdChannel,
      creatorId: creator.id,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      cohosts: []
    };

    return { channel: createdChannel, metadata };
  }

  public async deleteChannel(channel: VoiceChannel): Promise<void> {
    await this.queue.add(async () => {
      if (channel.deletable) {
        await channel.delete('Dynamic voice channel – empty or timed out');
      }
    });
  }

  public async renameChannel(channel: VoiceChannel, newName: string): Promise<void> {
    const sanitized = sanitizeChannelName(newName);
    await this.queue.add(async () => {
      await channel.setName(sanitized, 'Renamed by channel owner');
    });
  }

  public updateActivity(metadata: ChannelMetadata): void {
    metadata.lastActivityAt = new Date();
  }
}