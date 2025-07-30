# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.5.1] - 2025-07-30

### Fixed
- Reverted universal context parameter requirement from v1.5.0
- Tool handlers now only receive context when needed (usage, async tools)
- Organization is now embedded in code during project creation instead of environment variable
- SKIP_AUTH defaults to true for easier local development

### Changed
- Replaced `set-org` command with organization prompt during project creation
- Organization configuration moved from .env to src/config.ts for automatic deployment

### Removed
- Removed COMMANDS_ORG environment variable requirement

## [1.0.10] - 2025-07-02

### Changed
- Updated template README with real documentation URLs

## [1.0.9] - 2025-07-02

### Added
- Clarified Commands.com v1 architecture documentation

## [1.0.8] - 2025-07-02

### Added
- Initial release with basic MCP server scaffolding
- Support for basic, API, and data processing templates
- TypeScript and JavaScript language options
- Railway, Vercel, and Docker deployment configurations
- Interactive and direct CLI modes