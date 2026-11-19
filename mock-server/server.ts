/**
 * Mock API server for local frontend development without needing the backend running.
 * Run with: `npx tsx mock-server/server.ts`
 * Or add to package.json scripts: `"mock:server": "tsx mock-server/server.ts"`
 *
 * Access at http://localhost:3001/v1/* (matches NEXT_PUBLIC_API_URL=http://localhost:3001)
 */

import http from 'http';
import type { IncomingMessage, ServerResponse } from 'http';

const PORT = 3001;
const API_PREFIX = '/v1';

interface RequestContext {
  method: string;
  path: string;
  body: Record<string, unknown>;
}

function parseBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function sendError(res: ServerResponse, status: number, error: string, contractCode?: number): void {
  const response: Record<string, unknown> = { error, message: error };
  if (contractCode !== undefined) response.contractCode = contractCode;
  sendJson(res, status, response);
}

/** Mock data storage (would be persistent in real server) */
const mockData = {
  users: new Map<string, { walletAddress: string; passkeys: string[] }>(),
  refreshTokens: new Map<string, { accessToken: string; expiresAt: number }>(),
  passkeyIds: new Set<string>(),
};

/** Generate mock access token */
function generateAccessToken(): string {
  return `mock_access_${Math.random().toString(36).slice(2)}`;
}

/** Generate mock refresh token */
function generateRefreshToken(): string {
  return `mock_refresh_${Math.random().toString(36).slice(2)}`;
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  const url = new URL(req.url || '', `http://localhost:${PORT}`);
  const path = url.pathname;

  if (!path.startsWith(API_PREFIX)) {
    sendError(res, 404, 'Not found');
    return;
  }

  const route = path.slice(API_PREFIX.length);
  const method = req.method || 'GET';
  const body = method === 'GET' ? {} : await parseBody(req);

  // Mock routes
  if (route === '/auth/refresh' && method === 'POST') {
    const refreshToken = (body.refreshToken as string) || '';
    const tokenData = mockData.refreshTokens.get(refreshToken);
    if (!tokenData || tokenData.expiresAt < Date.now()) {
      sendError(res, 401, 'Invalid refresh token');
      return;
    }
    const newAccessToken = generateAccessToken();
    const newRefreshToken = generateRefreshToken();
    mockData.refreshTokens.set(newRefreshToken, { accessToken: newAccessToken, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });
    sendJson(res, 200, { accessToken: newAccessToken, refreshToken: newRefreshToken });
    return;
  }

  if (route === '/auth/passkey/register/options' && method === 'POST') {
    sendJson(res, 200, {
      challengeId: `challenge_${Date.now()}`,
      options: {
        challenge: 'dGVzdGNoYWxsZW5nZQ==',
        rp: { name: 'SorobanPool', id: 'localhost' },
        user: {
          id: 'user_123',
          name: 'user@example.com',
          displayName: 'Mock User',
        },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        timeout: 60000,
        attestation: 'none',
      },
    });
    return;
  }

  if (route === '/auth/passkey/register/verify' && method === 'POST') {
    const { challengeId } = body as { challengeId?: string };
    if (!challengeId) {
      sendError(res, 400, 'Missing challengeId');
      return;
    }
    const passkeyId = `passkey_${Date.now()}`;
    mockData.passkeyIds.add(passkeyId);
    sendJson(res, 200, { passkeyId });
    return;
  }

  if (route === '/auth/passkey/login/options' && method === 'POST') {
    sendJson(res, 200, {
      challengeId: `challenge_${Date.now()}`,
      options: {
        challenge: 'dGVzdGNoYWxsZW5nZQ==',
        rp: { id: 'localhost' },
        timeout: 60000,
        userVerification: 'preferred',
      },
    });
    return;
  }

  if (route === '/auth/passkey/login/verify' && method === 'POST') {
    const { challengeId } = body as { challengeId?: string };
    if (!challengeId) {
      sendError(res, 400, 'Missing challengeId');
      return;
    }
    const accessToken = generateAccessToken();
    const refreshToken = generateRefreshToken();
    mockData.refreshTokens.set(refreshToken, { accessToken, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });
    sendJson(res, 200, {
      accessToken,
      refreshToken,
      user: { walletAddress: `G${Math.random().toString(36).slice(2).toUpperCase().padEnd(55, 'A')}` },
    });
    return;
  }

  if (route === '/wallets/passkey' && method === 'POST') {
    const walletAddress = `G${Math.random().toString(36).slice(2).toUpperCase().padEnd(55, 'A')}`;
    sendJson(res, 200, { walletAddress });
    return;
  }

  if (route === '/auth/passkey' && method === 'GET') {
    const passkeys = Array.from(mockData.passkeyIds).map((id) => ({
      id,
      createdAt: new Date().toISOString(),
    }));
    sendJson(res, 200, passkeys);
    return;
  }

  if (route.match(/^\/auth\/passkey\/[^/]+$/) && method === 'DELETE') {
    sendJson(res, 204, null);
    return;
  }

  // Default 404
  sendError(res, 404, 'Route not found');
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    console.error('Request handler error:', error);
    sendError(res, 500, 'Internal server error');
  });
});

server.listen(PORT, 'localhost', () => {
  console.log(`Mock API server running at http://localhost:${PORT}`);
  console.log(`Use NEXT_PUBLIC_API_URL=http://localhost:${PORT} with the frontend`);
  console.log('\nSupported routes:');
  console.log('  POST /v1/auth/refresh');
  console.log('  POST /v1/auth/passkey/register/options');
  console.log('  POST /v1/auth/passkey/register/verify');
  console.log('  POST /v1/auth/passkey/login/options');
  console.log('  POST /v1/auth/passkey/login/verify');
  console.log('  POST /v1/wallets/passkey');
  console.log('  GET  /v1/auth/passkey');
  console.log('  DELETE /v1/auth/passkey/:id');
});

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\nShutting down mock API server...');
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
});
