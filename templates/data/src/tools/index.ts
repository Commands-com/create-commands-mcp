import { Tool } from '../types';
import { pingTool } from './ping';
import { echoTool } from './echo';
import { jsonParseTool } from './jsonparse';
import { csvProcessTool } from './csvprocess';

// Export all tools - add new tools here
export const tools: Tool[] = [
  pingTool,
  echoTool,
  jsonParseTool,
  csvProcessTool
];

// Individual exports for direct usage
export { pingTool } from './ping';
export { echoTool } from './echo';
export { jsonParseTool } from './jsonparse';
export { csvProcessTool } from './csvprocess';