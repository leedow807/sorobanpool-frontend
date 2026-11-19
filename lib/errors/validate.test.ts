import { describe, expect, it } from 'vitest';
import errors from './errors.json';
import en from '../../messages/errors.en.json';
import pcm from '../../messages/errors.pcm.json';

interface ErrorInfo {
  code: number;
  contract: string;
  name: string;
}

describe('contract error message validation', () => {
  const errorsByCode = new Map<number, ErrorInfo>(
    (errors as ErrorInfo[]).map((e) => [e.code, e]),
  );

  const enKeys = Object.keys(en).map(Number);
  const pcmKeys = Object.keys(pcm).map(Number);

  describe('errors.json synced with translations', () => {
    it('every error code in errors.json has English message', () => {
      for (const [code] of errorsByCode) {
        expect(en[String(code)], `English message for error ${code}`).toBeDefined();
        expect(en[String(code)].what).toBeTruthy();
        expect(en[String(code)].todo).toBeTruthy();
      }
    });

    it('every error code in errors.json has Pidgin message', () => {
      for (const [code] of errorsByCode) {
        expect(pcm[String(code)], `Pidgin message for error ${code}`).toBeDefined();
        expect(pcm[String(code)].what).toBeTruthy();
        expect(pcm[String(code)].todo).toBeTruthy();
      }
    });

    it('every English message corresponds to an error code', () => {
      for (const code of enKeys) {
        if (code === 0 || code === undefined) continue;
        expect(errorsByCode.has(code), `Error code ${code} has English message but not in errors.json`).toBe(true);
      }
    });

    it('every Pidgin message corresponds to an error code', () => {
      for (const code of pcmKeys) {
        if (code === 0 || code === undefined) continue;
        expect(errorsByCode.has(code), `Error code ${code} has Pidgin message but not in errors.json`).toBe(true);
      }
    });

    it('English and Pidgin have the same error codes', () => {
      const enCodes = new Set(enKeys.filter((c) => c > 0));
      const pcmCodes = new Set(pcmKeys.filter((c) => c > 0));
      expect(enCodes).toEqual(pcmCodes);
    });
  });

  describe('error code format validation', () => {
    it('all error codes are positive integers', () => {
      for (const code of errorsByCode.keys()) {
        expect(Number.isInteger(code)).toBe(true);
        expect(code).toBeGreaterThan(0);
      }
    });

    it('error codes follow contract grouping (by hundreds)', () => {
      const codesByContract = new Map<string, number[]>();
      for (const [code, info] of errorsByCode) {
        if (!codesByContract.has(info.contract)) {
          codesByContract.set(info.contract, []);
        }
        codesByContract.get(info.contract)!.push(code);
      }

      for (const [contract, codes] of codesByContract) {
        for (const code of codes) {
          const hundreds = Math.floor(code / 100) * 100;
          const expectedContract = {
            100: 'config',
            200: 'registry',
            300: 'group_buy',
            400: 'disputes',
            500: 'supplier_bond',
            600: 'reputation',
            700: 'smart_wallet',
          }[hundreds];
          expect(contract).toBe(expectedContract, `Error ${code} should belong to contract ${expectedContract}`);
        }
      }
    });

    it('no duplicate error codes exist', () => {
      const codes = Array.from(errorsByCode.keys());
      const unique = new Set(codes);
      expect(unique.size).toBe(codes.length);
    });
  });

  describe('error name validation', () => {
    it('all error names are non-empty strings', () => {
      for (const [code, info] of errorsByCode) {
        expect(typeof info.name).toBe('string');
        expect(info.name.length).toBeGreaterThan(0);
      }
    });

    it('no duplicate error names within a contract', () => {
      const namesByContract = new Map<string, string[]>();
      for (const [, info] of errorsByCode) {
        if (!namesByContract.has(info.contract)) {
          namesByContract.set(info.contract, []);
        }
        namesByContract.get(info.contract)!.push(info.name);
      }

      for (const [contract, names] of namesByContract) {
        const unique = new Set(names);
        expect(unique.size).toBe(names.length, `Duplicate error names in contract ${contract}`);
      }
    });
  });
});
