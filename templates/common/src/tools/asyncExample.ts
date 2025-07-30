/**
 * Example async tool with job tracking and token accounting
 * 
 * This tool demonstrates how to implement long-running operations
 * with proper token tracking and gateway notifications.
 */

import { Tool } from '../types.js';
import { jobStore, countTokens } from '../utils/tokenCounter.js';
import { notifyJobComplete, notifyJobFailed } from '../utils/gatewayNotify.js';

/**
 * Simulates a long-running operation (e.g., API call, data processing)
 */
async function performLongOperation(input: string): Promise<string> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate some processing that generates output
  const processed = input.toUpperCase();
  const analysis = `Processed ${input.length} characters`;
  
  return `Result: ${processed}\nAnalysis: ${analysis}`;
}

export const asyncExampleTool: Tool = {
  name: 'async_example',
  description: 'Example async operation with job tracking and token accounting',
  inputSchema: {
    type: 'object',
    properties: {
      input: {
        type: 'string',
        description: 'Input text to process'
      },
      async: {
        type: 'boolean',
        description: 'Whether to run asynchronously (default: false)'
      }
    },
    required: ['input']
  },
  handler: async (args: { input: string; async?: boolean }, context?: any) => {
    const { input, async = false } = args;
    const userId = context?.user?.sub || 'anonymous';
    const jwt = context?.jwt;
    
    // For synchronous mode, just process and return
    if (!async) {
      const result = await performLongOperation(input);
      const tokens = countTokens(input) + countTokens(result);
      
      return {
        result,
        tokens_used: tokens,
        mode: 'synchronous'
      };
    }
    
    // For async mode, create a job and return immediately
    const job = await jobStore.create({
      userId,
      operation: 'async_example',
      state: 'pending',
      input,
      metadata: {
        async: true
      }
    });
    
    // Process asynchronously
    processJobAsync(job.id, jwt);
    
    return {
      job_id: job.id,
      status: 'pending',
      message: 'Job created and processing asynchronously',
      check_status: `Use the job_status tool with job_id: ${job.id}`,
      estimated_time: '2-3 seconds'
    };
  }
};

/**
 * Process job asynchronously
 */
async function processJobAsync(jobId: string, jwt?: string): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Update job state to processing
    const job = await jobStore.update(jobId, { state: 'processing' });
    if (!job) return;
    
    // Perform the long operation
    const result = await performLongOperation(job.input || '');
    
    // Complete the job with token count
    const completedJob = await jobStore.complete(jobId, result);
    if (!completedJob) return;
    
    const duration = Date.now() - startTime;
    
    // Notify gateway of completion
    if (jwt && completedJob.tokenCount?.total) {
      await notifyJobComplete(
        jobId, 
        jwt, 
        completedJob.tokenCount.total,
        duration,
        { operation: 'async_example' }
      );
    }
    
  } catch (error: any) {
    // Mark job as failed
    await jobStore.fail(jobId, error.message);
    
    // Notify gateway of failure
    if (jwt) {
      await notifyJobFailed(
        jobId,
        jwt,
        error.message,
        { operation: 'async_example' }
      );
    }
  }
}

/**
 * Job status checking tool
 */
export const jobStatusTool: Tool = {
  name: 'job_status',
  description: 'Check the status of an async job',
  inputSchema: {
    type: 'object',
    properties: {
      job_id: {
        type: 'string',
        description: 'The job ID to check'
      }
    },
    required: ['job_id']
  },
  handler: async (args: { job_id: string }, context?: any) => {
    const { job_id } = args;
    const userId = context?.user?.sub;
    
    const job = await jobStore.get(job_id);
    
    if (!job) {
      return { error: 'Job not found' };
    }
    
    // Verify user owns the job (unless admin)
    if (userId && job.userId !== userId && !context?.user?.admin) {
      return { error: 'Access denied' };
    }
    
    // Return job status
    const response: any = {
      job_id: job.id,
      state: job.state,
      operation: job.operation,
      created: new Date(job.created).toISOString()
    };
    
    if (job.state === 'complete') {
      response.result = job.output;
      response.completed = new Date(job.completed!).toISOString();
      response.tokens_used = job.tokenCount?.total || 0;
      response.duration_ms = job.completed! - job.created;
    }
    
    if (job.state === 'failed') {
      response.error = job.error;
      response.completed = new Date(job.completed!).toISOString();
    }
    
    return response;
  }
};

/**
 * List jobs tool
 */
export const listJobsTool: Tool = {
  name: 'list_jobs',
  description: 'List your async jobs',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of jobs to return (default: 10)'
      }
    }
  },
  handler: async (args: { limit?: number }, context?: any) => {
    const { limit = 10 } = args;
    const userId = context?.user?.sub || 'anonymous';
    
    const jobs = await jobStore.listByUser(userId);
    const limitedJobs = jobs.slice(0, limit);
    
    return {
      jobs: limitedJobs.map(job => ({
        job_id: job.id,
        operation: job.operation,
        state: job.state,
        created: new Date(job.created).toISOString(),
        tokens_used: job.tokenCount?.total || 0
      })),
      total: jobs.length
    };
  }
};