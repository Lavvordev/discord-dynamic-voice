import { VoiceChannel, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { DynamicVoiceManager } from '../manager';

/**
 * Handle the /unlock command.
 * Restores @everyone's ability to connect.
 */
export async function handleUnlock(
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
    await manager.unlockChannel(channel);
    await interaction.reply({
      content: 'Channel unlocked. Others can now join.',
      ephemeral: true
    });
  } catch (err) {
    await interaction.reply({
      content: `Failed to unlock channel: ${(err as Error).message}`,
      ephemeral: true
    });
  }
}