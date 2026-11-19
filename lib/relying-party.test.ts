import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { getRelyingPartyId, validateRelyingPartyId } from './relying-party';

describe('relying party ID handling per environment', () => {
  const originalLocation = globalThis.window?.location;
  const originalEnv = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    delete (globalThis as any).window;
  });

  afterEach(() => {
    if (originalLocation) {
      (globalThis as any).window = { location: originalLocation };
    }
    process.env.NEXT_PUBLIC_API_URL = originalEnv;
  });

  describe('getRelyingPartyId', () => {
    it('returns localhost for local development', () => {
      (globalThis as any).window = {
        location: { hostname: 'localhost' },
      };
      expect(getRelyingPartyId()).toBe('localhost');
    });

    it('returns staging hostname for staging environment', () => {
      (globalThis as any).window = {
        location: { hostname: 'staging.example.com' },
      };
      expect(getRelyingPartyId()).toBe('staging.example.com');
    });

    it('returns production hostname for production environment', () => {
      (globalThis as any).window = {
        location: { hostname: 'app.sorobanpool.com' },
      };
      expect(getRelyingPartyId()).toBe('app.sorobanpool.com');
    });

    it('handles subdomains correctly', () => {
      (globalThis as any).window = {
        location: { hostname: 'api.staging.example.com' },
      };
      expect(getRelyingPartyId()).toBe('api.staging.example.com');
    });

    it('derives from API URL on server side', () => {
      delete (globalThis as any).window;
      process.env.NEXT_PUBLIC_API_URL = 'https://api.staging.example.com';
      expect(getRelyingPartyId()).toBe('api.staging.example.com');
    });

    it('defaults to localhost when no API URL is configured', () => {
      delete (globalThis as any).window;
      delete process.env.NEXT_PUBLIC_API_URL;
      expect(getRelyingPartyId()).toBe('localhost');
    });
  });

  describe('validateRelyingPartyId', () => {
    it('accepts matching relying party ID', () => {
      (globalThis as any).window = {
        location: { hostname: 'localhost' },
      };
      const options = {
        rp: { id: 'localhost', name: 'SorobanPool' },
      };
      expect(validateRelyingPartyId(options)).toBe(true);
    });

    it('rejects mismatched relying party ID', () => {
      (globalThis as any).window = {
        location: { hostname: 'localhost' },
      };
      const options = {
        rp: { id: 'example.com', name: 'SorobanPool' },
      };
      expect(validateRelyingPartyId(options)).toBe(false);
    });

    it('rejects missing relying party ID', () => {
      (globalThis as any).window = {
        location: { hostname: 'localhost' },
      };
      const options = { rp: { name: 'SorobanPool' } };
      expect(validateRelyingPartyId(options)).toBe(false);
    });

    it('rejects missing rp object', () => {
      (globalThis as any).window = {
        location: { hostname: 'localhost' },
      };
      const options = {};
      expect(validateRelyingPartyId(options)).toBe(false);
    });

    it('validates across different environments', () => {
      const testCases = [
        { hostname: 'localhost', rpId: 'localhost', expected: true },
        { hostname: 'staging.example.com', rpId: 'staging.example.com', expected: true },
        { hostname: 'app.sorobanpool.com', rpId: 'app.sorobanpool.com', expected: true },
        { hostname: 'localhost', rpId: 'staging.example.com', expected: false },
        { hostname: 'staging.example.com', rpId: 'localhost', expected: false },
      ];

      for (const { hostname, rpId, expected } of testCases) {
        (globalThis as any).window = { location: { hostname } };
        const options = { rp: { id: rpId } };
        expect(validateRelyingPartyId(options)).toBe(
          expected,
          `hostname: ${hostname}, rpId: ${rpId}`,
        );
      }
    });
  });
});
