# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.8] - 2026-05-31

### Added
- Ghost mode (`/voice hide` / `/voice unhide`) - removes ViewChannel permission for @everyone
- User whitelist/blacklist (`/voice permit` / `/voice block`) - granular access control
- Knock gateway (`/voice knock`) - users can request entry to locked channels; emits `knockRequest` event
- Co-host delegation (`/voice cohost` / `/voice removecohost`) - grant moderation permissions
- Claim window (`/voice claim`) - 60-second ownership claim after owner leaves; emits `claimWindowOpened` and `channelClaimed` events
- User preference memory - saves channel name, limit, lock state per user ID
- Premium tier support - role-based bitrate, cooldown bypass, custom name templates via `premiumTiers` option
- Custom storage adapter interface - allows plugging MongoDB, PostgreSQL, Redis, etc.
- New methods: `hideChannel`, `unhideChannel`, `permitUser`, `blockUser`, `knockChannel`, `addCohost`, `removeCohost`, `claimChannel`, `setUserPreferences`, `getUserPreferences`, `getPremiumTierForMember`
- New event: `knockRequest`, `claimWindowOpened`, `channelClaimed`

### Changed
- Persistence layer now supports user preferences and custom adapters
- Voice state handler opens claim window when owner leaves without transfer
- Channel creation respects saved user preferences and premium tier overrides

## [1.0.7] - 2026-05-30

### Fixed
- ASCII-only README to remove broken characters on npm
- Package metadata and keywords for better search ranking

## [1.0.0] - 2026-05-30

### Added
- Initial release
- `DynamicVoiceManager` class with full lifecycle management
- Local JSON persistence for channel-owner mapping
- Rate-limit safe request queue
- Voice state handler for join/leave events
- Permission cloning from creator channel
- Owner handover when creator leaves
- Auto-deletion of empty channels (with optional delay)
- Spam prevention cooldowns
- Command handlers: rename, limit, lock, unlock
- TypeScript support with full type definitions
- Event emitter hooks: `channelCreated`, `channelEmpty`, `ownerSwapped`, `error`
- Unit tests (Jest)
- CI pipeline for Node.js 18, 20, 22