import { PermissionManager } from '../../src/permissionManager';
import { VoiceChannel, GuildMember, PermissionFlagsBits } from 'discord.js';

// Mock discord.js classes
jest.mock('discord.js', () => ({
  VoiceChannel: class {
    permissionOverwrites = {
      cache: [],
      edit: jest.fn().mockResolvedValue(undefined)
    };
    guild = { roles: { everyone: { id: 'everyone' } } };
    members = new Map();
  },
  GuildMember: class {
    id = 'member1';
  },
  PermissionFlagsBits: { ManageChannels: 1 << 3 }
}));

describe('PermissionManager', () => {
  test('lockChannel edits @everyone connect permission', async () => {
    const mockChannel = new (require('discord.js').VoiceChannel)();
    await PermissionManager.lockChannel(mockChannel);
    expect(mockChannel.permissionOverwrites.edit).toHaveBeenCalledWith(
      { id: 'everyone' },
      { Connect: false }
    );
  });

  test('unlockChannel resets @everyone connect permission', async () => {
    const mockChannel = new (require('discord.js').VoiceChannel)();
    await PermissionManager.unlockChannel(mockChannel);
    expect(mockChannel.permissionOverwrites.edit).toHaveBeenCalledWith(
      { id: 'everyone' },
      { Connect: null }
    );
  });

  test('setUserLimit calls channel.setUserLimit', async () => {
    const mockChannel = { setUserLimit: jest.fn().mockResolvedValue(undefined) };
    await PermissionManager.setUserLimit(mockChannel as any, 10);
    expect(mockChannel.setUserLimit).toHaveBeenCalledWith(10);
  });
});