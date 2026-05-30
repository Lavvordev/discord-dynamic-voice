# Contributing to discord-dynamic-voice

Thank you for your interest. This document outlines the process for reporting issues, suggesting features, and submitting code changes.

## Code of Conduct

By participating, you agree to maintain a respectful and constructive environment.

## Reporting Issues

Before creating a bug report:

1. Check existing issues to avoid duplicates.
2. Update to the latest version (`npm install discord-dynamic-voice@latest`).
3. Provide a minimal reproduction – include your discord.js version, manager configuration, and steps to reproduce.

## Feature Requests

Open a GitHub issue with the label `enhancement`. Describe the use case and proposed API design.

## Development Setup

```bash
git clone https://github.com/Lavvordev/discord-dynamic-voice.git
cd discord-dynamic-voice
npm install
npm run build
npm test
Pull Request Process
Fork the repository and create a branch from main.

Write tests for any new functionality.

Ensure all tests pass and coverage does not decrease.

Run npm run lint and npm run format.

Update README.md if API changes.

Update CHANGELOG.md with your changes.

Open a pull request against the main branch.

Commit Convention
Use Conventional Commits:

feat: new feature

fix: bug fix

docs: documentation only

test: adding missing tests

chore: maintenance tasks

Example: feat: add support for custom parent category

Testing Guidelines
Unit tests go in test/unit/

Integration tests go in test/integration/ (requires a real Discord bot token – not run in CI)

All tests must pass before merging

Release Process
Maintainers handle releases. Version bumps follow semver:

Patch: bug fixes (1.0.x)

Minor: new features (1.x.0)

Major: breaking changes (x.0.0)

Questions
Open a discussion on GitHub.