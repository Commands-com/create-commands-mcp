import { Tool, MCPError } from '../types.js';

/**
 * Echo Tool - Echo back user input for testing I/O
 * 
 * This tool demonstrates:
 * - Input validation and required parameters
 * - String parameter handling
 * - Error handling for missing inputs
 * - Returning processed data
 */
export const echoTool: Tool = {
  name: 'echo',
  description: 'Echo back the input message with additional metadata',
  inputSchema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'The message to echo back',
        minLength: 1,
        maxLength: 1000
      },
      uppercase: {
        type: 'boolean',
        description: 'Whether to return the message in uppercase',
        default: false
      }
    },
    required: ['message']
  },
  handler: async (args: { message: string; uppercase?: boolean }) => {
    // Validate required input
    if (!args.message || typeof args.message !== 'string') {
      throw new MCPError('INVALID_PARAMS', 'Message parameter is required and must be a string');
    }

    // Validate message length
    if (args.message.length > 1000) {
      throw new MCPError('INVALID_PARAMS', 'Message too long (max 1000 characters)');
    }

    const processedMessage = args.uppercase ? args.message.toUpperCase() : args.message;
    
    return {
      echo: processedMessage,
      original: args.message,
      length: args.message.length,
      wordCount: args.message.split(/\s+/).filter(word => word.length > 0).length,
      timestamp: new Date().toISOString(),
      processed: Boolean(args.uppercase)
    };
  }
};