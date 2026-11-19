# Mock API Server for Local Frontend Development

A lightweight mock API server for developing and testing the SorobanPool frontend without needing the backend running.

## Usage

### Quick Start

1. **Start the mock server:**
   ```bash
   npm run mock:server
   # or
   pnpm mock:server
   ```
   The server will start on `http://localhost:3001`

2. **Configure the frontend:**
   Set the API URL to point to the mock server:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev
   ```

### Supported Routes

The mock server implements the following API endpoints:

#### Authentication
- `POST /v1/auth/refresh` - Refresh access token
- `POST /v1/auth/passkey/register/options` - Get WebAuthn registration challenge
- `POST /v1/auth/passkey/register/verify` - Verify passkey registration
- `POST /v1/auth/passkey/login/options` - Get WebAuthn authentication challenge
- `POST /v1/auth/passkey/login/verify` - Verify passkey authentication

#### Wallet
- `POST /v1/wallets/passkey` - Create a passkey-controlled wallet

#### Passkey Management
- `GET /v1/auth/passkey` - List user's passkeys
- `DELETE /v1/auth/passkey/:id` - Remove a passkey

## Development

### Adding New Routes

Edit `mock-server/server.ts` and add your route handler in the `handleRequest` function:

```typescript
if (route === '/your/route' && method === 'POST') {
  sendJson(res, 200, { data: 'your response' });
  return;
}
```

### Response Format

- **Success:** `{ "data": ... }`
- **Error:** `{ "error": "error code", "message": "error message", "contractCode": 309 }`
- **Contract Errors:** Include `contractCode` to match contract error codes from `lib/errors/errors.json`

### CORS

The mock server includes CORS headers allowing requests from any origin, suitable for local development.

## Notes

- Mock data is stored in memory and lost on server restart
- The relying party ID is set to `localhost` by default
- Generated tokens are mock values and do not validate cryptographically
- For end-to-end testing, use Playwright with the mock server
