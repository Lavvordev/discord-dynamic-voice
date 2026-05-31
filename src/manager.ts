import { Client, VoiceChannel, GuildMember, User } from 'discord.js';
import EventEmitter from 'events';
import { DynamicVoiceOptions, UserPreferences, PremiumTier, KnockRequest, StoredChannelData } from './types';
import { ChannelManager } from './channelManager';
import { VoiceStateHandler } from './voiceStateHandler';
import { PersistenceManager } from './persistence';
import { PermissionManager } from './permissionManager';
import { JSONFileAdapter } from './storageAdapter';

export class DynamicVoiceManager extends EventEmitter {
  private client: Client;
  private options: DynamicVoiceOptions;
  private channelManager: ChannelManager;
  private persistence: PersistenceManager;
  private voiceHandler: VoiceStateHandler;
  private claimWindows: Map<string, NodeJS.Timeout>;
  private knockRequests: Map<string, KnockRequest>;
  private initialized = false;

  constructor(client: Client, options: DynamicVoiceOptions) {
    super();
    this.client = client;
    this.options = options;
    const adapter = options.storageAdapter ?? new JSONFileAdapter(options.persistenceFilePath ?? './dynamic-voice-state.json');
    this.persistence = new PersistenceManager(adapter, options.persistenceFilePath);
    this.channelManager = new ChannelManager(options);
    this.claimWindows = new Map();
    this.knockRequests = new Map();
    this.voiceHandler = new VoiceStateHandler(this.channelManager, this.persistence, options, this);
  }

  public async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    await this.cleanupOrphanedChannels();
    this.client.on('voiceStateUpdate', (oldState, newState) => {
      this.voiceHandler.handle(oldState, newState).catch(err => this.emit('error', err));
    });
    this.client.on('channelDelete', (channel) => {
      if (channel.isVoiceBased()) {
        this.persistence.hasChannel(channel.id).then(has => {
          if (has) this.persistence.deleteChannel(channel.id);
        });
      }
    });
  }

  private async cleanupOrphanedChannels(): Promise<void> {
    const stored = await this.persistence.getAllChannels();
    for (const data of stored) {
      const guild = this.client.guilds.cache.get(data.guildId);
      if (!guild) {
        await this.persistence.deleteChannel(data.channelId);
        continue;
      }
      const channel = guild.channels.cache.get(data.channelId) as VoiceChannel;
      if (!channel) {
        await this.persistence.deleteChannel(data.channelId);
      } else if (channel.members.size === 0) {
        await this.channelManager.deleteChannel(channel);
        await this.persistence.deleteChannel(data.channelId);
      }
    }
  }

  // Permission isolation methods
  public async hideChannel(channel: VoiceChannel): Promise<void> {
    await PermissionManager.hideChannel(channel);
  }

  public async unhideChannel(channel: VoiceChannel): Promise<void> {
    await PermissionManager.unhideChannel(channel);
  }

  public async permitUser(channel: VoiceChannel, userId: string): Promise<void> {
    await PermissionManager.permitUser(channel, userId);
  }

  public async blockUser(channel: VoiceChannel, userId: string): Promise<void> {
    await PermissionManager.blockUser(channel, userId);
  }

  public async knockChannel(channel: VoiceChannel, knocker: GuildMember, owner: User): Promise<void> {
    const request: KnockRequest = {
      channelId: channel.id,
      userId: knocker.id,
      userName: knocker.user.tag,
      timestamp: Date.now()
    };
    this.knockRequests.set(`${channel.id}-${knocker.id}`, request);
    this.emit('knockRequest', channel, knocker.user, owner);
  }

  // Cohost methods
  public async addCohost(channel: VoiceChannel, userId: string): Promise<void> {
    const data = await this.persistence.getChannel(channel.id);
    if (!data) throw new Error('Channel not managed');
    const cohosts = data.cohosts ?? [];
    if (!cohosts.includes(userId)) {
      cohosts.push(userId);
      data.cohosts = cohosts;
      await this.persistence.setChannel(channel.id, data);
    }
  }

  public async removeCohost(channel: VoiceChannel, userId: string): Promise<void> {
    const data = await this.persistence.getChannel(channel.id);
    if (!data) throw new Error('Channel not managed');
    const cohosts = data.cohosts ?? [];
    const index = cohosts.indexOf(userId);
    if (index !== -1) {
      cohosts.splice(index, 1);
      data.cohosts = cohosts;
      await this.persistence.setChannel(channel.id, data);
    }
  }

  public async getCohosts(channelId: string): Promise<string[]> {
    const data = await this.persistence.getChannel(channelId);
    return data?.cohosts ?? [];
  }

  // Claim window methods
  public async claimChannel(channel: VoiceChannel, newOwner: GuildMember): Promise<boolean> {
    const data = await this.persistence.getChannel(channel.id);
    if (!data) return false;
    const windowId = `claim-${channel.id}`;
    if (!this.claimWindows.has(windowId)) return false;
    clearTimeout(this.claimWindows.get(windowId)!);
    this.claimWindows.delete(windowId);
    data.creatorId = newOwner.id;
    await this.persistence.setChannel(channel.id, data);
    await PermissionManager.transferOwnership(channel, data.creatorId, newOwner);
    this.emit('channelClaimed', channel, newOwner.user);
    return true;
  }

  public openClaimWindow(channel: VoiceChannel, remainingMembers: GuildMember[]): void {
    const windowId = `claim-${channel.id}`;
    if (this.claimWindows.has(windowId)) return;
    this.emit('claimWindowOpened', channel, remainingMembers);
    const timeout = setTimeout(async () => {
      this.claimWindows.delete(windowId);
      const data = await this.persistence.getChannel(channel.id);
      if (data && channel.members.size === 0) {
        await this.channelManager.deleteChannel(channel);
        await this.persistence.deleteChannel(channel.id);
      }
    }, 60000);
    this.claimWindows.set(windowId, timeout);
  }

  // User preferences
  public async setUserPreferences(userId: string, prefs: UserPreferences): Promise<void> {
    await this.persistence.setUserPreferences(userId, prefs);
  }

  public getUserPreferences(userId: string): UserPreferences | null {
    return this.persistence.getUserPreferences(userId);
  }

  // Premium tier helper
  public getPremiumTierForMember(member: GuildMember): PremiumTier | null {
    const tiers = this.options.premiumTiers ?? [];
    for (const tier of tiers) {
      if (member.roles.cache.has(tier.roleId)) {
        return tier;
      }
    }
    return null;
  }

  // Existing public methods
  public async lockChannel(channel: VoiceChannel): Promise<void> {
    await PermissionManager.lockChannel(channel);
  }

  public async unlockChannel(channel: VoiceChannel): Promise<void> {
    await PermissionManager.unlockChannel(channel);
  }

  public async setUserLimit(channel: VoiceChannel, limit: number): Promise<void> {
    await PermissionManager.setUserLimit(channel, limit);
  }

  public async renameChannel(channel: VoiceChannel, newName: string): Promise<void> {
    await this.channelManager.renameChannel(channel, newName);
  }

  public async getOwner(channelId: string): Promise<string | null> {
    const data = await this.persistence.getChannel(channelId);
    return data ? data.creatorId : null;
  }

  public async isManagedChannel(channelId: string): Promise<boolean> {
    return await this.persistence.hasChannel(channelId);
  }

  public async shutdown(): Promise<void> {
    await this.persistence.flush();
    this.initialized = false;
  }
}