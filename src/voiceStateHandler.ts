import { VoiceState, VoiceChannel, GuildMember, Guild } from 'discord.js';
import { DynamicVoiceOptions } from './types';
import { ChannelManager } from './channelManager';
import { PermissionManager } from './permissionManager';
import { PersistenceManager } from './persistence';

export class VoiceStateHandler {
  private creatorChannelId: string;
  private autoDeleteWhenEmpty: boolean;
  private emptyDeleteDelayMs: number;
  private creationCooldownMs: number;
  private cooldowns: Map<string, number>;

  constructor(
    private channelManager: ChannelManager,
    private persistence: PersistenceManager,
    options: DynamicVoiceOptions
  ) {
    this.creatorChannelId = options.creatorChannelId;
    this.autoDeleteWhenEmpty = options.autoDeleteWhenEmpty ?? true;
    this.emptyDeleteDelayMs = options.emptyDeleteDelayMs ?? 0;
    this.creationCooldownMs = options.creationCooldownMs ?? 5000;
    this.cooldowns = new Map();
  }

  public async handle(oldState: VoiceState, newState: VoiceState): Promise<void> {
    const member = newState.member ?? oldState.member;
    if (!member) return;

    const guild = newState.guild ?? oldState.guild;

    if (newState.channelId === this.creatorChannelId && oldState.channelId !== this.creatorChannelId) {
      await this.handleJoinCreator(member, guild);
    }

    if (oldState.channelId && oldState.channelId !== this.creatorChannelId) {
      const dynamicChannel = oldState.channel as VoiceChannel;
      if (dynamicChannel && this.persistence.has(dynamicChannel.id)) {
        await this.handleLeaveDynamicChannel(dynamicChannel);
      }
    }
  }

  private async handleJoinCreator(member: GuildMember, guild: Guild): Promise<void> {
    const now = Date.now();
    const lastCreate = this.cooldowns.get(member.id) ?? 0;
    if (now - lastCreate < this.creationCooldownMs) return;

    const creatorChannel = guild.channels.cache.get(this.creatorChannelId) as VoiceChannel;
    const parentCategory = creatorChannel?.parent ?? null;

    const { channel, metadata } = await this.channelManager.createChannelForUser(
      guild,
      member.user,
      member,
      parentCategory
    );

    await PermissionManager.cloneOverrides(creatorChannel, channel, member);

    this.persistence.set(channel.id, {
      channelId: channel.id,
      creatorId: member.id,
      guildId: guild.id,
      createdAt: metadata.createdAt.getTime(),
      lastActivityAt: metadata.lastActivityAt.getTime()
    });

    await member.voice.setChannel(channel, 'Moving to dynamic channel');
    this.cooldowns.set(member.id, now);
  }

  private async handleLeaveDynamicChannel(channel: VoiceChannel): Promise<void> {
    await this.sleep(500);
    const memberCount = channel.members.size;

    if (memberCount === 0 && this.autoDeleteWhenEmpty) {
      if (this.emptyDeleteDelayMs > 0) {
        await this.sleep(this.emptyDeleteDelayMs);
        if (channel.members.size === 0) {
          await this.deleteDynamicChannel(channel);
        }
      } else {
        await this.deleteDynamicChannel(channel);
      }
    } else if (memberCount > 0) {
      const stored = this.persistence.get(channel.id);
      if (stored) {
        const ownerStillPresent = channel.members.some(m => m.id === stored.creatorId);
        if (!ownerStillPresent) {
          const newOwnerMember = channel.members.first();
          if (newOwnerMember && newOwnerMember.id !== stored.creatorId) {
            await PermissionManager.transferOwnership(channel, stored.creatorId, newOwnerMember);
            stored.creatorId = newOwnerMember.id;
            this.persistence.set(channel.id, stored);
          }
        }
      }
    }
  }

  private async deleteDynamicChannel(channel: VoiceChannel): Promise<void> {
    this.persistence.delete(channel.id);
    await this.channelManager.deleteChannel(channel);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}