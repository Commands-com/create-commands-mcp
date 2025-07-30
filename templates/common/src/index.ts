import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { verifyJwt } from './auth/verifyToken.js';
import { tools } from './tools/index.js';
import { Tool } from './types.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000');
const isDevelopment = process.env.NODE_ENV === 'development';
const skipAuth = process.env.SKIP_AUTH === 'true' && isDevelopment;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['https://commands.com', 'https://api.commands.com'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Helper function to send streaming responses for SSE-enabled gateways
// This enables compatibility with Commands.com API Gateway and other SSE-supporting proxies
function sendStreamingResponse(res: express.Response, result: any, id: any) {
  // Set headers for SSE streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Send the complete JSON-RPC response as a single SSE event
  // The gateway will handle event IDs, heartbeats, and other SSE protocol details
  const response = { jsonrpc: '2.0', result, id };
  res.write(`data: ${JSON.stringify(response)}\n\n`);
  
  // End the response
  res.end();
}

// Request logging (only in development)
if (isDevelopment) {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', async (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: process.env.npm_package_name || '{{name}}',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// MCP discovery endpoint
app.get('/.well-known/mcp.json', (req, res) => {
  res.json({
    schemaVersion: "2024-11-05",
    vendor: "Commands.com",
    name: process.env.npm_package_name || '{{name}}',
    version: process.env.npm_package_version || '1.0.0',
    description: process.env.npm_package_description || '{{description}}',
    license: "MIT",
    capabilities: {
      tools: {
        listChanged: true
      }
    },
    serverInfo: {
      name: process.env.npm_package_name || '{{name}}',
      version: process.env.npm_package_version || '1.0.0'
    }
  });
});

// Root endpoint with basic info
app.get('/', (req, res) => {
  res.json({
    name: process.env.npm_package_name || '{{name}}',
    description: process.env.npm_package_description || '{{description}}',
    version: process.env.npm_package_version || '1.0.0',
    endpoints: {
      health: '/health',
      discovery: '/.well-known/mcp.json',
      tools: '/mcp/tools',
      execute: '/mcp/tools/:toolName'
    },
    tools: tools.map(tool => `${tool.name} - ${tool.description}`)
  });
});

// Define authentication middleware first
const authMiddleware = skipAuth ? 
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (isDevelopment) {
      console.log('Authentication: DISABLED (dev mode)');
    }
    // Mock user for development
    req.user = {
      sub: 'dev-user',
      email: 'dev@example.com',
      scope: 'read_assets write_assets'
    };
    next();
  } : 
  verifyJwt;

// REST API endpoints for tool discovery and execution
// GET /mcp/tools - Tool discovery endpoint (non-JSON-RPC)
app.get('/mcp/tools', (req, res) => {
  res.json({
    tools: tools.map((tool: Tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  });
});

// POST /mcp/tools/:toolName - Direct tool execution (non-JSON-RPC)
app.post('/mcp/tools/:toolName', authMiddleware, async (req, res) => {
  const { toolName } = req.params;
  const { params = {} } = req.body;
  
  // Log REST API calls in development
  if (isDevelopment) {
    console.log(`[REST] Tool execution: ${toolName} with params:`, params);
  }
  
  try {
    // Find the tool
    const tool = tools.find((t: Tool) => t.name === toolName);
    if (!tool) {
      return res.status(404).json({
        error: {
          code: 404,
          message: `Tool '${toolName}' not found`
        }
      });
    }
    
    // Execute the tool with context for specific tools that need it
    let result;
    if (tool.name === 'usage') {
      const context = {
        user: req.user,
        jwt: req.headers.authorization,
        headers: req.headers
      };
      result = await tool.handler(params, context);
    } else {
      result = await tool.handler(params);
    }
    
    // Return direct result (not JSON-RPC format)
    res.json({ result });
    
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Internal server error',
        data: { tool: toolName }
      }
    });
  }
});

