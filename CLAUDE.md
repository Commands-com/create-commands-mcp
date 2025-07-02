# Create Commands MCP - Claude Documentation

## Overview

`create-commands-mcp` is a scaffolding tool for creating MCP (Model Context Protocol) servers that integrate with Commands.com. It generates production-ready templates with JWT authentication, OAuth scopes, and JSON-RPC 2.0 protocol support.

## Current Version

**v1.2.3** - Latest release with full Commands.com gateway compatibility

## Key Features

- **Express.js Framework**: Modern web framework for MCP server implementation
- **JSON-RPC 2.0 Protocol**: Full compliance with MCP specification
- **JWT Authentication**: Secure token verification using jwks-rsa
- **OAuth Scopes**: Support for `read_assets` and `write_assets` permissions
- **Dual Protocol Support**: Both JSON-RPC and REST endpoints
- **Railway Deployment**: One-click deployment configuration
- **TypeScript Support**: Full type safety and modern ES modules

## Template Architecture

The generated template follows the same architecture as `commands-com-mcp-demo`:

### Core Components

1. **Express.js Server** (`src/index.ts`):
   - JSON-RPC 2.0 endpoint at `/`
   - MCP discovery at `/.well-known/mcp.json`
   - Health check at `/health`
   - REST endpoints for tools

2. **JWT Authentication** (`src/auth/verifyToken.ts`):
   - Uses `jwks-rsa` for key management
   - Verifies tokens from `https://api.commands.com`
   - Supports Commands.com OAuth flow

3. **Tools Implementation** (`src/tools/`):
   - Ping tool for connectivity testing
   - Echo tool for message handling
   - Datetime tool for server time

## Usage

### Create New Project

```bash
# Interactive mode
npx create-commands-mcp

# Direct mode
npx create-commands-mcp my-mcp-server

# With options
npx create-commands-mcp my-server --template basic --deploy railway
```

### Templates Available

- **basic**: Simple server with ping, echo, and datetime tools
- **api**: Server with external API tools and offline fallbacks  
- **data**: Server with file processing and data transformation tools

### Development Workflow

```bash
cd my-mcp-server
npm install
cp .env.example .env
npm run dev
```

### Testing

```bash
# Run health checks
npm run doctor

# Run tests
npm test

# Build for production
npm run build
```

### Deployment

The template includes Railway deployment configuration:
- `railway.toml` for service configuration
- Automatic builds from git repositories
- Environment variable management

## Environment Variables

### Required
- `COMMANDS_JWT_ISSUER`: Must be `https://api.commands.com`
- `COMMANDS_JWT_AUDIENCE`: Your server identifier

### Optional
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode
- `COMMANDS_API_URL`: API base URL (default: https://api.commands.com)

## OAuth Scopes

The template supports Commands.com OAuth scopes:
- `read_assets`: Read user's MCP servers, prompts, and commands
- `write_assets`: Update user's asset documentation

## Commands.com Integration

### How It Works

1. **User Authorization**: Users authenticate via Commands.com OAuth
2. **JWT Pass-through**: Commands.com gateway forwards JWT tokens
3. **Scope Validation**: Server validates required permissions
4. **Tool Execution**: Authenticated users can call MCP tools

### Payment Integration

Commands.com handles all payment processing:
- Subscription validation at the gateway level
- No Stripe integration needed in your server
- Automatic user access control

## Common Commands

### Linting and Type Checking
```bash
npm run lint        # ESLint code checking
npm run typecheck   # TypeScript type validation
```

### Health Checks
```bash
npm run doctor      # Comprehensive server health check
```

### Testing
```bash
npm test           # Run all tests
npm run test:watch # Watch mode for development
```

## Recent Changes (v1.2.3)

- ✅ Fixed CLI version reading from package.json dynamically
- ✅ Removed unused `--no-telemetry` flag
- ✅ Updated to Express.js framework (from Node.js HTTP)
- ✅ Implemented JSON-RPC 2.0 protocol support
- ✅ Switched to jwks-rsa for JWT authentication
- ✅ Added MCP discovery endpoints
- ✅ Fixed ESM compatibility issues
- ✅ Resolved Railway deployment errors
- ✅ Updated dependency versions (security fixes)

## Troubleshooting

### Common Issues

1. **ESM Import Errors**: Ensure `"type": "module"` in package.json
2. **JWT Verification Fails**: Check COMMANDS_JWT_ISSUER matches `https://api.commands.com`
3. **Port Already in Use**: Run `npm run doctor` to check port availability
4. **Railway Deployment**: Ensure all environment variables are set

### Health Check Script

The `npm run doctor` command validates:
- Environment variables
- Port availability  
- Configuration files
- JWT configuration
- Commands.com connectivity
- Dependencies

## Architecture Compatibility

This template is 100% compatible with Commands.com's MCP gateway and follows the same patterns as the official `commands-com-mcp-demo` repository.

## Support

- **Issues**: https://github.com/commands-com/create-commands-mcp/issues
- **Demo Repository**: https://github.com/commands-com/commands-com-mcp-demo
- **Commands.com**: https://commands.com