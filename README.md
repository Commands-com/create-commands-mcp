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
- 🛠️ **Multiple templates** - Basic, API integration, and data processing
- 📦 **Zero production dependencies** - Lightweight and secure
- 🔧 **Developer experience** - TypeScript, testing, and health checks
- 🚀 **Deployment ready** - Railway, Vercel, and Docker configs included

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

1. **Deploy**: Deploy to Railway/Vercel/Docker
2. **Register**: Submit at [Commands.com Creator Portal](https://commands.com/creator/mcp-servers/new)
3. **List**: Your server appears in Commands.com marketplace

```bash
npm run deploy          # Deploy to hosting platform
# Then register your deployed URL at commands.com/creator/mcp-servers/new
```

## Development Workflow

1. **Create**: `npx create-commands-mcp my-server`
2. **Develop**: Add tools in `src/tools/`
3. **Test**: `npm run test` and `npm run doctor`
4. **Deploy**: Choose Railway, Vercel, or Docker
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

### Railway (`--deploy=railway`)
- Includes `railway.json` config
- One-click deployment via GitHub
- Automatic HTTPS and monitoring

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

## Support

- 📖 [Documentation](https://commands.com/docs/mcp)
- 💬 [Discord Community](https://discord.gg/commands)
- 🐛 [Report Issues](https://github.com/commands-com/create-commands-mcp/issues)

## License

MIT - see [LICENSE](LICENSE) file for details.