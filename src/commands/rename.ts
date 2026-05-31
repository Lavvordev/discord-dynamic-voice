import { VoiceChannel, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { DynamicVoiceManager } from '../manager';
import { sanitizeChannelName } from '../utils';

export async function handleRename(
  manager: DynamicVoiceManager,
  interaction: ChatInputCommandInteraction,
  channel: VoiceChannel,
  member: GuildMember
): Promise<void> {
  const newName = interaction.options.getString('name', true);
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

  const sanitized = sanitizeChannelName(newName);
  if (sanitized.length === 0 || sanitized === 'voice-channel') {
    await interaction.reply({
      content: 'Invalid channel name. Please use a different name.',
      ephemeral: true
    });
    return;
  }

  try {
    await manager.renameChannel(channel, sanitized);
    await interaction.reply({
      content: `Channel renamed to: **${sanitized}**`,
      ephemeral: true
    });
  } catch (err) {
    await interaction.reply({
      content: `Failed to rename channel: ${(err as Error).message}`,
      ephemeral: true
    });
  }
}