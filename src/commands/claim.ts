import { VoiceChannel, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { DynamicVoiceManager } from '../manager';

export async function handleClaim(
  manager: DynamicVoiceManager,
  interaction: ChatInputCommandInteraction,
  channel: VoiceChannel,
  member: GuildMember
): Promise<void> {
  try {
    const claimed = await manager.claimChannel(channel, member);
    if (claimed) {
      await interaction.reply({
        content: 'You have claimed ownership of this channel.',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: 'This channel cannot be claimed right now.',
        ephemeral: true
      });
    }
  } catch (err) {
    await interaction.reply({
      content: `Failed to claim channel: ${(err as Error).message}`,
      ephemeral: true
    });
  }
}