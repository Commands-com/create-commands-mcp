import { Tool } from '../types';

/**
 * Ping Tool - Test server connectivity and responsiveness
 * 
 * This is the simplest possible MCP tool that demonstrates:
 * - Basic tool structure
 * - Input schema (empty object)
 * - Async handler function
 * - Returning structured data
 */
export const pingTool: Tool = {
  name: 'ping',
  description: 'Test server connectivity and responsiveness',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (args: {}) => {
    const timestamp = new Date().toISOString();
    
    return {
      message: 'pong',
      timestamp,
      server: process.env.npm_package_name || 'mcp-server',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime()
    };
  }
};