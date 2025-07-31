# create-commands-mcp

🚀 **Scaffolding tool for creating MCP servers that connect to Commands.com**

Create production-ready MCP (Model Context Protocol) servers with Commands.com JWT authentication in minutes.

## Quick Start

```bash
# Create a new MCP server
npx create-commands-mcp my-server

# Navigate and start development
cd my-server
npm install
cp .env.example .env
npm run dev
```

## Features

- ✨ **Zero-config setup** - Working MCP server in under 5 minutes
- 🔐 **Commands.com JWT authentication** - Built-in gateway integration
- 🌊 **Server-Sent Events (SSE)** - Real-time streaming support for gateway compatibility
- 🛠️ **Multiple templates** - Basic, API integration, and data processing
- 📦 **Zero production dependencies** - Lightweight and secure
- 🔧 **Developer experience** - TypeScript, testing, and health checks
- 🚀 **Deployment ready** - Railway, Vercel, and Docker configs included
- 💰 **85% revenue share** - Commands.com handles marketing, billing, and auth for only 15%

## Usage

### Interactive Mode
```bash
npx create-commands-mcp
```

### Direct Mode
```bash
npx create-commands-mcp my-server-name
```

### With Options
```bash
# API template with Railway deployment config
npx create-commands-mcp my-server --template=api --deploy=railway

# Basic template with Docker setup
npx create-commands-mcp my-server --template=basic --deploy=docker
```

## Templates

### Basic Template (Default)
- **Tools**: ping, echo, datetime
- **Best for**: Learning MCP protocol, simple utilities
- **Zero external dependencies**

### API Template
- **Tools**: HTTP requests, data transformation, caching
- **Best for**: External API integration, data fetching
- **Includes offline fallbacks**

### Data Template  
- **Tools**: File processing, JSON/CSV parsing, validation
- **Best for**: Data transformation, file manipulation
- **Built-in data validation**

## Generated Project Structure

```
my-mcp-server/
├── src/
│   ├── index.ts              # Main server
│   ├── tools/                # Tool implementations
│   │   ├── ping.ts
│   │   ├── echo.ts
│   │   └── datetime.ts
│   ├── auth/
│   │   └── verifyToken.ts    # JWT validation
│   └── types.ts              # TypeScript definitions
├── tests/
│   └── ping.test.ts          # Basic tests
├── .env.example              # Environment template
├── commands.yaml             # Commands.com metadata
├── README.md                 # Getting started guide
└── package.json              # Minimal dependencies
```

## Commands.com Integration

### Instant JWT Validation
Your server works immediately with Commands.com JWTs:

```bash
npm run dev     # Start development server
npm run test    # Run tests
npm run doctor  # Health checks
```

### Gateway Integration (Optional)
For Commands.com marketplace and routing:

