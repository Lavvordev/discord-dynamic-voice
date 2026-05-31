import { VoiceChannel, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { DynamicVoiceManager } from '../manager';

export async function handleHide(
  manager: DynamicVoiceManager,
  interaction: ChatInputCommandInteraction,
  channel: VoiceChannel,
  member: GuildMember
): Promise<void> {
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
    await manager.hideChannel(channel);
    await interaction.reply({ content: 'Channel hidden. Others cannot see it.', ephemeral: true });
  } catch (err) {
    await interaction.reply({
      content: `Failed to hide channel: ${(err as Error).message}`,
      ephemeral: true
    });
  }
}

export async function handleUnhide(
  manager: DynamicVoiceManager,
  interaction: ChatInputCommandInteraction,
  channel: VoiceChannel,
  member: GuildMember
): Promise<void> {
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
    await manager.unhideChannel(channel);
    await interaction.reply({ content: 'Channel unhidden. Visible to everyone.', ephemeral: true });
  } catch (err) {
    await interaction.reply({
      content: `Failed to unhide channel: ${(err as Error).message}`,
      ephemeral: true
    });
  }
}