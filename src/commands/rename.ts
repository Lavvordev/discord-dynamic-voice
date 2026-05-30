import { VoiceChannel, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { DynamicVoiceManager } from '../manager';
import { sanitizeChannelName } from '../utils';

/**
 * Handle the /rename command.
 * Expects the interaction to have a string option 'name'.
 * 
 * This function checks if the user is the channel owner or has manage permissions.
 * I've seen this break when the channel is not a dynamic voice channel – we guard against that.
 */
export async function handleRename(
  manager: DynamicVoiceManager,
  interaction: ChatInputCommandInteraction,
  channel: VoiceChannel,
  member: GuildMember
): Promise<void> {
  const newName = interaction.options.getString('name', true);
  
  // Security check: only owner or guild admins can rename
  const ownerId = manager.getOwner(channel.id);
  const isOwner = ownerId === member.id;
  const hasAdmin = member.permissions.has('ManageChannels');
  
  if (!isOwner && !hasAdmin) {
    await interaction.reply({
      content: 'You are not the owner of this voice channel.',
      ephemeral: true
    });
    return;
  }
  
  // Sanitise the name to avoid Discord API errors
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