# discord-dynamic-voice

[![CI Status](https://github.com/Lavvordev/discord-dynamic-voice/actions/workflows/ci.yml/badge.svg)](https://github.com/Lavvordev/discord-dynamic-voice/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/discord-dynamic-voice.svg)](https://www.npmjs.com/package/discord-dynamic-voice)
[![npm downloads](https://img.shields.io/npm/dm/discord-dynamic-voice.svg)](https://www.npmjs.com/package/discord-dynamic-voice)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An ultra-lightweight, zero-dependency manager for creating and managing **temporary voice channels** in Discord.js v14 bots.

## Why discord-dynamic-voice?

Most Discord bot developers rewrite complex voice-state logic for every single project. Existing snippets break with every platform update and lack fault tolerance.

`discord-dynamic-voice` abstracts the entire lifecycle of **dynamic voice channels (Hub/Generator channels)**. It features built-in local JSON state persistence to completely prevent ghost or orphaned channels if your bot unexpectedly crashes or restarts.

## Features

- Full lifecycle automation - user join -> channel auto-generation -> user transfer -> auto-deletion
- Local state persistence - saves channel-to-owner mappings to recover after bot crashes
- Smart owner handover - automatically reassigns control to the next active user if the creator leaves
- Spam prevention cooldowns - built-in protection against channel creation abuse
- Rate-limit safe - request queue prevents Discord 429 errors
- Zero external APIs - operates entirely via Discord's WebSocket gateway
- TypeScript support - full type definitions included

## Installation

```bash
npm install discord-dynamic-voice
```

**Peer dependency:** discord.js v14 or higher

```bash
npm install discord.js@^14.0.0
```

## Quick Start

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const { DynamicVoiceManager } = require('discord-dynamic-voice');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildVoiceStates
  ] 
});

// Initialize the voice manager
const voiceManager = new DynamicVoiceManager(client, {
  creatorChannelId: '123456789012345678', // Replace with your "Join to Create" VC ID
  defaultName: "{username}'s space",
  defaultBitrate: 64000,
  autoDeleteWhenEmpty: true
});

// Event hooks
voiceManager.on('channelCreated', (channel, creator) => {
  console.log(`Created dynamic channel for ${creator.tag}`);
});

voiceManager.on('channelEmpty', (channel) => {
  console.log(`Channel ${channel.name} is empty - will be deleted`);
});

voiceManager.on('error', (error) => {
  console.error('Dynamic voice error:', error);
});

client.on('ready', async () => {
  await voiceManager.init();
  console.log(`Bot logged in as ${client.user.tag}`);
});

client.login('YOUR_BOT_TOKEN');
```

## Slash Commands Integration

Register slash commands (rename, limit, lock, unlock) using your command handler. Example for `/rename`:

```javascript
const { handleRename } = require('discord-dynamic-voice');

// Inside your interaction handler
if (commandName === 'rename') {
  const channel = interaction.member.voice.channel;
  if (!channel || !voiceManager.isManagedChannel(channel.id)) {
    return interaction.reply({ content: 'You are not in a dynamic voice channel.', ephemeral: true });
  }
  await handleRename(voiceManager, interaction, channel, interaction.member);
}
```

## API Reference

### `new DynamicVoiceManager(client, options)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `creatorChannelId` | string | required | ID of the lobby channel users join to spawn a VC |
| `defaultName` | string | `"{username}'s voice"` | Name template (supports `{username}`, `{displayname}`, `{id}`) |
| `defaultBitrate` | number | `64000` | Bitrate in kbps |
| `defaultUserLimit` | number | `0` | Max users (0 = unlimited) |
| `autoDeleteWhenEmpty` | boolean | `true` | Delete channel when everyone leaves |
| `emptyDeleteDelayMs` | number | `0` | Delay before deleting empty channel |
| `creationCooldownMs` | number | `5000` | Cooldown per user (ms) |
| `requestQueueDelayMs` | number | `1000` | Delay between Discord API requests |
| `persistenceFilePath` | string | `'./dynamic-voice-state.json'` | Path to JSON state file |

### Methods

| Method | Description |
|--------|-------------|
| `init()` | Loads persistence, cleans orphans, attaches listeners |
| `lockChannel(channel)` | Prevents @everyone from connecting |
| `unlockChannel(channel)` | Restores @everyone connection |
| `setUserLimit(channel, limit)` | Sets max user capacity (0-99) |
| `renameChannel(channel, name)` | Renames the channel |
| `getOwner(channelId)` | Returns owner's user ID or null |
| `isManagedChannel(channelId)` | Checks if channel is managed |
| `shutdown()` | Flushes persistence, cleans up |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `channelCreated` | `(channel, creator)` | Fired when a new dynamic channel is created |
| `channelEmpty` | `(channel)` | Fired when a channel becomes empty (before deletion) |
| `ownerSwapped` | `(channel, newOwner)` | Fired when ownership transfers to another member |
| `error` | `(error)` | Fired on any internal error |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT (c) lavvordev