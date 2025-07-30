/**
 * Token counting utility for Commands.com gateway integration
 * 
 * This utility provides token counting functionality for tracking usage
 * in long-running operations and jobs.
 * 
 * Note: For production use, you should install tiktoken:
 * npm install tiktoken
 */

// Simple approximation of token counting when tiktoken is not available
// This is roughly accurate for English text but should be replaced with tiktoken for production
function approximateTokenCount(text: string): number {
  // Rough approximation: ~4 characters per token
  // This is not accurate but provides a ballpark estimate
  const charCount = text.length;
  const wordCount = text.split(/\s+/).length;
  
  // Use average of character-based and word-based estimates
  const charBasedEstimate = Math.ceil(charCount / 4);
  const wordBasedEstimate = Math.ceil(wordCount * 1.3); // Most words are ~1.3 tokens
  
  return Math.ceil((charBasedEstimate + wordBasedEstimate) / 2);
}

// Uncomment this section when tiktoken is installed:
/*
import { get_encoding } from 'tiktoken';

// Use cl100k_base encoding (GPT-4/GPT-4o encoding)
const encoding = get_encoding('cl100k_base');

export const countTokens = (text: string): number => {
  const tokens = encoding.encode(text);
  return tokens.length;
};
*/

// Export the approximation function for now
export const countTokens = approximateTokenCount;

/**
 * Job tracking interface for async operations
 */
export interface Job {
  id: string;
  userId: string;
  operation: string;
  state: 'pending' | 'processing' | 'complete' | 'failed';
  created: number;
  updated?: number;
  completed?: number;
  input?: string;
  output?: string;
  error?: string;
  tokenCount?: {
    input?: number;
    output?: number;
    total?: number;
  };
  metadata?: Record<string, any>;
}

/**
 * Simple in-memory job store for demonstration
 * In production, use Redis or a database
 */
export class JobStore {
  private jobs = new Map<string, Job>();

  async create(job: Omit<Job, 'id' | 'created'>): Promise<Job> {
    const newJob: Job = {
      ...job,
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created: Date.now()
    };
    
    // Count input tokens if input is provided
    if (newJob.input) {
      newJob.tokenCount = {
        input: countTokens(newJob.input)
      };
    }
    
    this.jobs.set(newJob.id, newJob);
    return newJob;
  }

  async get(id: string): Promise<Job | null> {
    return this.jobs.get(id) || null;
  }

  async update(id: string, updates: Partial<Job>): Promise<Job | null> {
    const job = this.jobs.get(id);
    if (!job) return null;
    
    const updatedJob = {
      ...job,
      ...updates,
      updated: Date.now()
    };
    
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  async complete(id: string, output: string): Promise<Job | null> {
    const job = this.jobs.get(id);
    if (!job) return null;
    
    const outputTokens = countTokens(output);
    const totalTokens = (job.tokenCount?.input || 0) + outputTokens;
    
    const updatedJob: Job = {
      ...job,
      state: 'complete',
      output,
      completed: Date.now(),
      tokenCount: {
        ...job.tokenCount,
        output: outputTokens,
        total: totalTokens
      }
    };
    
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  async fail(id: string, error: string): Promise<Job | null> {
    const job = this.jobs.get(id);
    if (!job) return null;
    
    const updatedJob: Job = {
      ...job,
      state: 'failed',
      error,
      completed: Date.now()
    };
    
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  async listByUser(userId: string): Promise<Job[]> {
    const userJobs: Job[] = [];
    for (const job of this.jobs.values()) {
      if (job.userId === userId) {
        userJobs.push(job);
      }
    }
    return userJobs.sort((a, b) => b.created - a.created);
  }
}

// Export a singleton instance
export const jobStore = new JobStore();