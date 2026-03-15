import { describe, test, expect } from 'bun:test';
import { extractFontPairings } from './extractFontPairings.js';

describe('extractFontPairings', () => {
  test('returns empty pairing when no typography roles', () => {
    const { fontPairings } = extractFontPairings({}, []);
    expect(fontPairings.pairingType).toBe('single');
    expect(fontPairings.headlineFont).toBeNull();
    expect(fontPairings.bodyFont).toBeNull();
    expect(fontPairings.roleMap).toEqual({});
  });

  test('detects single font pairing', () => {
    const roles = {
      h1: { fontFamily: "'Inter', sans-serif" },
      body: { fontFamily: "'Inter', sans-serif" },
    };
    const { fontPairings } = extractFontPairings(roles, []);
    expect(fontPairings.pairingType).toBe('single');
    expect(fontPairings.headlineFont).toBe('Inter');
    expect(fontPairings.bodyFont).toBe('Inter');
  });

  test('detects dual font pairing', () => {
    const roles = {
      h1: { fontFamily: "'Clash Grotesk', sans-serif" },
      h2: { fontFamily: "'Clash Grotesk', sans-serif" },
      body: { fontFamily: "'Inter', sans-serif" },
    };
    const { fontPairings } = extractFontPairings(roles, []);
    expect(fontPairings.pairingType).toBe('dual');
    expect(fontPairings.headlineFont).toBe('Clash Grotesk');
    expect(fontPairings.bodyFont).toBe('Inter');
  });

  test('detects triple font pairing with accent', () => {
    const roles = {
      h1: { fontFamily: "'Clash Grotesk', sans-serif" },
      h2: { fontFamily: "'Beni', serif" },
      h3: { fontFamily: "'Beni', serif" },
      body: { fontFamily: "'Inter', sans-serif" },
    };
    const { fontPairings } = extractFontPairings(roles, []);
    expect(fontPairings.pairingType).toBe('triple');
    expect(fontPairings.headlineFont).toBe('Clash Grotesk');
    expect(fontPairings.bodyFont).toBe('Inter');
    expect(fontPairings.accentFont).toBe('Beni');
  });

  test('detects code font separately', () => {
    const roles = {
      h1: { fontFamily: "'Inter', sans-serif" },
      body: { fontFamily: "'Inter', sans-serif" },
      code: { fontFamily: "'Fira Code', monospace" },
    };
    const { fontPairings } = extractFontPairings(roles, []);
    expect(fontPairings.codeFont).toBe('Fira Code');
    // Code font should not affect pairing type
    expect(fontPairings.pairingType).toBe('single');
  });

  test('builds complete roleMap', () => {
    const roles = {
      h1: { fontFamily: "'Playfair Display', serif" },
      h2: { fontFamily: "'Playfair Display', serif" },
      body: { fontFamily: "'Open Sans', sans-serif" },
      small: { fontFamily: "'Open Sans', sans-serif" },
    };
    const { fontPairings } = extractFontPairings(roles, []);
    expect(fontPairings.roleMap).toEqual({
      h1: 'Playfair Display',
      h2: 'Playfair Display',
      body: 'Open Sans',
      small: 'Open Sans',
    });
  });

  test('skips roles without fontFamily', () => {
    const roles = {
      h1: { fontSize: '32px' },
      body: { fontFamily: "'Inter', sans-serif" },
    };
    const { fontPairings } = extractFontPairings(roles, []);
    expect(fontPairings.roleMap).toEqual({ body: 'Inter' });
    expect(fontPairings.headlineFont).toBeNull();
  });
});
