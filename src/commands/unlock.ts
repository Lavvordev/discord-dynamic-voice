import { VoiceChannel, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { DynamicVoiceManager } from '../manager';

export async function handleUnlock(
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