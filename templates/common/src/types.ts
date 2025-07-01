// MCP Protocol Types
export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: string;
    message: string;
    data?: any;
  };
}

export interface MCPServerInfo {
  name: string;
  version: string;
  description: string;
  protocolVersion: string;
  capabilities: {
    tools: Record<string, any>;
  };
}

// Tool Types
export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: any, user?: TokenClaims) => Promise<any>;
}

// JWT Types
export interface TokenClaims {
  iss: string; // Issuer - must be https://api.commands.com
  aud: string; // Audience - your server name
  sub: string; // Subject - user ID
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  email?: string; // User email (optional)
  name?: string; // User name (optional)
  scp?: string[]; // Scopes array (optional)
}

// Error Types
export class MCPError extends Error {
  constructor(
    public code: string,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

// Common error codes
export const MCP_ERROR_CODES = {
  PARSE_ERROR: 'PARSE_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST', 
  METHOD_NOT_FOUND: 'METHOD_NOT_FOUND',
  INVALID_PARAMS: 'INVALID_PARAMS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED'
} as const;

// Utility type for tool handlers
export type ToolHandler<T = any, R = any> = (
  args: T,
  user?: TokenClaims
) => Promise<R>;