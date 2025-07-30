import { Tool } from '../types.js';
import { pingTool } from './ping.js';
import { echoTool } from './echo.js';
import { catFactTool } from './catfact.js';
import { weatherTool } from './weather.js';
import { usageTool } from './usage.js';

// Export all tools - add new tools here
export const tools: Tool[] = [
  pingTool,
  echoTool,
  catFactTool,
  weatherTool,
  usageTool
];

// Individual exports for direct usage
export { pingTool } from './ping.js';
export { echoTool } from './echo.js';
export { catFactTool } from './catfact.js';
export { weatherTool } from './weather.js';
export { usageTool } from './usage.js';