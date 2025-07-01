import { Tool } from '../types';
import { pingTool } from './ping';
import { echoTool } from './echo';
import { datetimeTool } from './datetime';

// Export all tools - add new tools here
export const tools: Tool[] = [
  pingTool,
  echoTool, 
  datetimeTool
];

// Individual exports for direct usage
export { pingTool } from './ping';
export { echoTool } from './echo';
export { datetimeTool } from './datetime';