1. **Deploy**: Host your server anywhere (Railway/Vercel/AWS/etc.)
2. **Register**: Submit your server URL at [Commands.com Creator Portal](https://commands.com/creator/mcp-servers/new)
3. **Route**: Commands.com gateway routes user requests to your server

```bash
# Deploy to your preferred platform
npm run build && npm start  # or deploy to Railway/Vercel/etc.

# Register your live server URL at Commands.com
# Example: https://my-server.railway.app
```

## Quick Deploy to Railway

Test your MCP server in production in under 2 minutes:

```bash
# 1. Create with Railway config
npx create-commands-mcp my-server --deploy=railway

# 2. Initialize git and push to GitHub
cd my-server
git init && git add . && git commit -m "Initial MCP server"
git remote add origin https://github.com/yourusername/my-server.git
git push -u origin main

# 3. Deploy to Railway
# - Visit railway.app and connect your GitHub repo
# - Railway auto-detects Node.js and deploys instantly
# - Get live URL: https://my-server-production.up.railway.app
```

**Result:** Your MCP server is live and ready for Commands.com submission!

## Development Workflow

1. **Create**: `npx create-commands-mcp my-server`
2. **Develop**: Add tools in `src/tools/`
3. **Test**: `npm run test` and `npm run doctor`
4. **Deploy**: Use Railway for instant testing
5. **Publish**: Submit to Commands.com marketplace

## Adding Custom Tools

```typescript
// src/tools/myTool.ts
export const myTool = {
  name: "my_custom_tool",
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

## Deployment Options

Use `--deploy <platform>` to include deployment configuration files:

### Railway (`--deploy=railway`) - **Recommended for Testing**
- Includes `railway.json` config
- One-click deployment via GitHub
- Automatic HTTPS and monitoring
- Free $5/month credit perfect for testing

### Vercel (`--deploy=vercel`)
- Includes `vercel.json` config
- Serverless deployment via GitHub
- Edge functions and global CDN

### Docker (`--deploy=docker`)
- Includes `Dockerfile` and `docker-compose.yml`
- Self-hosted deployment
- Full control over infrastructure

## CLI Options

```bash
npx create-commands-mcp [name] [options]

Options:
  -t, --template <type>    Template type (basic|api|data)
  -l, --lang <language>    Language (typescript|javascript)  
  -d, --deploy <platform>  Deployment config (railway|vercel|docker)
  -h, --help              Show help
```

## Requirements

- Node.js 18+
- Commands.com account (optional, for gateway integration)

## Revenue & Monetization

Commands.com provides a complete business platform for just **15% revenue share**:

### **What's Included:**
- 🎯 **Marketplace & Marketing** - Discovery, promotion, and user acquisition
- 💳 **Stripe Integration** - Payment processing and subscription management
- 🔐 **OAuth & Authentication** - User management and secure access
- 📊 **Analytics & Insights** - Usage tracking and performance metrics
- 🌐 **Gateway & Routing** - Connects users to your self-hosted servers

### **Developer Benefits:**
- ✅ **You keep 85%** of all revenue generated
- ✅ **Focus on building** - No need to handle payments, marketing, or auth
- ✅ **Own your infrastructure** - Deploy anywhere (Railway, Vercel, AWS, etc.)
- ✅ **Lower than competitors** - Most platforms take 20-30%

**Build tools, not businesses.** Commands.com handles everything else.

## Server-Sent Events (SSE) Support

The generated MCP servers include built-in SSE support for preventing gateway timeouts on long-running operations.

### When to Use SSE

Use SSE for any operation that takes **more than 5 seconds** to prevent gateway timeouts. Here's a working example:

```javascript
case 'long_operation':
  const { steps = 5, delay_ms = 1000 } = toolArgs || {};

  if (acceptsSSE && method === 'tools/call') {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Process with periodic updates
    (async () => {
      const messages: string[] = [];

      for (let i = 1; i <= steps; i++) {
        // Do work
        await processStep(i);
        
        // Add progress
        messages.push(`Step ${i}/${steps}: ${i === steps ? 'Complete!' : 'Processing...'}`);

        // Send cumulative response
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
    return;
  }
  
  // Fallback for non-SSE clients
  return standardResponse();
```

### Key Points:
- **Send updates every 1-5 seconds** to prevent timeouts
- **Each update contains the complete response** (cumulative)
- **Always provide a non-SSE fallback**
- **Gateway compatibility** - Works with Commands.com and other proxies

### Supported methods:
- `tools/list`, `tools/call` - Tool discovery and execution
- `resources/list`, `resources/read` - Resource management (when implemented)
- `prompts/list`, `prompts/get` - Prompt handling (when implemented)

The gateway handles all SSE protocol details including event IDs, heartbeats, and connection management.

## Support

- 📖 [Documentation](https://commands.com/docs/mcp)
- 💬 [Discord Community](https://discord.com/invite/snk8BEHfRd)
- 🐛 [Report Issues](https://github.com/commands-com/create-commands-mcp/issues)

## License

MIT - see [LICENSE](LICENSE) file for details.