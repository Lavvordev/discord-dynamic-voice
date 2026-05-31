import { VoiceChannel, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { DynamicVoiceManager } from '../manager';

export async function handlePermit(
  manager: DynamicVoiceManager,
  interaction: ChatInputCommandInteraction,
  channel: VoiceChannel,
  member: GuildMember
): Promise<void> {
  const targetUser = interaction.options.getUser('user', true);
  const ownerId = await manager.getOwner(channel.id);
  const isOwner = ownerId === member.id;
  const cohosts = await manager.getCohosts(channel.id);
  const isCohost = cohosts.includes(member.id);
  const hasAdmin = member.permissions.has('ManageChannels');

  if (!isOwner && !isCohost && !hasAdmin) {
    await interaction.reply({
      content: 'You are not the owner or co-host of this voice channel.',
      ephemeral: true
    });
    return;
  }

  try {
    await manager.permitUser(channel, targetUser.id);
    await interaction.reply({
      content: `User ${targetUser.tag} can now join this channel.`,
      ephemeral: true
    });
  } catch (err) {
    await interaction.reply({
      content: `Failed to permit user: ${(err as Error).message}`,
      ephemeral: true
    });
  }
}

export async function handleBlock(
  manager: DynamicVoiceManager,
  interaction: ChatInputCommandInteraction,
  channel: VoiceChannel,
  member: GuildMember
): Promise<void> {
  const targetUser = interaction.options.getUser('user', true);
  const ownerId = await manager.getOwner(channel.id);
  const isOwner = ownerId === member.id;
  const cohosts = await manager.getCohosts(channel.id);
  const isCohost = cohosts.includes(member.id);
  const hasAdmin = member.permissions.has('ManageChannels');

  if (!isOwner && !isCohost && !hasAdmin) {
    await interaction.reply({
      content: 'You are not the owner or co-host of this voice channel.',
      ephemeral: true
    });
    return;
  }

  try {
    await manager.blockUser(channel, targetUser.id);
    await interaction.reply({
      content: `User ${targetUser.tag} has been blocked and disconnected.`,
      ephemeral: true
    });
  } catch (err) {
    await interaction.reply({
      content: `Failed to block user: ${(err as Error).message}`,
      ephemeral: true
    });
  }
}