# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.0.x   | Yes                |
| < 1.0   | No                 |

## Reporting a Vulnerability

If you discover a security vulnerability within `discord-dynamic-voice`, please follow these steps:

1. Do not open a public GitHub issue.
2. Send an email to **security@lavvorstudio.dev** with the subject line: `[discord-dynamic-voice] vulnerability report`.
3. Include as much detail as possible: reproduction steps, potential impact, and any suggested fixes.

You can expect an initial response within 48 hours. We will keep you informed as we investigate and resolve the issue.

## Security Considerations

- The package uses `discord.js` as a peer dependency. Keep `discord.js` updated to the latest version to receive security patches.
- The package writes a local JSON file (`dynamic-voice-state.json`) to store channel-owner mappings. Ensure the directory where this file is written has appropriate permissions.
- The package does not make any external network requests beyond Discord's WebSocket and REST API.
- Rate limiting is implemented to prevent abuse of Discord's API, but you should also set appropriate cooldowns in your bot's command handlers.

## Responsible Disclosure

We follow responsible disclosure practices. Once a fix is released, we will credit the reporter in the CHANGELOG (unless anonymity is requested).