import { VoiceChannel, GuildMember, PermissionFlagsBits } from 'discord.js';

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

  public static async hideChannel(channel: VoiceChannel): Promise<void> {
    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
      ViewChannel: false
    });
  }

  public static async unhideChannel(channel: VoiceChannel): Promise<void> {
    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
      ViewChannel: null
    });
  }

  public static async permitUser(channel: VoiceChannel, userId: string): Promise<void> {
    const member = await channel.guild.members.fetch(userId).catch(() => null);
    if (!member) throw new Error('User not found');
    await channel.permissionOverwrites.edit(member, {
      Connect: true,
      ViewChannel: true
    });
  }

  public static async blockUser(channel: VoiceChannel, userId: string): Promise<void> {
    const member = await channel.guild.members.fetch(userId).catch(() => null);
    if (!member) throw new Error('User not found');
    await channel.permissionOverwrites.edit(member, {
      Connect: false,
      ViewChannel: false
    });
    if (member.voice.channelId === channel.id) {
      await member.voice.disconnect('Blocked from channel');
    }
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