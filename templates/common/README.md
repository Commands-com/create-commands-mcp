# {{name}}

{{description}}

Created with [create-commands-mcp](https://www.npmjs.com/package/create-commands-mcp)

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment (optional)
cp .env.example .env
# Customize settings if needed - works out of the box!

# Start development server
npm run dev

# Test your server
curl http://localhost:3000/health
```

## Available Tools

- **ping** - Test server connectivity
- **echo** - Echo back user input  
- **datetime** - Get current date/time in various formats

## Development

### Adding New Tools

1. Create a new file in `src/tools/`:

```typescript
// src/tools/myTool.ts
export const myTool = {
  name: "my_tool",
  description: "Does something useful",
  inputSchema: {
    type: "object",
    properties: {
      input: { type: "string", description: "User input" }
    },
    required: ["input"]
  },
  handler: async (args: { input: string }) => {
    return { result: `Processed: ${args.input}` };
  }
};
```

2. Export it from `src/tools/index.ts`:

```typescript
export { myTool } from './myTool';
```

3. The tool will be automatically available via the MCP protocol.

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Health check
npm run doctor
```

### Building

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## Commands.com Integration

### JWT Validation (Works Immediately)

Your server automatically validates Commands.com JWTs using public JWKS:

```bash
# No setup required - works out of the box
npm run dev

# Test with any Commands.com JWT token
curl -H "Authorization: Bearer JWT_TOKEN" http://localhost:3000/ping
```

### Gateway Integration (Optional)

To list your server on Commands.com and receive gateway traffic:

1. Deploy your server to any hosting platform
2. Register at [Commands.com Creator Portal](https://commands.com/creator/mcp-servers/new)
3. Submit your server URL for marketplace listing
4. Commands.com routes user requests to your server

```bash
# Update .env with your deployed URL (optional)
SERVER_URL=https://your-deployed-server.com

# Verify configuration
npm run doctor
```

## Deployment

### Railway (Recommended)

1. Connect your repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on git push

### Vercel

1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy serverless functions

### Docker

```bash
# Build image
docker build -t {{name}} .

# Run container
docker run -p 3000:3000 --env-file .env {{name}}
```

## Commands.com Marketplace

### Submit Your Server

1. Deploy your server to any hosting platform
2. Test your server: `npm run commands:validate`
3. Submit to marketplace: [Commands.com Creator Portal](https://commands.com/creator/mcp-servers/new)

### Marketplace Guidelines

- ✅ All tools must have clear descriptions
- ✅ Error handling for all edge cases
- ✅ Proper JWT authentication
- ✅ Health check endpoint working
- ✅ Rate limiting respected

## Architecture

```
src/
├── index.ts              # Main server entry point
├── tools/                # Tool implementations
│   ├── index.ts         # Tool exports
│   ├── ping.ts          # Connectivity test
│   ├── echo.ts          # Input/output test
│   └── datetime.ts      # System integration
├── auth/
│   └── verifyToken.ts   # JWT validation
├── types.ts             # TypeScript definitions
└── scripts/
    ├── doctor.ts        # Health checks
    └── validate-commands.ts
```

## Security

- ✅ JWT tokens validated against Commands.com JWKS
- ✅ Input validation on all tools
- ✅ No secrets logged or exposed
- ✅ CORS configured for Commands.com domains
- ✅ Rate limiting implemented

## Support

- 📖 [Documentation](https://commands.com/docs/mcp)
- 💬 [Discord Community](https://discord.gg/commands)
- 🐛 [Report Issues](https://github.com/commands-com/create-commands-mcp/issues)

## License

MIT