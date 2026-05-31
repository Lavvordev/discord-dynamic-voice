import { VoiceChannel, GuildMember } from 'discord.js';

export class AccessControl {
  private permitted: Map<string, Set<string>> = new Map();
  private blocked: Map<string, Set<string>> = new Map();

  public permit(channelId: string, userId: string): void {
    if (!this.permitted.has(channelId)) {
      this.permitted.set(channelId, new Set());
    }
    this.permitted.get(channelId)!.add(userId);
    // Remove from blocked if present
    if (this.blocked.has(channelId)) {
      this.blocked.get(channelId)!.delete(userId);
    }
  }

  public block(channelId: string, userId: string): void {
    if (!this.blocked.has(channelId)) {
      this.blocked.set(channelId, new Set());
    }
    this.blocked.get(channelId)!.add(userId);
    // Remove from permitted if present
    if (this.permitted.has(channelId)) {
      this.permitted.get(channelId)!.delete(userId);
    }
  }

  public isPermitted(channelId: string, userId: string): boolean {
    if (this.blocked.has(channelId) && this.blocked.get(channelId)!.has(userId)) {
      return false;
    }
    if (this.permitted.has(channelId) && this.permitted.get(channelId)!.has(userId)) {
      return true;
    }
    return true; // default allow
  }

  public getPermitted(channelId: string): string[] {
    return Array.from(this.permitted.get(channelId) ?? []);
  }

  public getBlocked(channelId: string): string[] {
    return Array.from(this.blocked.get(channelId) ?? []);
  }

  public clear(channelId: string): void {
    this.permitted.delete(channelId);
    this.blocked.delete(channelId);
  }
}