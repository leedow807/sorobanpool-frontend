/**
 * Relying party identifier for WebAuthn passkey registration and authentication.
 * Must match the domain serving the page according to the WebAuthn spec.
 * Different per environment (localhost, staging, production).
 */

export function getRelyingPartyId(): string {
  // In browser, derive from the current hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Strip port for localhost testing
    return hostname === 'localhost' ? 'localhost' : hostname;
  }
  // During server-side operations, derive from environment or config
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  return new URL(url).hostname;
}

/**
 * Validates that the relying party ID in WebAuthn options matches the current environment.
 * This ensures the passkey challenge is for the correct domain.
 */
export function validateRelyingPartyId(options: { rp?: { id?: string; name?: string } }): boolean {
  if (!options.rp?.id) {
    return false;
  }
  const expected = getRelyingPartyId();
  const actual = options.rp.id;
  return actual === expected;
}
