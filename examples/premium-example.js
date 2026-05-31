/**
 * Example: Premium tier configuration with role-based overrides
 * 
 * Run: node examples/premium-example.js
 * 
 * This example shows how to set up different premium roles
 * that grant higher bitrates, bypass cooldowns, and custom name templates.
 */

const { Client, GatewayIntentBits } = require('discord.js');
const { DynamicVoiceManager } = require('../dist/index');

const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';
const CREATOR_CHANNEL_ID = '123456789012345678';

// Premium tier configuration
// Users with these roles get enhanced features
const premiumTiers = [
  {
    roleId: '111111111111111111', // VIP role ID
    defaultBitrate: 128000,       // 128 kbps
    defaultUserLimit: 10,
    bypassCooldown: true,
    nameTemplate: '? {username}\'s VIP Room'
  },
  {
    roleId: '222222222222222222', // Partner role ID
    defaultBitrate: 384000,       // 384 kbps
    defaultUserLimit: 25,
    bypassCooldown: true,
    nameTemplate: '?? {username}\'s Kingdom'
  }
];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const voiceManager = new DynamicVoiceManager(client, {
  creatorChannelId: CREATOR_CHANNEL_ID,
  defaultName: '{username}\'s space',
  defaultBitrate: 64000,
  autoDeleteWhenEmpty: true,
  premiumTiers: premiumTiers
});

voiceManager.on('channelCreated', (channel, creator) => {
  // Check which premium tier the creator has (if any)
  const member = channel.guild.members.cache.get(creator.id);
  if (member) {
    const tier = voiceManager.getPremiumTierForMember(member);
    if (tier) {
      console.log(`${creator.tag} created a channel with premium tier: ${tier.nameTemplate ?? 'standard'}`);
    }
  }
});

client.on('ready', async () => {
  await voiceManager.init();
  console.log(`Bot logged in as ${client.user.tag}`);
  console.log('Premium tiers configured:');
  premiumTiers.forEach(tier => {
    console.log(`  - Role ID ${tier.roleId}: bitrate ${tier.defaultBitrate} bps`);
  });
});

client.login(BOT_TOKEN);