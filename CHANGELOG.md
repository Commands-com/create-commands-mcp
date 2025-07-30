# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.5.0] - 2025-07-30

### Added
- **Usage tracking tool** - Built-in `usage` tool for checking Commands.com gateway limits and consumption
- **Token accounting utilities** - Job-level token tracking for long-running operations
- **Gateway notification module** - Automatic usage reporting to Commands.com gateway
- **Context support in tools** - Tools now receive context with JWT and user information
- **Async operation example** - Complete example of job tracking with token accounting
- **`set-org` command** - Set Commands.com organization/username for usage tracking
- Security hardening: Path traversal protection and template injection prevention
- Concurrent filesystem operations for better performance
- Telemetry toggle option (`--no-telemetry`)
- npm audit script for security vulnerability checking
- Enhanced prepublishOnly script with template validation

### Changed
- Tool handler signature now supports optional context parameter
- All templates now include the usage tracking tool
- TypeScript compilation now outputs readable ES modules instead of minified code
- Pinned inquirer to v9.x to prevent breaking changes from v10

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