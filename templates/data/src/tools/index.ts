import { Tool } from '../types.js';
import { pingTool } from './ping.js';
import { echoTool } from './echo.js';
import { jsonParseTool } from './jsonparse.js';
import { csvProcessTool } from './csvprocess.js';
import { usageTool } from './usage.js';

// Export all tools - add new tools here
export const tools: Tool[] = [
  pingTool,
  echoTool,
  jsonParseTool,
  csvProcessTool,
  usageTool
];

// Individual exports for direct usage
export { pingTool } from './ping.js';
export { echoTool } from './echo.js';
export { jsonParseTool } from './jsonparse.js';
export { csvProcessTool } from './csvprocess.js';
export { usageTool } from './usage.js';