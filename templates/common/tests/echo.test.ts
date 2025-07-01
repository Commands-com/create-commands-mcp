import { describe, it, expect } from 'vitest';
import { echoTool } from '../src/tools/echo';
import { MCPError } from '../src/types';

describe('Echo Tool', () => {
  it('should echo back the message', async () => {
    const result = await echoTool.handler({ message: 'Hello, World!' });
    
    expect(result).toHaveProperty('echo', 'Hello, World!');
    expect(result).toHaveProperty('original', 'Hello, World!');
    expect(result).toHaveProperty('length', 13);
    expect(result).toHaveProperty('wordCount', 2);
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('processed', false);
  });

  it('should handle uppercase option', async () => {
    const result = await echoTool.handler({ 
      message: 'Hello, World!', 
      uppercase: true 
    });
    
    expect(result.echo).toBe('HELLO, WORLD!');
    expect(result.original).toBe('Hello, World!');
    expect(result.processed).toBe(true);
  });

  it('should count words correctly', async () => {
    const testCases = [
      { message: 'hello', expectedWords: 1 },
      { message: 'hello world', expectedWords: 2 },
      { message: 'hello   world   test', expectedWords: 3 },
      { message: '  spaced  words  ', expectedWords: 2 },
      { message: '', expectedWords: 0 }
    ];

    for (const testCase of testCases) {
      const result = await echoTool.handler({ message: testCase.message });
      expect(result.wordCount).toBe(testCase.expectedWords);
    }
  });

  it('should throw error for missing message', async () => {
    await expect(echoTool.handler({})).rejects.toThrow(MCPError);
    await expect(echoTool.handler({ message: '' })).rejects.toThrow(MCPError);
  });

  it('should throw error for invalid message type', async () => {
    await expect(echoTool.handler({ message: 123 })).rejects.toThrow(MCPError);
    await expect(echoTool.handler({ message: null })).rejects.toThrow(MCPError);
    await expect(echoTool.handler({ message: undefined })).rejects.toThrow(MCPError);
  });

  it('should throw error for message too long', async () => {
    const longMessage = 'a'.repeat(1001);
    await expect(echoTool.handler({ message: longMessage })).rejects.toThrow(MCPError);
  });

  it('should handle special characters', async () => {
    const specialMessage = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const result = await echoTool.handler({ message: specialMessage });
    
    expect(result.echo).toBe(specialMessage);
    expect(result.original).toBe(specialMessage);
    expect(result.length).toBe(specialMessage.length);
  });

  it('should include valid timestamp', async () => {
    const result = await echoTool.handler({ message: 'test' });
    
    // Should be a valid ISO timestamp
    expect(result.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    
    // Should be recent (within last few seconds)
    const timestamp = new Date(result.timestamp);
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    expect(diffMs).toBeLessThan(5000); // Within 5 seconds
  });
});