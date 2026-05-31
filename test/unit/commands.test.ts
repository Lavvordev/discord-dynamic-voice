import { handleHide, handleUnhide } from '../../src/commands/hide';
import { handlePermit, handleBlock } from '../../src/commands/permit';

// Mock Discord.js classes
jest.mock('discord.js', () => ({
  ChatInputCommandInteraction: class {
    options = {
      getUser: jest.fn().mockReturnValue({ id: '123', tag: 'TestUser' })
    };
    reply = jest.fn();
    guild = { members: { cache: new Map() } };
  },
  GuildMember: class {
    id = 'member1';
    permissions = { has: jest.fn() };
  },
  VoiceChannel: class {}
}));

describe('Command Handlers', () => {
  let mockManager: any;
  let mockInteraction: any;
  let mockChannel: any;
  let mockMember: any;

  beforeEach(() => {
    mockManager = {
      getOwner: jest.fn().mockReturnValue('member1'),
      getCohosts: jest.fn().mockReturnValue([]),
      hideChannel: jest.fn().mockResolvedValue(undefined),
      unhideChannel: jest.fn().mockResolvedValue(undefined),
      permitUser: jest.fn().mockResolvedValue(undefined),
      blockUser: jest.fn().mockResolvedValue(undefined)
    };
    mockInteraction = {
      options: { getUser: jest.fn().mockReturnValue({ id: '456', tag: 'TargetUser' }) },
      reply: jest.fn(),
      guild: { members: { cache: new Map() } }
    };
    mockChannel = { id: 'chan1' };
    mockMember = { id: 'member1', permissions: { has: jest.fn().mockReturnValue(false) } };
  });

  test('handleHide allows owner to hide channel', async () => {
    await handleHide(mockManager, mockInteraction, mockChannel, mockMember);
    expect(mockManager.hideChannel).toHaveBeenCalledWith(mockChannel);
    expect(mockInteraction.reply).toHaveBeenCalled();
  });

  test('handleUnhide allows owner to unhide channel', async () => {
    await handleUnhide(mockManager, mockInteraction, mockChannel, mockMember);
    expect(mockManager.unhideChannel).toHaveBeenCalledWith(mockChannel);
  });

  test('handlePermit calls permitUser', async () => {
    await handlePermit(mockManager, mockInteraction, mockChannel, mockMember);
    expect(mockManager.permitUser).toHaveBeenCalledWith(mockChannel, '456');
  });

  test('handleBlock calls blockUser', async () => {
    await handleBlock(mockManager, mockInteraction, mockChannel, mockMember);
    expect(mockManager.blockUser).toHaveBeenCalledWith(mockChannel, '456');
  });
});