import { describe, expect, it, vi, beforeEach } from 'vitest';
import { usageTool } from '../src/tools/usage';

// Mock fetch globally
global.fetch = vi.fn();

describe('Usage Tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    process.env.GATEWAY_URL = 'https://api.commands.com';
    process.env.npm_package_name = 'test-server';
  });

  it('should have correct metadata', () => {
    expect(usageTool.name).toBe('usage');
    expect(usageTool.description).toContain('usage limits and consumption');
    expect(usageTool.inputSchema.type).toBe('object');
  });

  it('should require authentication', async () => {
    // Call without context
    const result = await usageTool.handler({});
    
    expect(result).toHaveProperty('error', 'Authentication required');
    expect(result).toHaveProperty('message');
  });

  it('should call gateway with correct URL', async () => {
    const mockContext = {
      jwt: 'Bearer test-jwt-token',
      user: { sub: 'user123' }
    };
    
    const mockResponse = {
      ok: true,
      json: async () => ({
        limits: { tier: 'pro' },
        usage: { total_requests: 50 }
      })
    };
    
    (global.fetch as any).mockResolvedValueOnce(mockResponse);
    
    await usageTool.handler({}, mockContext);
    
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.commands.com/api/commands-com/test-server/usage-stats',
      expect.objectContaining({
        headers: {
          'Authorization': 'Bearer test-jwt-token'
        }
      })
    );
  });

  it('should format response correctly for free tier', async () => {
    const mockContext = {
      jwt: 'Bearer test-jwt-token',
      user: { sub: 'user123' }
    };
    
    const mockResponse = {
      ok: true,
      json: async () => ({
        limits: { 
          tier: 'free',
          total_request_limit: 100,
          total_token_limit: 50000
        },
        usage: { 
          total_requests: 30,
          total_tokens: 15000,
          daily_requests: 5
        }
      })
    };
    
    (global.fetch as any).mockResolvedValueOnce(mockResponse);
    
    const result = await usageTool.handler({}, mockContext);
    
    expect(result).toHaveProperty('tier', 'free');
    expect(result).toHaveProperty('upgrade_available', true);
    expect(result).toHaveProperty('upgrade_url');
    expect(result.remaining).toEqual({
      total_requests: 70,
      total_tokens: 35000
    });
  });

  it('should handle gateway errors', async () => {
    const mockContext = {
      jwt: 'Bearer test-jwt-token',
      user: { sub: 'user123' }
    };
    
    const mockResponse = {
      ok: false,
      status: 429,
      text: async () => 'Rate limit exceeded'
    };
    
    (global.fetch as any).mockResolvedValueOnce(mockResponse);
    
    const result = await usageTool.handler({}, mockContext);
    
    expect(result).toHaveProperty('error', 'Failed to get usage stats');
    expect(result).toHaveProperty('status', 429);
  });

  it('should handle network errors', async () => {
    const mockContext = {
      jwt: 'Bearer test-jwt-token',
      user: { sub: 'user123' }
    };
    
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
    
    const result = await usageTool.handler({}, mockContext);
    
    expect(result).toHaveProperty('error', 'Failed to fetch usage stats');
    expect(result).toHaveProperty('details', 'Network error');
  });
});