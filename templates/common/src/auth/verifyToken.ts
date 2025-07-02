import jwt from 'jsonwebtoken';
// @ts-ignore - jwks-client doesn't have type definitions
import jwksClient from 'jwks-client';
import { TokenClaims, MCPError } from '../types';

// JWKS client for Commands.com public keys
const client = jwksClient({
  jwksUri: process.env.COMMANDS_JWKS_URL || 'https://api.commands.com/.well-known/jwks.json',
  cache: true,
  cacheMaxAge: '10m', // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 5
});

/**
 * Verify JWT token from Commands.com API Gateway
 * 
 * @param token - JWT token from Authorization header
 * @returns Decoded and verified token claims
 * @throws MCPError if token is invalid or expired
 */
export async function verifyToken(token: string): Promise<TokenClaims> {
  try {
    // Decode token header to get key ID
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      throw new MCPError('UNAUTHORIZED', 'Invalid token format');
    }

    const { kid } = decoded.header;
    if (!kid) {
      throw new MCPError('UNAUTHORIZED', 'Token missing key ID');
    }

    // Get signing key from JWKS
    const key = await client.getSigningKey(kid);
    const signingKey = key.getPublicKey();

    // Verify token
    const verifyOptions: jwt.VerifyOptions = {
      issuer: process.env.COMMANDS_JWT_ISSUER || 'https://api.commands.com',
      algorithms: ['RS256']
    };
    
    // Only verify audience if explicitly set
    if (process.env.COMMANDS_JWT_AUDIENCE) {
      verifyOptions.audience = process.env.COMMANDS_JWT_AUDIENCE;
    }
    
    const claims = jwt.verify(token, signingKey, verifyOptions) as TokenClaims;

    // Validate required claims
    if (!claims.sub) {
      throw new MCPError('UNAUTHORIZED', 'Token missing subject');
    }

    if (!claims.iss || claims.iss !== (process.env.COMMANDS_JWT_ISSUER || 'https://api.commands.com')) {
      throw new MCPError('UNAUTHORIZED', 'Invalid token issuer');
    }

    // Only validate audience if explicitly configured
    if (process.env.COMMANDS_JWT_AUDIENCE && (!claims.aud || claims.aud !== process.env.COMMANDS_JWT_AUDIENCE)) {
      throw new MCPError('UNAUTHORIZED', 'Invalid token audience');
    }

    // Check expiration (jwt.verify already does this, but double-check)
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp && claims.exp < now) {
      throw new MCPError('UNAUTHORIZED', 'Token expired');
    }

    return claims;

  } catch (error) {
    if (error instanceof MCPError) {
      throw error;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw new MCPError('UNAUTHORIZED', `Invalid token: ${error.message}`);
    }

    if (error instanceof jwt.TokenExpiredError) {
      throw new MCPError('UNAUTHORIZED', 'Token expired');
    }

    if (error instanceof jwt.NotBeforeError) {
      throw new MCPError('UNAUTHORIZED', 'Token not yet valid');
    }

    // JWKS errors
    if (error instanceof Error && error.name === 'JwksError') {
      throw new MCPError('UNAUTHORIZED', `Key verification failed: ${error.message}`);
    }

    console.error('Token verification error:', error);
    throw new MCPError('INTERNAL_ERROR', 'Token verification failed');
  }
}

/**
 * Check if user has required scope
 * 
 * @param user - Token claims
 * @param requiredScope - Required scope string
 * @returns True if user has the scope
 */
export function hasScope(user: TokenClaims, requiredScope: string): boolean {
  if (!user.scp || !Array.isArray(user.scp)) {
    return false;
  }
  
  return user.scp.includes(requiredScope);
}

/**
 * Require specific scope or throw authorization error
 * 
 * @param user - Token claims  
 * @param requiredScope - Required scope string
 * @throws MCPError if user doesn't have the scope
 */
export function requireScope(user: TokenClaims, requiredScope: string): void {
  if (!hasScope(user, requiredScope)) {
    throw new MCPError('FORBIDDEN', `Required scope: ${requiredScope}`);
  }
}