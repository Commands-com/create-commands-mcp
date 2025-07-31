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

# Test via REST endpoint
curl -X POST http://localhost:3000/mcp/tools/my_tool \
  -H "Content-Type: application/json" \
  -d '{"params": {"input": "test value"}}'

# Test via JSON-RPC endpoint
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "my_tool",
      "arguments": {"input": "test value"}
    },
    "id": 1
  }'
```

### Tool Design Best Practices

- 📝 **Clear descriptions** - AI needs to understand when to use your tool
- 🔧 **Specific input schemas** - Define exactly what parameters you need
- ✅ **Error handling** - Return meaningful error messages
- 📊 **Structured output** - Consistent response format helps AI usage
- 🚀 **Performance** - Keep tools fast (< 30s timeout recommended)
- ⏱️ **Long Operations** - Use SSE for operations > 5 seconds (see example below)

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
   git remote add origin https://github.com/yourusername/{{name}}.git
   git push -u origin main
   ```

2. **Connect to Railway:**
   - Visit [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Railway auto-detects and deploys instantly

3. **Get live URL:**
   - Your server: `https://{{name}}-production.up.railway.app`
   - Test health: `curl https://{{name}}-production.up.railway.app/health`

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
docker build -t {{name}} .

# Run container
docker run -p 3000:3000 --env-file .env {{name}}
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

## Handling Long Operations (SSE)

For operations that take **more than 5 seconds**, use Server-Sent Events to prevent gateway timeouts:

```javascript
// In your tools/call handler:
case 'long_operation':
  const { steps = 5, delay_ms = 1000 } = toolArgs || {};

  if (acceptsSSE && method === 'tools/call') {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Process asynchronously with updates
    (async () => {
      const messages: string[] = [];

      for (let i = 1; i <= steps; i++) {
        // Do actual work here
        await doWork(i);
        
        // Build cumulative response
        messages.push(`Step ${i}/${steps} complete`);

        // Send update
        const response = {
          jsonrpc: '2.0',
          result: {
            content: [{
              type: 'text',
              text: messages.join('\n')
            }]
          },
          id
        };
        res.write(`data: ${JSON.stringify(response)}\n\n`);
      }
      res.end();
    })();
    return; // Early return
  }
  
  // Non-SSE fallback
  return standardResponse();
```

### Key Points:
- ✅ Send updates every 1-5 seconds
- ✅ Each update contains complete response (cumulative)
- ✅ Always provide non-SSE fallback
- ✅ Call `res.end()` when complete

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
- 💬 [Discord Community](https://discord.com/invite/snk8BEHfRd)
- 🐛 [Report Issues](https://github.com/commands-com/create-commands-mcp/issues)

## License

MIT