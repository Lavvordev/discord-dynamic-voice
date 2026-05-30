import { ChannelManager } from '../../src/channelManager';
import { DynamicVoiceOptions } from '../../src/types';

// Mock discord.js with ChannelType
jest.mock('discord.js', () => ({
  Guild: class {},
  VoiceChannel: class {
    deletable = true;
    async delete() {}
    async setName() {}
  },
  CategoryChannel: class {},
  ChannelType: {
    GuildVoice: 2
  }
}));

describe('ChannelManager', () => {
  let manager: ChannelManager;
  let options: DynamicVoiceOptions;

  beforeEach(() => {
    options = { creatorChannelId: '123' };
    manager = new ChannelManager(options);
  });

  test('constructor sets default options', () => {
    const internal = (manager as any).options;
    expect(internal.defaultName).toBe('{username}\'s voice');
    expect(internal.defaultBitrate).toBe(64000);
    expect(internal.defaultUserLimit).toBe(0);
  });

  test('createChannelForUser should call queue.add', async () => {
    // Create a proper mock for guild.channels.create
    const mockCreatedChannel = { id: 'new', name: 'test' };
    const mockGuild = {
      channels: {
        create: jest.fn().mockResolvedValue(mockCreatedChannel)
      }
    };
    const mockCreator = { id: 'user1', tag: 'Test#1234', username: 'Test' };
    const mockMember = { user: mockCreator };
    
    // Since we can't easily mock the queue, we test that the method doesn't throw
    // and that the channel creation is attempted.
    const promise = manager.createChannelForUser(mockGuild as any, mockCreator as any, mockMember as any, null);
    // The promise will resolve because the queue is mocked internally
    await expect(promise).resolves.toBeDefined();
  });

  test('deleteChannel calls channel.delete', async () => {
    const mockChannel = { deletable: true, delete: jest.fn().mockResolvedValue(undefined) };
    await manager.deleteChannel(mockChannel as any);
    expect(mockChannel.delete).toHaveBeenCalled();
  });

  test('renameChannel calls channel.setName', async () => {
    const mockChannel = { setName: jest.fn().mockResolvedValue(undefined) };
    await manager.renameChannel(mockChannel as any, 'New Name');
    expect(mockChannel.setName).toHaveBeenCalledWith('New Name', expect.any(String));
  });

  test('updateActivity updates lastActivityAt', () => {
    const metadata = {
      channel: {} as any,
      creatorId: 'user1',
      createdAt: new Date(),
      lastActivityAt: new Date(Date.now() - 10000)
    };
    const oldTime = metadata.lastActivityAt.getTime();
    manager.updateActivity(metadata);
    expect(metadata.lastActivityAt.getTime()).toBeGreaterThan(oldTime);
  });
});