/**
 * Basic usage example for discord-dynamic-voice
 * 
 * Run: node examples/basic-usage.js
 * 
 * Make sure you have a Discord bot token and have set the correct
 * creatorChannelId in the options.
 */

const { Client, GatewayIntentBits } = require('discord.js');
const { DynamicVoiceManager } = require('../dist/index');

// Replace with your actual bot token
const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';
// Replace with your creator (lobby) voice channel ID
const CREATOR_CHANNEL_ID = '123456789012345678';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const voiceManager = new DynamicVoiceManager(client, {
  creatorChannelId: CREATOR_CHANNEL_ID,
  defaultName: '{username}\'s room',
  defaultBitrate: 64000,
  autoDeleteWhenEmpty: true,
  emptyDeleteDelayMs: 5000,
  creationCooldownMs: 3000
});

// Event listeners
voiceManager.on('channelCreated', (channel, creator) => {
  console.log(`[Event] Channel created: ${channel.name} by ${creator.tag}`);
});

voiceManager.on('channelEmpty', (channel) => {
  console.log(`[Event] Channel empty: ${channel.name} – will be deleted`);
});

voiceManager.on('ownerSwapped', (channel, newOwner) => {
  console.log(`[Event] Ownership transferred: ${channel.name} -> ${newOwner.tag}`);
});

voiceManager.on('error', (error) => {
  console.error('[Event] Error:', error);
});

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await voiceManager.init();
  console.log('Dynamic voice manager initialized');
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  const { commandName, member, guild } = interaction;
  const voiceChannel = member.voice.channel;
  
  if (!voiceChannel || !voiceManager.isManagedChannel(voiceChannel.id)) {
    await interaction.reply({
      content: 'You must be in a dynamic voice channel to use this command.',
      ephemeral: true
    });
    return;
  }
  
  // Example command handling (you need to register these commands separately)
  switch (commandName) {
    case 'rename': {
      const newName = interaction.options.getString('name');
      await voiceManager.renameChannel(voiceChannel, newName);
      await interaction.reply({ content: `Channel renamed to ${newName}`, ephemeral: true });
      break;
    }
    case 'limit': {
      const limit = interaction.options.getInteger('limit');
      await voiceManager.setUserLimit(voiceChannel, limit);
      await interaction.reply({ content: `User limit set to ${limit}`, ephemeral: true });
      break;
    }
    case 'lock': {
      await voiceManager.lockChannel(voiceChannel);
      await interaction.reply({ content: 'Channel locked', ephemeral: true });
      break;
    }
    case 'unlock': {
      await voiceManager.unlockChannel(voiceChannel);
      await interaction.reply({ content: 'Channel unlocked', ephemeral: true });
      break;
    }
    default:
      await interaction.reply({ content: 'Unknown command', ephemeral: true });
  }
});

client.login(BOT_TOKEN).catch(console.error);