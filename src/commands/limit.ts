import { VoiceChannel, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { DynamicVoiceManager } from '../manager';
import { validateUserLimit } from '../utils';

/**
 * Handle the /limit command.
 * Sets the maximum number of users who can join the dynamic channel.
 */
export async function handleLimit(
  manager: DynamicVoiceManager,
  interaction: ChatInputCommandInteraction,
  channel: VoiceChannel,
  member: GuildMember
): Promise<void> {
  const limitInput = interaction.options.getInteger('limit', true);
  
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
  
  const validLimit = validateUserLimit(limitInput);
  try {
    await manager.setUserLimit(channel, validLimit);
    const limitText = validLimit === 0 ? 'unlimited' : `${validLimit}`;
    await interaction.reply({
      content: `User limit set to **${limitText}**.`,
      ephemeral: true
    });
  } catch (err) {
    await interaction.reply({
      content: `Failed to set user limit: ${(err as Error).message}`,
      ephemeral: true
    });
  }
}