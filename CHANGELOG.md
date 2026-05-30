# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.6] - 2025-05-30

### Fixed
- ASCII-only README to remove broken characters on npm

## [1.0.0] - 2025-05-30

### Added
- Initial release
- DynamicVoiceManager class with full lifecycle management
- Local JSON persistence for channel-owner mapping
- Rate-limit safe request queue
- Voice state handler for join/leave events
- Permission cloning from creator channel
- Owner handover when creator leaves
- Auto-deletion of empty channels (with optional delay)
- Spam prevention cooldowns
- Command handlers: rename, limit, lock, unlock
- TypeScript support with full type definitions
- Event emitter hooks: channelCreated, channelEmpty, ownerSwapped, error
- Unit tests (Jest)
- CI pipeline for Node.js 18, 20, 22
