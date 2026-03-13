/**
 * Task: a659bd98 — Detect CSP restrictions that block script execution
 * Spec: 21d9e937 — Protected Page Resilience
 */

import { describe, test, expect } from 'bun:test';
import { detectCspLimitations } from './detectCspLimitations.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function meta(content) {
  return { getAttribute: (attr) => attr === 'content' ? content : null };
}

function makeDoc(opts = {}) {
  const metas = opts.metas ?? [];
  return {
    querySelector: (sel) => {
      if (sel === 'meta[http-equiv="Content-Security-Policy"]') {
        return metas.find(m => m) ?? null;
      }
      return null;
    },
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('detectCspLimitations — CSP restriction detection', () => {
  test('returns array', () => {
    expect(Array.isArray(detectCspLimitations(makeDoc()))).toBe(true);
  });

  test('returns empty array when no CSP meta tag present', () => {
    expect(detectCspLimitations(makeDoc())).toHaveLength(0);
  });

  test('returns empty array when CSP allows unsafe-inline scripts', () => {
    const doc = makeDoc({
      metas: [meta("script-src 'self' 'unsafe-inline'")],
    });
    expect(detectCspLimitations(doc)).toHaveLength(0);
  });

  test('detects restrictive script-src that blocks inline execution', () => {
    const doc = makeDoc({
      metas: [meta("script-src 'self'")],
    });
    expect(detectCspLimitations(doc)).toHaveLength(1);
  });

  test('limitation entry has layer, message, and element fields', () => {
    const doc = makeDoc({ metas: [meta("script-src 'none'")] });
    const [lim] = detectCspLimitations(doc);
    expect(lim).toHaveProperty('layer');
    expect(lim).toHaveProperty('message');
    expect(lim).toHaveProperty('element');
  });

  test('limitation message mentions CSP', () => {
    const doc = makeDoc({ metas: [meta("default-src 'none'")] });
    const [lim] = detectCspLimitations(doc);
    expect(lim.message.toLowerCase()).toContain('csp');
  });

  test('detects default-src none as restrictive', () => {
    const doc = makeDoc({ metas: [meta("default-src 'none'")] });
    expect(detectCspLimitations(doc)).toHaveLength(1);
  });

  test('layer is a known extraction layer string', () => {
    const doc = makeDoc({ metas: [meta("script-src 'self'")] });
    const [lim] = detectCspLimitations(doc);
    const known = [
      'visual-foundations', 'tokens', 'components',
      'layout-patterns', 'animations', 'iconography', 'accessibility',
    ];
    expect(known).toContain(lim.layer);
  });

  test('element field identifies the restriction source', () => {
    const doc = makeDoc({ metas: [meta("script-src 'self'")] });
    const [lim] = detectCspLimitations(doc);
    expect(typeof lim.element).toBe('string');
    expect(lim.element.length).toBeGreaterThan(0);
  });

  test('accepts explicit document argument', () => {
    const doc = makeDoc();
    expect(() => detectCspLimitations(doc)).not.toThrow();
  });
});
