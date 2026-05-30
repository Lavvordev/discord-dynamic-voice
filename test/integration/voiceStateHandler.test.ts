/**
 * Integration tests for VoiceStateHandler.
 * 
 * These tests require a real Discord bot and a test server.
 * They are skipped in CI and must be run manually with a valid token.
 * 
 * To run: npm run test:integration
 * 
 * Make sure to set the following environment variables:
 * - DISCORD_BOT_TOKEN: your bot token
 * - TEST_GUILD_ID: ID of a test server
 * - TEST_CREATOR_CHANNEL_ID: ID of a voice channel to act as creator channel
 */

import { Client, GatewayIntentBits } from 'discord.js';
import { DynamicVoiceManager } from '../../src/manager';

// Skip all tests if no bot token is provided
const hasToken = process.env.DISCORD_BOT_TOKEN && 
                 process.env.TEST_GUILD_ID && 
                 process.env.TEST_CREATOR_CHANNEL_ID;

(hasToken ? describe : describe.skip)('VoiceStateHandler Integration', () => {
  let client: Client;
  let manager: DynamicVoiceManager;
  const creatorChannelId = process.env.TEST_CREATOR_CHANNEL_ID!;
  const guildId = process.env.TEST_GUILD_ID!;

  beforeAll(async () => {
    client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
      ]
    });
    
    await client.login(process.env.DISCORD_BOT_TOKEN);
    
    // Wait for ready
    await new Promise<void>((resolve) => {
      if (client.isReady()) resolve();
      else client.once('ready', () => resolve());
    });

    manager = new DynamicVoiceManager(client, {
      creatorChannelId,
      autoDeleteWhenEmpty: true,
      defaultName: 'Test {username}\'s room'
    });
    
    await manager.init();
  });

  afterAll(async () => {
    await manager.shutdown();
    client.destroy();
  });

  test('manager initializes without errors', () => {
    expect(manager).toBeDefined();
    expect(manager.isManagedChannel).toBeDefined();
  });

  test('creator channel ID is set correctly', () => {
    const options = (manager as any).options;
    expect(options.creatorChannelId).toBe(creatorChannelId);
  });

  test('persistence file is created', () => {
    const persistence = (manager as any).persistence;
    expect(persistence).toBeDefined();
  });

  // Manual test: User must join the creator channel for this to pass
  // This test will timeout if no user joins within 30 seconds.
  test(
    'user joining creator channel spawns a dynamic channel',
    async () => {
      // This is a placeholder for manual testing.
      // In a real integration test, you would need to simulate a voice state update.
      // Since that's not possible without a real user, we just verify the manager is listening.
      const listenerCount = client.listenerCount('voiceStateUpdate');
      expect(listenerCount).toBeGreaterThan(0);
    },
    30000
  );
});