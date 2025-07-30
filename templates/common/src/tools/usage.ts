import { Tool } from '../types.js';

const GATEWAY_URL = process.env.GATEWAY_URL || 'https://api.commands.com';

/**
 * Usage stats tool for Commands.com gateway integration
 * Allows users to check their current usage limits and consumption
 */
export const usageTool: Tool = {
  name: 'usage',
  description: 'Get your current usage limits and consumption from Commands.com',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  handler: async (args: any, context?: any) => {
    // Check if we have JWT for authentication
    if (!context?.jwt) {
      return { 
        error: 'Authentication required',
        message: 'This tool requires Commands.com JWT authentication'
      };
    }
    
    try {
      // Extract organization and server name from environment
      const organization = process.env.COMMANDS_ORG;
      const serverName = process.env.npm_package_name || process.env.MCP_NAME;
      
      if (!organization) {
        return {
          error: 'Configuration required',
          message: 'COMMANDS_ORG environment variable not set. Run: npx create-commands-mcp set-org <your-org>'
        };
      }
      
      if (!serverName) {
        return {
          error: 'Configuration required', 
          message: 'Server name not found. Check package.json or set MCP_NAME environment variable'
        };
      }
      
      // Call the gateway's usage stats endpoint
      // Format: /api/{organization}/{mcp-name}/usage-stats
      const response = await fetch(`${GATEWAY_URL}/api/${organization}/${serverName}/usage-stats`, {
        headers: {
          'Authorization': context.jwt
        }
      });
      
      if (!response.ok) {
        const error = await response.text();
        return { 
          error: 'Failed to get usage stats', 
          details: error,
          status: response.status 
        };
      }
      
      const data: any = await response.json();
      
      // Format the response based on the gateway format
      const result: any = {
        tier: data.limits?.tier || 'unknown',
        is_owner: data.is_owner || false,
        has_subscription: data.has_subscription || false
      };

      // Add limits if present
      if (data.limits) {
        result.limits = data.limits;
      }

      // Add current usage
      if (data.usage) {
        result.current_usage = {
          daily_requests: data.usage.daily_requests || 0,
          daily_tokens: data.usage.daily_tokens || 0,
          monthly_requests: data.usage.monthly_requests || 0,
          monthly_tokens: data.usage.monthly_tokens || 0,
          total_requests: data.usage.total_requests || 0,
          total_tokens: data.usage.total_tokens || 0
        };
      }

      // For free tier, calculate remaining from limits
      if (data.limits?.tier === 'free' && data.limits.total_request_limit) {
        result.remaining = {
          total_requests: Math.max(0, (data.limits.total_request_limit || 0) - (data.usage?.total_requests || 0)),
          total_tokens: Math.max(0, (data.limits.total_token_limit || 0) - (data.usage?.total_tokens || 0))
        };
      }

      // Add upgrade info for free tier
      if (data.limits?.tier === 'free') {
        result.upgrade_available = true;
        result.upgrade_url = 'https://commands.com/subscribe';
      }

      return result;
    } catch (error: any) {
      return {
        error: 'Failed to fetch usage stats',
        details: error.message
      };
    }
  }
};