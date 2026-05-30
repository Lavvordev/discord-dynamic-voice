import { VoiceState, VoiceChannel, GuildMember, User } from 'discord.js';
import { DynamicVoiceOptions, ChannelMetadata } from './types';
import { ChannelManager } from './channelManager';
import { PermissionManager } from './permissionManager';
import { PersistenceManager } from './persistence';

/**
 * Listens to voiceStateUpdate events and triggers channel creation/deletion/transfer.
 * 
 * This is the core of the package – it reacts when users join/leave the creator channel
 * and when dynamic channels become empty.
 */
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

  /**
   * Handle voice state updates.
   */
  public async handle(oldState: VoiceState, newState: VoiceState): Promise<void> {
    const member = newState.member ?? oldState.member;
    if (!member) return;

    const userId = member.id;
    const guild = newState.guild ?? oldState.guild;

    // Case 1: User joined the creator channel
    if (newState.channelId === this.creatorChannelId && oldState.channelId !== this.creatorChannelId) {
      await this.handleJoinCreator(member, guild);
    }

    // Case 2: User left a dynamic channel (including creator channel)
    if (oldState.channelId && oldState.channelId !== this.creatorChannelId) {
      const dynamicChannel = oldState.channel as VoiceChannel;
      if (dynamicChannel && this.persistence.has(dynamicChannel.id)) {
        await this.handleLeaveDynamicChannel(dynamicChannel);
      }
    }

    // Case 3: User moved from one dynamic channel to another – handled by leave+join
  }

  private async handleJoinCreator(member: GuildMember, guild: any): Promise<void> {
    const userId = member.id;
    const now = Date.now();
    const lastCreate = this.cooldowns.get(userId) ?? 0;
    if (now - lastCreate < this.creationCooldownMs) {
      return; // Spam prevention
    }

    // Find the category of the creator channel
    const creatorChannel = guild.channels.cache.get(this.creatorChannelId) as VoiceChannel;
    const parentCategory = creatorChannel?.parent;

    // Create new dynamic channel
    const { channel, metadata } = await this.channelManager.createChannelForUser(
      guild,
      member.user,
      member,
      parentCategory
    );

    // Clone permission overrides from creator channel
    await PermissionManager.cloneOverrides(creatorChannel, channel, member);

    // Store metadata
    this.persistence.set(channel.id, {
      channelId: channel.id,
      creatorId: member.id,
      guildId: guild.id,
      createdAt: metadata.createdAt.getTime(),
      lastActivityAt: metadata.lastActivityAt.getTime()
    });

    // Move the user into their new channel
    await member.voice.setChannel(channel, 'Moving to dynamic channel');
    this.cooldowns.set(userId, now);
  }

  private async handleLeaveDynamicChannel(channel: VoiceChannel): Promise<void> {
    // Wait a bit to see if someone else joins
    await this.delay(500);
    const memberCount = channel.members.size;

    if (memberCount === 0 && this.autoDeleteWhenEmpty) {
      const deleteDelay = this.emptyDeleteDelayMs;
      if (deleteDelay > 0) {
        await this.delay(deleteDelay);
        // Re-check emptiness after delay
        if (channel.members.size === 0) {
          await this.deleteDynamicChannel(channel);
        }
      } else {
        await this.deleteDynamicChannel(channel);
      }
    } else if (memberCount > 0) {
      // Check if owner left and there are other members – transfer ownership
      const stored = this.persistence.get(channel.id);
      if (stored) {
        const ownerId = stored.creatorId;
        const ownerStillPresent = channel.members.some(m => m.id === ownerId);
        if (!ownerStillPresent) {
          // Transfer to the oldest member in the channel
          const newOwnerMember = channel.members.first();
          if (newOwnerMember && newOwnerMember.id !== ownerId) {
            await PermissionManager.transferOwnership(channel, ownerId, newOwnerMember);
            stored.creatorId = newOwnerMember.id;
            this.persistence.set(channel.id, stored);
            // Emit owner swapped event will be handled by manager
          }
        }
      }
    }
  }

  private async deleteDynamicChannel(channel: VoiceChannel): Promise<void> {
    this.persistence.delete(channel.id);
    await this.channelManager.deleteChannel(channel);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}