import { VoiceState, VoiceChannel, GuildMember, Guild } from 'discord.js';
import { DynamicVoiceOptions } from './types';
import { ChannelManager } from './channelManager';
import { PermissionManager } from './permissionManager';
import { PersistenceManager } from './persistence';
import { DynamicVoiceManager } from './manager';

export class VoiceStateHandler {
  private creatorChannelId: string;
  private autoDeleteWhenEmpty: boolean;
  private emptyDeleteDelayMs: number;
  private creationCooldownMs: number;
  private cooldowns: Map<string, number>;

  constructor(
    private channelManager: ChannelManager,
    private persistence: PersistenceManager,
    options: DynamicVoiceOptions,
    private manager: DynamicVoiceManager
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
      if (dynamicChannel && (await this.persistence.hasChannel(dynamicChannel.id))) {
        await this.handleLeaveDynamicChannel(dynamicChannel);
      }
    }
  }

  private async handleJoinCreator(member: GuildMember, guild: Guild): Promise<void> {
    const now = Date.now();
    const lastCreate = this.cooldowns.get(member.id) ?? 0;
    const tier = this.manager.getPremiumTierForMember(member);
    const bypassCooldown = tier?.bypassCooldown ?? false;
    if (!bypassCooldown && now - lastCreate < this.creationCooldownMs) return;

    const creatorChannel = guild.channels.cache.get(this.creatorChannelId) as VoiceChannel;
    const parentCategory = creatorChannel?.parent ?? null;

    const prefs = this.persistence.getUserPreferences(member.id);
    const defaultName = (this.manager as any).options.defaultName ?? "{username}'s voice";
    const defaultBitrate = (this.manager as any).options.defaultBitrate ?? 64000;
    const defaultUserLimit = (this.manager as any).options.defaultUserLimit ?? 0;

    const channelName = prefs?.defaultName ?? defaultName;
    const bitrate = tier?.defaultBitrate ?? prefs?.defaultBitrate ?? defaultBitrate;
    const userLimit = tier?.defaultUserLimit ?? prefs?.defaultUserLimit ?? defaultUserLimit;

    const { channel, metadata } = await this.channelManager.createChannelForUser(
      guild,
      member.user,
      member,
      parentCategory,
      channelName,
      bitrate,
      userLimit
    );

    await PermissionManager.cloneOverrides(creatorChannel, channel, member);

    const storedData = {
      channelId: channel.id,
      creatorId: member.id,
      guildId: guild.id,
      createdAt: metadata.createdAt.getTime(),
      lastActivityAt: metadata.lastActivityAt.getTime(),
      cohosts: [],
      locked: prefs?.defaultLocked ?? false
    };
    await this.persistence.setChannel(channel.id, storedData);

    if (prefs?.defaultLocked) {
      await PermissionManager.lockChannel(channel);
    }

    await member.voice.setChannel(channel, 'Moving to dynamic channel');
    this.cooldowns.set(member.id, now);
  }

  private async handleLeaveDynamicChannel(channel: VoiceChannel): Promise<void> {
    await this.sleep(500);
    const memberCount = channel.members.size;
    const data = await this.persistence.getChannel(channel.id);

    if (memberCount === 0 && this.autoDeleteWhenEmpty) {
      if (this.emptyDeleteDelayMs > 0) {
        await this.sleep(this.emptyDeleteDelayMs);
        if (channel.members.size === 0) {
          await this.deleteDynamicChannel(channel);
        }
      } else {
        await this.deleteDynamicChannel(channel);
      }
    } else if (memberCount > 0 && data) {
      const ownerStillPresent = channel.members.some(m => m.id === data.creatorId);
      if (!ownerStillPresent) {
        const newOwnerMember = channel.members.first();
        if (newOwnerMember && newOwnerMember.id !== data.creatorId) {
          await PermissionManager.transferOwnership(channel, data.creatorId, newOwnerMember);
          data.creatorId = newOwnerMember.id;
          await this.persistence.setChannel(channel.id, data);
          this.manager.emit('ownerSwapped', channel, newOwnerMember.user);
        } else {
          this.manager.openClaimWindow(channel, Array.from(channel.members.values()));
        }
      }
    }
  }

  private async deleteDynamicChannel(channel: VoiceChannel): Promise<void> {
    await this.persistence.deleteChannel(channel.id);
    await this.channelManager.deleteChannel(channel);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}