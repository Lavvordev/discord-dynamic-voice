import { Client, VoiceChannel } from 'discord.js';
import EventEmitter from 'events';
import { DynamicVoiceOptions } from './types';
import { ChannelManager } from './channelManager';
import { VoiceStateHandler } from './voiceStateHandler';
import { PersistenceManager } from './persistence';
import { PermissionManager } from './permissionManager';

export class DynamicVoiceManager extends EventEmitter {
  private client: Client;
  private options: DynamicVoiceOptions;
  private channelManager: ChannelManager;
  private persistence: PersistenceManager;
  private voiceHandler: VoiceStateHandler;
  private initialized = false;

  constructor(client: Client, options: DynamicVoiceOptions) {
    super();
    this.client = client;
    this.options = options;
    this.persistence = new PersistenceManager(options.persistenceFilePath);
    this.channelManager = new ChannelManager(options);
    this.voiceHandler = new VoiceStateHandler(this.channelManager, this.persistence, options);
  }

  public async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    await this.cleanupOrphanedChannels();

    this.client.on('voiceStateUpdate', (oldState, newState) => {
      this.voiceHandler.handle(oldState, newState).catch(err => {
        this.emit('error', err);
      });
    });

    this.client.on('channelDelete', (channel) => {
      if (channel.isVoiceBased() && this.persistence.has(channel.id)) {
        this.persistence.delete(channel.id);
      }
    });
  }

  private async cleanupOrphanedChannels(): Promise<void> {
    const stored = this.persistence.getAll();
    for (const data of stored) {
      const guild = this.client.guilds.cache.get(data.guildId);
      if (!guild) {
        this.persistence.delete(data.channelId);
        continue;
      }
      const channel = guild.channels.cache.get(data.channelId) as VoiceChannel;
      if (!channel) {
        this.persistence.delete(data.channelId);
      } else if (channel.members.size === 0) {
        await this.channelManager.deleteChannel(channel);
        this.persistence.delete(data.channelId);
      }
    }
  }

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

  public getOwner(channelId: string): string | null {
    const data = this.persistence.get(channelId);
    return data ? data.creatorId : null;
  }

  public isManagedChannel(channelId: string): boolean {
    return this.persistence.has(channelId);
  }

  public async shutdown(): Promise<void> {
    this.persistence.flush();
    this.initialized = false;
    await Promise.resolve(); // satisfies eslint require-await
  }
}