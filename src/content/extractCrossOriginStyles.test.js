/**
 * Task: 93b27ff3 — Catch SecurityError on cross-origin stylesheet cssRules access
 * Spec: 21d9e937 — Protected Page Resilience
 */

import { describe, test, expect } from 'bun:test';
import { safeGetCssRules } from './extractCrossOriginStyles.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function sheet(rules) {
  return {
    cssRules: rules,
    href: 'https://same-origin.example.com/style.css',
  };
}

function crossOriginSheet() {
  return {
    get cssRules() { throw new DOMException('Blocked', 'SecurityError'); },
    href: 'https://cdn.other-domain.com/style.css',
  };
}

function nonSecurityErrorSheet() {
  return {
    get cssRules() { throw new Error('some other error'); },
    href: 'https://example.com/broken.css',
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('safeGetCssRules — cross-origin stylesheet SecurityError handling', () => {
  test('returns cssRules array for same-origin stylesheet', () => {
    const rules = [{ type: 1 }, { type: 1 }];
    const result = safeGetCssRules(sheet(rules));
    expect(result.rules).toEqual(rules);
  });

  test('returns blocked=false for same-origin stylesheet', () => {
    const result = safeGetCssRules(sheet([]));
    expect(result.blocked).toBe(false);
  });

  test('returns blocked=true when SecurityError is thrown', () => {
    const result = safeGetCssRules(crossOriginSheet());
    expect(result.blocked).toBe(true);
  });

  test('returns empty rules array when SecurityError is thrown', () => {
    const result = safeGetCssRules(crossOriginSheet());
    expect(result.rules).toEqual([]);
  });

  test('includes href in result', () => {
    const result = safeGetCssRules(crossOriginSheet());
    expect(result.href).toBe('https://cdn.other-domain.com/style.css');
  });

  test('includes href for same-origin sheet', () => {
    const s = sheet([]);
    const result = safeGetCssRules(s);
    expect(result.href).toBe('https://same-origin.example.com/style.css');
  });

  test('re-throws non-SecurityError exceptions', () => {
    expect(() => safeGetCssRules(nonSecurityErrorSheet())).toThrow();
  });

  test('handles null href gracefully', () => {
    const s = { cssRules: [], href: null };
    const result = safeGetCssRules(s);
    expect(result.href).toBeNull();
    expect(result.blocked).toBe(false);
  });

  test('result has rules, blocked, and href fields', () => {
    const result = safeGetCssRules(sheet([]));
    expect(result).toHaveProperty('rules');
    expect(result).toHaveProperty('blocked');
    expect(result).toHaveProperty('href');
  });

  test('limitation field is present and describes the constraint when blocked', () => {
    const result = safeGetCssRules(crossOriginSheet());
    expect(result).toHaveProperty('limitation');
    expect(result.limitation.message.toLowerCase()).toContain('cross-origin');
  });

  test('limitation is null when not blocked', () => {
    const result = safeGetCssRules(sheet([]));
    expect(result.limitation).toBeNull();
  });
});
