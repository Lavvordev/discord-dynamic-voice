import { VoiceChannel, PermissionOverwrites, GuildMember, PermissionFlagsBits } from 'discord.js';

/**
 * Manages permission overrides for dynamic voice channels.
 * 
 * The biggest headache with dynamic channels is correctly inheriting
 * from the creator channel while allowing the owner to lock/unlock.
 */
export class PermissionManager {
  /**
   * Clone permission overrides from a source channel to a target channel.
   * Typically used when creating a new dynamic channel.
   */
  public static async cloneOverrides(
    sourceChannel: VoiceChannel,
    targetChannel: VoiceChannel,
    creatorMember: GuildMember
  ): Promise<void> {
    const overrides = sourceChannel.permissionOverwrites.cache.map(override => ({
      id: override.id,
      allow: override.allow.bitfield,
      deny: override.deny.bitfield,
      type: override.type
    }));

    await targetChannel.edit({ permissionOverwrites: overrides });
    
    // Give the creator explicit permissions to manage the channel
    await targetChannel.permissionOverwrites.edit(creatorMember, {
      ManageChannels: true,
      Connect: true,
      Speak: true,
      Stream: true,
      UseVAD: true
    });
  }

  /**
   * Lock the channel for @everyone – prevents them from connecting.
   */
  public static async lockChannel(channel: VoiceChannel): Promise<void> {
    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
      Connect: false
    });
  }

  /**
   * Unlock the channel – resets @everyone's Connect permission to null (inherit).
   */
  public static async unlockChannel(channel: VoiceChannel): Promise<void> {
    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
      Connect: null
    });
  }

  /**
   * Change the user limit of the channel.
   */
  public static async setUserLimit(channel: VoiceChannel, limit: number): Promise<void> {
    await channel.setUserLimit(limit);
  }

  /**
   * Transfer ownership to another member in the channel.
   * Removes old owner's manage permissions and grants to the new one.
   */
  public static async transferOwnership(
    channel: VoiceChannel,
    oldOwnerId: string,
    newOwner: GuildMember
  ): Promise<void> {
    // Remove manage permissions from old owner if they are still in the channel
    const oldOwner = channel.members.get(oldOwnerId);
    if (oldOwner) {
      await channel.permissionOverwrites.edit(oldOwner, {
        ManageChannels: null
      });
    }
    // Grant full control to new owner
    await channel.permissionOverwrites.edit(newOwner, {
      ManageChannels: true,
      Connect: true,
      Speak: true,
      Stream: true,
      UseVAD: true
    });
  }

  /**
   * Check if a member has manage permissions for a channel.
   */
  public static canManage(member: GuildMember, channel: VoiceChannel): boolean {
    const perms = channel.permissionsFor(member);
    return perms?.has(PermissionFlagsBits.ManageChannels) ?? false;
  }
}