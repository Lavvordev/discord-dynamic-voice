import { VoiceChannel, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { DynamicVoiceManager } from '../manager';
import { validateUserLimit } from '../utils';

export async function handleLimit(
  manager: DynamicVoiceManager,
  interaction: ChatInputCommandInteraction,
  channel: VoiceChannel,
  member: GuildMember
): Promise<void> {
  const limitInput = interaction.options.getInteger('limit', true);
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