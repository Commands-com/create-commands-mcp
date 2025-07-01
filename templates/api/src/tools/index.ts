import { Tool } from '../types';
import { pingTool } from './ping';
import { echoTool } from './echo';
import { catFactTool } from './catfact';
import { weatherTool } from './weather';

// Export all tools - add new tools here
export const tools: Tool[] = [
  pingTool,
  echoTool,
  catFactTool,
  weatherTool
];

// Individual exports for direct usage
export { pingTool } from './ping';
export { echoTool } from './echo';
export { catFactTool } from './catfact';
export { weatherTool } from './weather';