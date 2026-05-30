import { DynamicVoiceManager } from '../../src/manager';

// Proper mock for discord.js Client with constructor parameter
jest.mock('discord.js', () => ({
  Client: class {
    on = jest.fn();
    guilds = { cache: new Map() };
    constructor(_options?: any) {} // Accept options parameter
  },
  GatewayIntentBits: {
    Guilds: 1,
    GuildVoiceStates: 2
  },
  ChannelType: {
    GuildVoice: 2
  },
  VoiceChannel: class {}
}));

describe('DynamicVoiceManager', () => {
  let client: any;
  let manager: DynamicVoiceManager;

  beforeEach(() => {
    const { Client } = require('discord.js');
    client = new Client({ intents: [] }); // Now works with argument
    manager = new DynamicVoiceManager(client, { creatorChannelId: '123' });
  });

  test('constructor sets up persistence and handlers', () => {
    expect(manager).toBeInstanceOf(DynamicVoiceManager);
  });

  test('init attaches voiceStateUpdate listener', async () => {
    const onSpy = jest.spyOn(client, 'on');
    await manager.init();
    expect(onSpy).toHaveBeenCalledWith('voiceStateUpdate', expect.any(Function));
  });

  test('lockChannel calls PermissionManager', async () => {
    const mockChannel = { id: '456' };
    const { PermissionManager } = require('../../src/permissionManager');
    PermissionManager.lockChannel = jest.fn().mockResolvedValue(undefined);
    
    await manager.lockChannel(mockChannel as any);
    expect(PermissionManager.lockChannel).toHaveBeenCalledWith(mockChannel);
  });

  test('getOwner returns creatorId from persistence', () => {
    const persistence = (manager as any).persistence;
    persistence.set('chan1', { channelId: 'chan1', creatorId: 'userX', guildId: 'g', createdAt: 1, lastActivityAt: 1 });
    expect(manager.getOwner('chan1')).toBe('userX');
    expect(manager.getOwner('unknown')).toBeNull();
  });

  test('isManagedChannel returns true for persisted channel', () => {
    const persistence = (manager as any).persistence;
    persistence.set('chan2', { channelId: 'chan2', creatorId: 'userY', guildId: 'g', createdAt: 1, lastActivityAt: 1 });
    expect(manager.isManagedChannel('chan2')).toBe(true);
    expect(manager.isManagedChannel('fake')).toBe(false);
  });

  test('shutdown flushes persistence', () => {
    const flushSpy = jest.spyOn((manager as any).persistence, 'flush');
    manager.shutdown();
    expect(flushSpy).toHaveBeenCalled();
  });
});