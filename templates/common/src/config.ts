/**
 * Configuration for Commands.com integration
 * This file is auto-generated during project creation
 */

export const COMMANDS_CONFIG = {
  // Your Commands.com organization/username
  organization: '{{organization}}',
  
  // Gateway URL (do not change unless using self-hosted gateway)
  gatewayUrl: process.env.GATEWAY_URL || 'https://api.commands.com'
} as const;