// Main JSON-RPC endpoint
app.post('/', authMiddleware, async (req, res) => {
  // Check if client supports SSE (passed through by gateway)
  const acceptsSSE = req.headers.accept?.includes('text/event-stream');
  // All requests must be authenticated (or in dev mode)
  if (!req.user && !skipAuth) {
    return res.status(401).json({
      jsonrpc: '2.0',
      error: {
        code: -32600,
        message: 'Authentication required'
      },
      id: null
    });
  }
  
  // Extract user info from headers or JWT
  const userID = req.headers['x-user-id'] || req.user?.sub;
  const userEmail = req.headers['x-user-email'] || req.user?.email;
  
  // Handle JSON-RPC request
  const { method, params, id, jsonrpc } = req.body;
  
  // Log requests in development
  if (isDevelopment) {
    console.log(`[MCP] JSON-RPC Request: method=${method}, id=${id}, user=${userEmail || userID}`);
  }
  
  if (jsonrpc !== '2.0') {
    return res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32600,
        message: 'Invalid Request - jsonrpc must be "2.0"'
      },
      id: id || null
    });
  }
  
  try {
    switch (method) {
      case 'initialize':
        return res.json({
          jsonrpc: '2.0',
          result: {
            protocolVersion: '2025-06-18',
            capabilities: {
              tools: {
                listChanged: true
              }
            },
            serverInfo: {
              name: process.env.npm_package_name || '{{name}}',
              version: process.env.npm_package_version || '1.0.0'
            }
          },
          id
        });
        
      case 'notifications/initialized':
        // Notification - no response needed
        return res.status(200).end();
        
      case 'tools/list':
        const toolsResult = {
          tools: tools.map((tool: Tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
          }))
        };
        
        // Use SSE if client supports it
        if (acceptsSSE) {
          return sendStreamingResponse(res, toolsResult, id);
        }
        
        return res.json({
          jsonrpc: '2.0',
          result: toolsResult,
          id
        });
        
      case 'resources/list':
        const resourcesResult = {
          resources: []
        };
        
        // Use SSE if client supports it
        if (acceptsSSE) {
          return sendStreamingResponse(res, resourcesResult, id);
        }
        
        return res.json({
          jsonrpc: '2.0',
          result: resourcesResult,
          id
        });
        
      case 'prompts/list':
        const promptsResult = {
          prompts: []
        };
        
        // Use SSE if client supports it
        if (acceptsSSE) {
          return sendStreamingResponse(res, promptsResult, id);
        }
        
        return res.json({
          jsonrpc: '2.0',
          result: promptsResult,
          id
        });
        
      case 'tools/call':
        // Handle tool execution
        const { name: toolName, arguments: toolArgs } = params;
        // Log tool calls in development
        if (isDevelopment) {
          console.log(`[MCP] Tool call: ${toolName} with args:`, toolArgs);
        }
        
        // Find the tool
        const tool = tools.find((t: Tool) => t.name === toolName);
        if (!tool) {
          return res.json({
            jsonrpc: '2.0',
            error: {
              code: -32602,
              message: `Tool not found: ${toolName}`
            },
            id
          });
        }
        
        try {
          // Execute the tool with context for specific tools that need it
          let result;
          if (tool.name === 'usage') {
            const context = {
              user: req.user,
              jwt: req.headers.authorization,
              headers: req.headers
            };
            result = await tool.handler(toolArgs || {}, context);
          } else {
            result = await tool.handler(toolArgs || {});
          }
          
          // Format response according to MCP spec
          const toolResult = {
            content: [
              {
                type: 'text',
                text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
              }
            ]
          };
          
          // Use SSE if client supports it
          if (acceptsSSE) {
            return sendStreamingResponse(res, toolResult, id);
          }
          
          return res.json({
            jsonrpc: '2.0',
            result: toolResult,
            id
          });
        } catch (toolError) {
          console.error(`Tool execution error for ${toolName}:`, toolError);
          return res.json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: `Tool execution failed: ${(toolError as Error).message}`
            },
            id
          });
        }
        
      case 'resources/read':
        // Handle resource read if implemented
        const { uri } = params || {};
        // This is a placeholder - implement your resource reading logic here
        return res.json({
          jsonrpc: '2.0',
          error: {
            code: -32602,
            message: 'Resources not implemented in this server'
          },
          id
        });
        
      case 'prompts/get':
        // Handle prompt retrieval if implemented
        const { name } = params || {};
        // This is a placeholder - implement your prompt logic here
        return res.json({
          jsonrpc: '2.0',
          error: {
            code: -32602,
            message: 'Prompts not implemented in this server'
          },
          id
        });
        
      default:
        return res.status(404).json({
          jsonrpc: '2.0',
          error: {
            code: -32601,
            message: `Method not found: ${method}`
          },
          id: id || null
        });
    }
  } catch (error) {
    console.error('JSON-RPC handler error:', error);
    return res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error'
      },
      id: id || null
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 404,
      message: 'Endpoint not found',
      path: req.originalUrl
    }
  });
});

// Error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: {
      code: 500,
      message: 'Internal server error'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`MCP Server running on http://localhost:${PORT}`);
  
  if (isDevelopment) {
    console.log(`Available tools: ${tools.map((t: Tool) => t.name).join(', ')}`);
    console.log(`Authentication: ${skipAuth ? 'DISABLED (dev mode)' : 'ENABLED'}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`MCP Discovery: http://localhost:${PORT}/.well-known/mcp.json`);
  }
});

export default app;