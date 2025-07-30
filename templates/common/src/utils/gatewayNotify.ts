/**
 * Gateway notification module for job status updates
 * 
 * This module provides utilities for notifying the Commands.com gateway
 * about job completions and token usage for accurate billing and tracking.
 */

const GATEWAY_URL = process.env.GATEWAY_URL || 'https://api.commands.com';
const GATEWAY_TIMEOUT = 30000; // 30 seconds

export interface GatewayNotification {
  job_id: string;
  status: 'complete' | 'failed';
  tokens_used?: number;
  duration_ms?: number;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Notify the gateway about job completion or failure
 * 
 * @param jobId - The job ID to report on
 * @param jwt - The JWT token from the original request
 * @param notification - The notification details
 */
export async function notifyGateway(
  jobId: string, 
  jwt: string | undefined, 
  notification: Omit<GatewayNotification, 'job_id'>
): Promise<void> {
  if (!jwt) {
    console.log('[gateway] No JWT available for callback, skipping notification');
    return;
  }
  
  // Extract organization and server name
  const organization = process.env.COMMANDS_ORG;
  const serverName = process.env.npm_package_name || process.env.MCP_NAME;
  
  if (!organization || !serverName) {
    console.error('[gateway] Missing configuration: COMMANDS_ORG or server name not set');
    return;
  }
  
  // Construct the callback URL
  const endpoint = `${GATEWAY_URL}/api/${organization}/${serverName}/job-status`;
  
  try {
    console.log(`[gateway] Notifying gateway for job ${jobId} with status: ${notification.status}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GATEWAY_TIMEOUT);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': jwt,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        job_id: jobId,
        ...notification
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      console.error(`[gateway] Notification failed with status ${response.status}: ${errorText}`);
      return;
    }
    
    const result = await response.json();
    console.log(`[gateway] Notification acknowledged for job ${jobId}:`, result);
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`[gateway] Notification timeout for job ${jobId}`);
    } else {
      console.error(`[gateway] Notification error for job ${jobId}:`, error.message);
    }
  }
}

/**
 * Helper function to notify gateway of job completion with token usage
 */
export async function notifyJobComplete(
  jobId: string,
  jwt: string | undefined,
  tokensUsed: number,
  durationMs?: number,
  metadata?: Record<string, any>
): Promise<void> {
  await notifyGateway(jobId, jwt, {
    status: 'complete',
    tokens_used: tokensUsed,
    duration_ms: durationMs,
    metadata
  });
}

/**
 * Helper function to notify gateway of job failure
 */
export async function notifyJobFailed(
  jobId: string,
  jwt: string | undefined,
  error: string,
  metadata?: Record<string, any>
): Promise<void> {
  await notifyGateway(jobId, jwt, {
    status: 'failed',
    error,
    tokens_used: 0, // No tokens consumed on failure
    metadata
  });
}