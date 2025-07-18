import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';

// JWT payload interface
export interface JWTPayload {
  sub: string;
  email?: string;
  scope?: string;
  iss?: string;
  aud?: string;
  exp?: number;
  iat?: number;
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// Initialize JWKS client
let jwksClient: jwksRsa.JwksClient;

function initializeJwksClient() {
  if (!jwksClient) {
    jwksClient = jwksRsa({
      jwksUri: process.env.COMMANDS_JWKS_URL || 'https://api.commands.com/.well-known/jwks.json',
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5
    });
  }
  return jwksClient;
}

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  const client = initializeJwksClient();
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key?.getPublicKey();
    callback(err, signingKey);
  });
}

export function verifyJwt(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    res.status(401).json({
      jsonrpc: '2.0',
      error: {
        code: -32600,
        message: 'Authorization header with Bearer token required'
      },
      id: null
    });
    return;
  }

  jwt.verify(
    token,
    getKey,
    {
      algorithms: ['RS256'],
      issuer: process.env.COMMANDS_JWT_ISSUER || 'https://api.commands.com',
      audience: process.env.COMMANDS_JWT_AUDIENCE
    },
    (err, decoded) => {
      if (err) {
        // Only log JWT errors in development
        if (process.env.NODE_ENV === 'development') {
          console.error('JWT verification failed:', err.message);
        }
        res.status(401).json({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Invalid or expired token'
          },
          id: null
        });
        return;
      }

      req.user = decoded as JWTPayload;
      next();
    }
  );
}

export function requireScope(requiredScope: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user?.scope) {
      res.status(403).json({
        jsonrpc: '2.0',
        error: {
          code: -32600,
          message: 'No scopes present in token'
        },
        id: null
      });
      return;
    }

    const scopes = req.user.scope.split(' ');
    if (!scopes.includes(requiredScope)) {
      res.status(403).json({
        jsonrpc: '2.0',
        error: {
          code: -32600,
          message: `Required scope '${requiredScope}' not granted`
        },
        id: null
      });
      return;
    }

    next();
  };
}