import { describe, it, expect } from 'vitest';
import { pingTool } from '../src/tools/ping';

describe('Ping Tool', () => {
  it('should return pong with timestamp', async () => {
    const result = await pingTool.handler({});
    
    expect(result).toHaveProperty('message', 'pong');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('server');
    expect(result).toHaveProperty('version');
    expect(result).toHaveProperty('uptime');
    
    // Validate timestamp format (ISO string)
    expect(result.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    
    // Validate uptime is a number
    expect(typeof result.uptime).toBe('number');
    expect(result.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should include server information', async () => {
    const result = await pingTool.handler({});
    
    expect(typeof result.server).toBe('string');
    expect(typeof result.version).toBe('string');
  });

  it('should handle multiple calls consistently', async () => {
    const result1 = await pingTool.handler({});
    const result2 = await pingTool.handler({});
    
    expect(result1.message).toBe(result2.message);
    expect(result1.server).toBe(result2.server);
    expect(result1.version).toBe(result2.version);
    
    // Timestamps should be different (assuming calls are not instantaneous)
    // But both should be valid ISO strings
    expect(result1.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result2.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});