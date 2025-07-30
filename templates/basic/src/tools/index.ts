import { Tool } from '../types.js';
import { pingTool } from './ping.js';
import { echoTool } from './echo.js';
import { datetimeTool } from './datetime.js';
import { usageTool } from './usage.js';

// Export all tools - add new tools here
export const tools: Tool[] = [
  pingTool,
  echoTool, 
  datetimeTool,
  usageTool
];

// Individual exports for direct usage
export { pingTool } from './ping.js';
export { echoTool } from './echo.js';
export { datetimeTool } from './datetime.js';
export { usageTool } from './usage.js';