import { VoiceChannel, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { DynamicVoiceManager } from '../manager';

export async function handleKnock(
  manager: DynamicVoiceManager,
  interaction: ChatInputCommandInteraction,
  channel: VoiceChannel,
  member: GuildMember
): Promise<void> {
  const ownerId = await manager.getOwner(channel.id);
  if (!ownerId) {
    await interaction.reply({
      content: 'This channel has no owner.',
      ephemeral: true
    });
    return;
  }

  const owner = interaction.guild?.members.cache.get(ownerId);
  if (!owner) {
    await interaction.reply({
      content: 'Channel owner not found.',
      ephemeral: true
    });
    return;
  }

  try {
    await manager.knockChannel(channel, member, owner.user);
    await interaction.reply({
      content: `Knock request sent to ${owner.displayName}. They will be notified.`,
      ephemeral: true
    });
  } catch (err) {
    await interaction.reply({
      content: `Failed to send knock: ${(err as Error).message}`,
      ephemeral: true
    });
  }
}