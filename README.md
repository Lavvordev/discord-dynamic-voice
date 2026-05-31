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
- Ghost mode (hide/unhide) - channel disappears from sidebar for non-members
- User whitelist/blacklist - granular access control per user
- Knock gateway - users can request entry to locked channels
- Co-host delegation - grant moderation permissions to trusted users
- Claim window - 60-second ownership claim after owner leaves
- User preference memory - remembers channel names and limits per user
- Premium tier support - role-based bitrate, cooldown bypass, custom name templates
- Custom storage adapter - plug in MongoDB, PostgreSQL, or Redis

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

const voiceManager = new DynamicVoiceManager(client, {
  creatorChannelId: '123456789012345678',
  defaultName: "{username}'s space",
  autoDeleteWhenEmpty: true
});

voiceManager.on('channelCreated', (channel, creator) => {
  console.log(`Created dynamic channel for ${creator.tag}`);
});

client.on('ready', async () => {
  await voiceManager.init();
  console.log(`Bot ready`);
});

client.login('YOUR_TOKEN');
```

## Slash Commands Integration

Register slash commands (rename, limit, lock, unlock, hide, permit, block, knock, cohost, claim) using your command handler.

```javascript
const { 
  handleRename, handleLimit, handleLock, handleUnlock,
  handleHide, handleUnhide, handlePermit, handleBlock,
  handleKnock, handleAddCohost, handleRemoveCohost, handleClaim
} = require('discord-dynamic-voice');

// Inside your interaction handler
if (commandName === 'rename') {
  const channel = interaction.member.voice.channel;
  if (!channel || !voiceManager.isManagedChannel(channel.id)) {
    return interaction.reply({ content: 'Not in a dynamic channel.', ephemeral: true });
  }
  await handleRename(voiceManager, interaction, channel, interaction.member);
}
```

## API Reference

### `new DynamicVoiceManager(client, options)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `creatorChannelId` | string | required | ID of the lobby channel |
| `defaultName` | string | `"{username}'s voice"` | Name template |
| `defaultBitrate` | number | `64000` | Bitrate in kbps |
| `defaultUserLimit` | number | `0` | Max users (0 = unlimited) |
| `autoDeleteWhenEmpty` | boolean | `true` | Delete when empty |
| `emptyDeleteDelayMs` | number | `0` | Delay before deletion |
| `creationCooldownMs` | number | `5000` | Cooldown per user (ms) |
| `requestQueueDelayMs` | number | `1000` | Delay between API requests |
| `persistenceFilePath` | string | `'./dynamic-voice-state.json'` | JSON file path |
| `storageAdapter` | `StorageAdapter` | `null` | Custom database adapter |
| `premiumTiers` | `PremiumTier[]` | `[]` | Role-based premium config |

### Methods

| Method | Description |
|--------|-------------|
| `init()` | Loads persistence, cleans orphans, attaches listeners |
| `lockChannel(channel)` | Prevents @everyone from connecting |
| `unlockChannel(channel)` | Restores @everyone connection |
| `hideChannel(channel)` | Removes ViewChannel permission for @everyone |
| `unhideChannel(channel)` | Restores ViewChannel permission |
| `permitUser(channel, userId)` | Allows a specific user to join |
| `blockUser(channel, userId)` | Blocks a user and disconnects them |
| `knockChannel(channel, knocker, owner)` | Sends a knock request to owner |
| `addCohost(channel, userId)` | Adds a co-host with moderation powers |
| `removeCohost(channel, userId)` | Removes a co-host |
| `claimChannel(channel, member)` | Attempts to claim ownership (60s window) |
| `setUserPreferences(userId, prefs)` | Saves user preferences |
| `getUserPreferences(userId)` | Returns saved preferences |
| `getPremiumTierForMember(member)` | Returns matching premium tier |
| `setUserLimit(channel, limit)` | Sets max user capacity (0-99) |
| `renameChannel(channel, name)` | Renames the channel |
| `getOwner(channelId)` | Returns owner's user ID or null |
| `isManagedChannel(channelId)` | Checks if channel is managed |
| `shutdown()` | Flushes persistence, cleans up |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `channelCreated` | `(channel, creator)` | New dynamic channel created |
| `channelEmpty` | `(channel)` | Channel becomes empty (before deletion) |
| `ownerSwapped` | `(channel, newOwner)` | Ownership transferred |
| `error` | `(error)` | Internal error |
| `knockRequest` | `(channel, knocker, owner)` | Knock received (handle with buttons) |
| `claimWindowOpened` | `(channel, remainingMembers)` | Owner left, claim window starts |
| `channelClaimed` | `(channel, newOwner)` | Channel claimed via /claim |

## Examples

See the `examples/` folder for:
- `basic-usage.js` – minimal setup
- `premium-example.js` – role-based premium tiers
- `storage-adapter.js` – MongoDB adapter example

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT (c) lavvordev