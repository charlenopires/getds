/**
 * Task: 65c46ab8 — Aggregate all limitations into a structured warnings array
 * Spec: 21d9e937 — Protected Page Resilience
 */

import { describe, test, expect } from 'bun:test';
import { aggregateLimitations } from './aggregateLimitations.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const shadowLim = {
  layer: 'visual-foundations',
  message: 'Closed shadow DOM on <x-button>',
  element: 'x-button',
};

const cspLim = {
  layer: 'visual-foundations',
  message: 'CSP restriction detected',
  element: 'meta[http-equiv="Content-Security-Policy"]',
};

const crossOriginLim = {
  layer: 'visual-foundations',
  message: 'Cross-origin stylesheet blocked',
  element: 'https://cdn.other.com/style.css',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('aggregateLimitations — structured warnings array assembly', () => {
  test('returns an array', () => {
    expect(Array.isArray(aggregateLimitations({}))).toBe(true);
  });

  test('returns empty array when no limitation sources provided', () => {
    expect(aggregateLimitations({})).toHaveLength(0);
  });

  test('includes shadow DOM limitations', () => {
    const result = aggregateLimitations({ shadow: [shadowLim] });
    expect(result).toContainEqual(shadowLim);
  });

  test('includes CSP limitations', () => {
    const result = aggregateLimitations({ csp: [cspLim] });
    expect(result).toContainEqual(cspLim);
  });

  test('includes cross-origin stylesheet limitations', () => {
    const result = aggregateLimitations({ crossOrigin: [crossOriginLim] });
    expect(result).toContainEqual(crossOriginLim);
  });

  test('merges limitations from all sources into one flat array', () => {
    const result = aggregateLimitations({
      shadow: [shadowLim],
      csp: [cspLim],
      crossOrigin: [crossOriginLim],
    });
    expect(result).toHaveLength(3);
  });

  test('each limitation entry has layer, message, and element fields', () => {
    const result = aggregateLimitations({ shadow: [shadowLim] });
    const [entry] = result;
    expect(entry).toHaveProperty('layer');
    expect(entry).toHaveProperty('message');
    expect(entry).toHaveProperty('element');
  });

  test('handles empty arrays for each source gracefully', () => {
    expect(() => aggregateLimitations({ shadow: [], csp: [], crossOrigin: [] })).not.toThrow();
    expect(aggregateLimitations({ shadow: [], csp: [], crossOrigin: [] })).toHaveLength(0);
  });

  test('handles multiple limitations from same source', () => {
    const result = aggregateLimitations({ shadow: [shadowLim, shadowLim] });
    expect(result).toHaveLength(2);
  });

  test('ignores unknown keys without throwing', () => {
    expect(() => aggregateLimitations({ unknown: [shadowLim] })).not.toThrow();
  });

  test('result is a new array (not a reference to any input)', () => {
    const input = [shadowLim];
    const result = aggregateLimitations({ shadow: input });
    expect(result).not.toBe(input);
  });
});
