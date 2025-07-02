import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import { verifyToken } from './auth/verifyToken';
import { tools } from './tools';
import { MCPRequest, MCPResponse, MCPError, Tool, MCPServerInfo, TokenClaims } from './types';

const PORT = parseInt(process.env.PORT || '3000');
const isDevelopment = process.env.NODE_ENV === 'development';
const skipAuth = process.env.SKIP_AUTH === 'true' && isDevelopment;

// Server information for MCP protocol
const serverInfo: MCPServerInfo = {
  name: process.env.npm_package_name || '{{name}}',
  version: process.env.npm_package_version || '1.0.0',
  description: process.env.npm_package_description || '{{description}}',
  protocolVersion: '2024-11-05',
  capabilities: {
    tools: {}
  }
};

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  // CORS headers for Commands.com
  res.setHeader('Access-Control-Allow-Origin', 'https://commands.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = parse(req.url || '', true);
  const pathname = parsedUrl.pathname;

  try {
    // Health check endpoint (no auth required)
    if (pathname === '/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        server: serverInfo.name,
        version: serverInfo.version
      }));
      return;
    }

    // MCP server info endpoint (no auth required)  
    if (pathname === '/' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({
        ...serverInfo,
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      }));
      return;
    }

    // All other endpoints require authentication
    let user: TokenClaims | undefined = undefined;
    if (!skipAuth) {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw new MCPError('UNAUTHORIZED', 'Authorization header required');
      }

      const token = authHeader.slice(7);
      user = await verifyToken(token);
    }

    // Handle MCP JSON-RPC protocol
    if (req.method === 'POST') {
      const body = await getRequestBody(req);
      let mcpRequest: MCPRequest;

      try {
        mcpRequest = JSON.parse(body);
      } catch (error) {
        throw new MCPError('PARSE_ERROR', 'Invalid JSON in request body');
      }

      const response = await handleMCPRequest(mcpRequest, user);
      res.writeHead(200);
      res.end(JSON.stringify(response));
      return;
    }

    // REST API endpoints for direct tool access
    if (pathname?.startsWith('/tools/') && req.method === 'POST') {
      const toolName = pathname.slice(7); // Remove '/tools/'
      const tool = tools.find(t => t.name === toolName);
      
      if (!tool) {
        throw new MCPError('METHOD_NOT_FOUND', `Tool ${toolName} not found`);
      }

      const body = await getRequestBody(req);
      const args = body ? JSON.parse(body) : {};
      
      const result = await tool.handler(args, user);
      res.writeHead(200);
      res.end(JSON.stringify({ result }));
      return;
    }

    // Not found
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));

  } catch (error) {
    console.error('Request error:', error);
    
    const statusCode = error instanceof MCPError ? 
      (error.code === 'UNAUTHORIZED' ? 401 : 400) : 500;
    
    res.writeHead(statusCode);
    res.end(JSON.stringify({
      error: {
        code: error instanceof MCPError ? error.code : 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }));
  }
});

async function handleMCPRequest(request: MCPRequest, user: any): Promise<MCPResponse> {
  const { method, params, id } = request;

  try {
    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: serverInfo.protocolVersion,
            capabilities: serverInfo.capabilities,
            serverInfo: {
              name: serverInfo.name,
              version: serverInfo.version
            }
          }
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: tools.map(tool => ({
              name: tool.name,
              description: tool.description,
              inputSchema: tool.inputSchema
            }))
          }
        };

      case 'tools/call':
        const { name: toolName, arguments: toolArgs } = params;
        const tool = tools.find(t => t.name === toolName);
        
        if (!tool) {
          throw new MCPError('METHOD_NOT_FOUND', `Tool ${toolName} not found`);
        }

        const result = await tool.handler(toolArgs || {}, user);
        
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          }
        };

      default:
        throw new MCPError('METHOD_NOT_FOUND', `Unknown method: ${method}`);
    }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: error instanceof MCPError ? error.code : 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

function getRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', reject);
  });
}

server.listen(PORT, () => {
  console.log(`🚀 MCP Server running on http://localhost:${PORT}`);
  console.log(`📋 Available tools: ${tools.map(t => t.name).join(', ')}`);
  console.log(`🔒 Authentication: ${skipAuth ? 'DISABLED (dev mode)' : 'ENABLED'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});