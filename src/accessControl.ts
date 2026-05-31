import { VoiceChannel, GuildMember, PermissionFlagsBits } from 'discord.js';
import { StorageAdapter } from './types';

export class AccessControlManager {
  private storage: StorageAdapter;
  private prefixPermits = 'permit:';
  private prefixBlocks = 'block:';

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private getPermitKey(channelId: string): string {
    return `${this.prefixPermits}${channelId}`;
  }

  private getBlockKey(channelId: string): string {
    return `${this.prefixBlocks}${channelId}`;
  }

  async permitUser(channel: VoiceChannel, userId: string): Promise<void> {
    const key = this.getPermitKey(channel.id);
    const permits = (await this.storage.get(key)) || [];
    if (!permits.includes(userId)) {
      permits.push(userId);
      await this.storage.set(key, permits);
    }
    // Update Discord permissions
    await channel.permissionOverwrites.edit(userId, { Connect: true });
  }

  async blockUser(channel: VoiceChannel, userId: string): Promise<void> {
    const key = this.getBlockKey(channel.id);
    const blocks = (await this.storage.get(key)) || [];
    if (!blocks.includes(userId)) {
      blocks.push(userId);
      await this.storage.set(key, blocks);
    }
    await channel.permissionOverwrites.edit(userId, { Connect: false });
    // Disconnect if inside
    const member = channel.members.get(userId);
    if (member) await member.voice.disconnect();
  }

  async removePermit(channelId: string, userId: string): Promise<void> {
    const key = this.getPermitKey(channelId);
    const permits = (await this.storage.get(key)) || [];
    const newPermits = permits.filter((id: string) => id !== userId);
    await this.storage.set(key, newPermits);
    const channel = await this.getChannel(channelId);
    if (channel) await channel.permissionOverwrites.delete(userId);
  }

  async removeBlock(channelId: string, userId: string): Promise<void> {
    const key = this.getBlockKey(channelId);
    const blocks = (await this.storage.get(key)) || [];
    const newBlocks = blocks.filter((id: string) => id !== userId);
    await this.storage.set(key, newBlocks);
    const channel = await this.getChannel(channelId);
    if (channel) await channel.permissionOverwrites.delete(userId);
  }

  async isPermitted(channelId: string, userId: string): Promise<boolean> {
    const key = this.getPermitKey(channelId);
    const permits = (await this.storage.get(key)) || [];
    return permits.includes(userId);
  }

  async isBlocked(channelId: string, userId: string): Promise<boolean> {
    const key = this.getBlockKey(channelId);
    const blocks = (await this.storage.get(key)) || [];
    return blocks.includes(userId);
  }

  private async getChannel(channelId: string): Promise<VoiceChannel | null> {
    // This will be injected from the manager, simplified for now
    return null;
  }
}