import { VoiceChannel, GuildMember, PermissionFlagsBits } from 'discord.js';

/**
 * Manages permission overrides for dynamic voice channels.
 */
export class PermissionManager {
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

    await targetChannel.permissionOverwrites.edit(creatorMember, {
      ManageChannels: true,
      Connect: true,
      Speak: true,
      Stream: true,
      UseVAD: true
    });
  }

  public static async lockChannel(channel: VoiceChannel): Promise<void> {
    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
      Connect: false
    });
  }

  public static async unlockChannel(channel: VoiceChannel): Promise<void> {
    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
      Connect: null
    });
  }

  public static async setUserLimit(channel: VoiceChannel, limit: number): Promise<void> {
    await channel.setUserLimit(limit);
  }

  public static async transferOwnership(
    channel: VoiceChannel,
    oldOwnerId: string,
    newOwner: GuildMember
  ): Promise<void> {
    const oldOwner = channel.members.get(oldOwnerId);
    if (oldOwner) {
      await channel.permissionOverwrites.edit(oldOwner, {
        ManageChannels: null
      });
    }
    await channel.permissionOverwrites.edit(newOwner, {
      ManageChannels: true,
      Connect: true,
      Speak: true,
      Stream: true,
      UseVAD: true
    });
  }

  public static canManage(member: GuildMember, channel: VoiceChannel): boolean {
    const perms = channel.permissionsFor(member);
    return perms?.has(PermissionFlagsBits.ManageChannels) ?? false;
  }
}