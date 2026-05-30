import { VoiceChannel, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { DynamicVoiceManager } from '../manager';

/**
 * Handle the /lock command.
 * Prevents @everyone from connecting to the channel.
 */
export async function handleLock(
  manager: DynamicVoiceManager,
  interaction: ChatInputCommandInteraction,
  channel: VoiceChannel,
  member: GuildMember
): Promise<void> {
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
  
  try {
    await manager.lockChannel(channel);
    await interaction.reply({
      content: 'Channel locked. Others cannot join.',
      ephemeral: true
    });
  } catch (err) {
    await interaction.reply({
      content: `Failed to lock channel: ${(err as Error).message}`,
      ephemeral: true
    });
  }
}