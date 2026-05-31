import { VoiceChannel, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { DynamicVoiceManager } from '../manager';

export async function handleAddCohost(
  manager: DynamicVoiceManager,
  interaction: ChatInputCommandInteraction,
  channel: VoiceChannel,
  member: GuildMember
): Promise<void> {
  const targetUser = interaction.options.getUser('user', true);
  const targetMember = interaction.guild?.members.cache.get(targetUser.id);
  if (!targetMember) {
    await interaction.reply({ content: 'User not found in this server.', ephemeral: true });
    return;
  }

  const ownerId = await manager.getOwner(channel.id);
  const isOwner = ownerId === member.id;
  const hasAdmin = member.permissions.has('ManageChannels');

  if (!isOwner && !hasAdmin) {
    await interaction.reply({
      content: 'Only the channel owner can add co-hosts.',
      ephemeral: true
    });
    return;
  }

  try {
    await manager.addCohost(channel, targetUser.id);
    await interaction.reply({
      content: `${targetUser.tag} is now a co-host of this channel.`,
      ephemeral: true
    });
  } catch (err) {
    await interaction.reply({
      content: `Failed to add co-host: ${(err as Error).message}`,
      ephemeral: true
    });
  }
}

export async function handleRemoveCohost(
  manager: DynamicVoiceManager,
  interaction: ChatInputCommandInteraction,
  channel: VoiceChannel,
  member: GuildMember
): Promise<void> {
  const targetUser = interaction.options.getUser('user', true);
  const ownerId = await manager.getOwner(channel.id);
  const isOwner = ownerId === member.id;
  const hasAdmin = member.permissions.has('ManageChannels');

  if (!isOwner && !hasAdmin) {
    await interaction.reply({
      content: 'Only the channel owner can remove co-hosts.',
      ephemeral: true
    });
    return;
  }

  try {
    await manager.removeCohost(channel, targetUser.id);
    await interaction.reply({
      content: `${targetUser.tag} is no longer a co-host.`,
      ephemeral: true
    });
  } catch (err) {
    await interaction.reply({
      content: `Failed to remove co-host: ${(err as Error).message}`,
      ephemeral: true
    });
  }
}