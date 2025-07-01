import { Tool, MCPError } from '../types';

/**
 * DateTime Tool - Get current date and time in various formats
 * 
 * This tool demonstrates:
 * - System integration (accessing current time)
 * - Enum parameter validation
 * - Multiple output formats
 * - Optional parameters with defaults
 * - Commented streaming example for future reference
 */
export const datetimeTool: Tool = {
  name: 'datetime',
  description: 'Get current date and time in various formats',
  inputSchema: {
    type: 'object',
    properties: {
      format: {
        type: 'string',
        enum: ['iso', 'unix', 'readable', 'utc', 'local'],
        description: 'Output format for the datetime',
        default: 'iso'
      },
      timezone: {
        type: 'string',
        description: 'Timezone offset (e.g., "America/New_York", "+05:00")',
        default: 'UTC'
      }
    },
    required: []
  },
  handler: async (args: { format?: string; timezone?: string }) => {
    const now = new Date();
    const format = args.format || 'iso';
    const timezone = args.timezone || 'UTC';

    // Validate format
    const validFormats = ['iso', 'unix', 'readable', 'utc', 'local'];
    if (!validFormats.includes(format)) {
      throw new MCPError('INVALID_PARAMS', `Invalid format. Must be one of: ${validFormats.join(', ')}`);
    }

    let formattedTime: string;
    let unixTimestamp = Math.floor(now.getTime() / 1000);

    try {
      switch (format) {
        case 'iso':
          formattedTime = now.toISOString();
          break;
        
        case 'unix':
          formattedTime = unixTimestamp.toString();
          break;
        
        case 'readable':
          formattedTime = now.toLocaleString('en-US', {
            timeZone: timezone === 'UTC' ? 'UTC' : timezone,
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
          });
          break;
        
        case 'utc':
          formattedTime = now.toUTCString();
          break;
        
        case 'local':
          formattedTime = now.toString();
          break;
        
        default:
          formattedTime = now.toISOString();
      }
    } catch (error) {
      throw new MCPError('INVALID_PARAMS', `Invalid timezone: ${timezone}`);
    }

    return {
      datetime: formattedTime,
      format,
      timezone,
      unix_timestamp: unixTimestamp,
      iso_string: now.toISOString(),
      day_of_week: now.toLocaleDateString('en-US', { weekday: 'long' }),
      day_of_year: Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
    };
  }
};

// Uncomment below for Server-Sent Events streaming example:
// This demonstrates how to implement streaming responses for real-time data
//
// export const datetimeStreamTool: Tool = {
//   name: 'datetime_stream',
//   description: 'Stream current time every second for 5 seconds (SSE example)',
//   inputSchema: {
//     type: 'object',
//     properties: {
//       interval: {
//         type: 'number',
//         description: 'Interval in milliseconds between updates',
//         default: 1000,
//         minimum: 100,
//         maximum: 5000
//       }
//     }
//   },
//   handler: async function* (args: { interval?: number }) {
//     const interval = args.interval || 1000;
//     
//     for (let i = 0; i < 5; i++) {
//       const now = new Date();
//       yield {
//         tick: i + 1,
//         timestamp: now.toISOString(),
//         unix: Math.floor(now.getTime() / 1000),
//         message: `Time update ${i + 1}/5`
//       };
//       
//       if (i < 4) { // Don't wait after the last iteration
//         await new Promise(resolve => setTimeout(resolve, interval));
//       }
//     }
//   }
// };