import { Client, VoiceChannel, User, GuildMember } from 'discord.js';
import EventEmitter from 'events';
import { DynamicVoiceOptions, ChannelMetadata, StoredChannelData } from './types';
import { ChannelManager } from './channelManager';
import { VoiceStateHandler } from './voiceStateHandler';
import { PersistenceManager } from './persistence';
import { PermissionManager } from './permissionManager';

/**
 * Main class for Discord Dynamic Voice.
 * Extends EventEmitter to provide lifecycle hooks.
 * 
 * Example usage:
 *   const manager = new DynamicVoiceManager(client, { creatorChannelId: '123' });
 *   manager.on('channelCreated', (channel, creator) => { ... });
 *   manager.init();
 */
export class DynamicVoiceManager extends EventEmitter {
  private client: Client;
  private options: DynamicVoiceOptions;
  private channelManager: ChannelManager;
  private persistence: PersistenceManager;
  private voiceHandler: VoiceStateHandler;
  private initialized: boolean = false;

  constructor(client: Client, options: DynamicVoiceOptions) {
    super();
    this.client = client;
    this.options = options;
    this.persistence = new PersistenceManager(options.persistenceFilePath);
    this.channelManager = new ChannelManager(options);
    this.voiceHandler = new VoiceStateHandler(this.channelManager, this.persistence, options);
  }

  /**
   * Initialize the manager.
   * Call this once in your bot's ready event.
   * Cleans up orphaned channels from previous crashes.
   */
  public async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    // Clean up orphaned channels
    await this.cleanupOrphanedChannels();

    // Attach voice state listener
    this.client.on('voiceStateUpdate', (oldState, newState) => {
      this.voiceHandler.handle(oldState, newState).catch(err => {
        this.emit('error', err);
      });
    });

    // Also listen for channel deletions externally
    this.client.on('channelDelete', (channel) => {
      if (channel.isVoiceBased() && this.persistence.has(channel.id)) {
        this.persistence.delete(channel.id);
      }
    });
  }

  /**
   * Remove any channels that exist in persistence but no longer exist in Discord,
   * and also delete any channels that are not managed but were left over.
   */
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
        // Automatically delete empty orphaned channels
        await this.channelManager.deleteChannel(channel);
        this.persistence.delete(data.channelId);
      }
    }
  }

  /**
   * Lock a dynamic channel (prevent @everyone from connecting).
   */
  public async lockChannel(channel: VoiceChannel): Promise<void> {
    await PermissionManager.lockChannel(channel);
  }

  /**
   * Unlock a dynamic channel.
   */
  public async unlockChannel(channel: VoiceChannel): Promise<void> {
    await PermissionManager.unlockChannel(channel);
  }

  /**
   * Set user limit for a dynamic channel.
   */
  public async setUserLimit(channel: VoiceChannel, limit: number): Promise<void> {
    await PermissionManager.setUserLimit(channel, limit);
  }

  /**
   * Rename a dynamic channel.
   */
  public async renameChannel(channel: VoiceChannel, newName: string): Promise<void> {
    await this.channelManager.renameChannel(channel, newName);
  }

  /**
   * Get the owner ID of a dynamic channel.
   */
  public getOwner(channelId: string): string | null {
    const data = this.persistence.get(channelId);
    return data ? data.creatorId : null;
  }

  /**
   * Check if a channel is managed by this manager.
   */
  public isManagedChannel(channelId: string): boolean {
    return this.persistence.has(channelId);
  }

  /**
   * Shutdown the manager – flush persistence and clean up.
   */
  public async shutdown(): Promise<void> {
    this.persistence.flush();
    this.initialized = false;
  }
}