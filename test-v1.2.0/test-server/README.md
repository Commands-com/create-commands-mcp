# test-server

MCP server created with api template

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

### Quick Start

1. **Create a new tool file** in `src/tools/`:

```typescript
// src/tools/myTool.ts
export const myTool = {
  name: "my_tool",
  description: "Does something useful - be specific for better AI usage",
  inputSchema: {
    type: "object",
    properties: {
      input: { 
        type: "string", 
        description: "Clear description helps AI understand when to use this tool" 
      }
    },
    required: ["input"]
  },
  handler: async (args: { input: string }) => {
    // Your tool logic here
    return { 
      success: true,
      result: `Processed: ${args.input}`,
      // Return structured data when possible
    };
  }
};
```

2. **Export from** `src/tools/index.ts`:

```typescript
export { myTool } from './myTool';
```

3. **Test your tool**:
```bash
npm run dev  # Start server
npm run doctor  # Verify tool registration
```

### Tool Design Best Practices

- 📝 **Clear descriptions** - AI needs to understand when to use your tool
- 🔧 **Specific input schemas** - Define exactly what parameters you need
- ✅ **Error handling** - Return meaningful error messages
- 📊 **Structured output** - Consistent response format helps AI usage
- 🚀 **Performance** - Keep tools fast (< 30s timeout recommended)

### Documentation & Examples

- 📖 **[MCP Tool Guidelines](https://commands.com/docs/mcp/tools/)** - Comprehensive tool development guide
- 🎯 **[Tool Design Patterns](https://commands.com/docs/mcp/patterns/)** - Common patterns and examples
- 🔍 **[Schema Reference](https://commands.com/docs/mcp/schemas/)** - Input/output schema documentation
- 💡 **[Community Examples](https://commands.com/examples/)** - Real-world tool implementations

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

1. Deploy your server to any hosting platform (Railway, Vercel, AWS, etc.)
2. Register at [Commands.com Creator Portal](https://commands.com/creator/mcp-servers/new)
3. Configure your server's proxy URL in the Commands.com UI
4. Commands.com gateway routes user requests to your self-hosted server
5. You handle all server hosting and scaling

```bash
# Verify configuration
npm run doctor
```

## Deployment

### Railway (Recommended for Testing)

**Quick Deploy in 2 minutes:**

1. **Push to GitHub:**
   ```bash
   git init && git add . && git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/test-server.git
   git push -u origin main
   ```

2. **Connect to Railway:**
   - Visit [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Railway auto-detects and deploys instantly

3. **Get live URL:**
   - Your server: `https://test-server-production.up.railway.app`
   - Test health: `curl https://test-server-production.up.railway.app/health`

**Environment variables** (optional):
- Set in Railway dashboard if needed
- Server works out-of-the-box with defaults

### Vercel

1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy serverless functions

### Docker

```bash
# Build image
docker build -t test-server .

# Run container
docker run -p 3000:3000 --env-file .env test-server
```

## Commands.com Marketplace

### Why Commands.com?

Commands.com provides a complete business platform for just **15% revenue share**:

- 🎯 **Marketing & Discovery** - Marketplace promotion and user acquisition
- 💳 **Stripe Billing** - Payment processing and subscription management  
- 🔐 **OAuth & Auth** - User management and secure access
- 📊 **Analytics** - Usage tracking and performance insights
- 🌐 **Gateway Routing** - Routes users to your self-hosted server

**You keep 85% of revenue** while hosting your own infrastructure.

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