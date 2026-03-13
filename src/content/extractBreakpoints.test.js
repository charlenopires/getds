/**
 * Task: 99fc545e — Extract breakpoints from @media queries
 * Spec: f87063a1 — Grid and Layout Extraction
 */

import { describe, test, expect } from 'bun:test';
import { extractBreakpointsFromSheets, categorizeBreakpoint } from './extractBreakpoints.js';

// ── categorizeBreakpoint ──────────────────────────────────────────────────────

describe('categorizeBreakpoint — classify breakpoint px value into category', () => {
  test('returns mobile for values <= 767px', () => {
    expect(categorizeBreakpoint(480)).toBe('mobile');
    expect(categorizeBreakpoint(767)).toBe('mobile');
  });

  test('returns tablet for values 768–1023px', () => {
    expect(categorizeBreakpoint(768)).toBe('tablet');
    expect(categorizeBreakpoint(1023)).toBe('tablet');
  });

  test('returns desktop for values 1024–1439px', () => {
    expect(categorizeBreakpoint(1024)).toBe('desktop');
    expect(categorizeBreakpoint(1439)).toBe('desktop');
  });

  test('returns wide for values >= 1440px', () => {
    expect(categorizeBreakpoint(1440)).toBe('wide');
    expect(categorizeBreakpoint(1920)).toBe('wide');
  });
});

// ── extractBreakpointsFromSheets ──────────────────────────────────────────────

function makeSheet(mediaTexts = []) {
  return {
    cssRules: mediaTexts.map(text => ({
      type: CSSRule?.MEDIA_RULE ?? 4,
      conditionText: text,
      cssRules: [],
    })),
  };
}

// Minimal CSSRule constants shim for test environment
if (typeof CSSRule === 'undefined') {
  globalThis.CSSRule = { MEDIA_RULE: 4 };
}

describe('extractBreakpointsFromSheets — extract breakpoints from stylesheet rules', () => {
  test('returns array', () => {
    expect(Array.isArray(extractBreakpointsFromSheets([]))).toBe(true);
  });

  test('returns empty array for no media rules', () => {
    const sheet = makeSheet([]);
    expect(extractBreakpointsFromSheets([sheet])).toHaveLength(0);
  });

  test('extracts min-width breakpoint', () => {
    const sheet = makeSheet(['(min-width: 768px)']);
    const result = extractBreakpointsFromSheets([sheet]);
    expect(result.some(b => b.value === 768)).toBe(true);
  });

  test('extracts max-width breakpoint', () => {
    const sheet = makeSheet(['(max-width: 1023px)']);
    const result = extractBreakpointsFromSheets([sheet]);
    expect(result.some(b => b.value === 1023)).toBe(true);
  });

  test('entry has value, unit, query, and category fields', () => {
    const sheet = makeSheet(['(min-width: 768px)']);
    const [entry] = extractBreakpointsFromSheets([sheet]);
    expect(entry).toHaveProperty('value');
    expect(entry).toHaveProperty('unit');
    expect(entry).toHaveProperty('query');
    expect(entry).toHaveProperty('category');
  });

  test('category is set correctly', () => {
    const sheet = makeSheet(['(min-width: 768px)']);
    const [entry] = extractBreakpointsFromSheets([sheet]);
    expect(entry.category).toBe('tablet');
  });

  test('deduplicates identical breakpoint values', () => {
    const sheet = makeSheet(['(min-width: 768px)', '(min-width: 768px)']);
    const result = extractBreakpointsFromSheets([sheet]);
    expect(result.filter(b => b.value === 768)).toHaveLength(1);
  });

  test('handles em-based breakpoints by recording unit as em', () => {
    const sheet = makeSheet(['(min-width: 48em)']);
    const result = extractBreakpointsFromSheets([sheet]);
    expect(result.some(b => b.unit === 'em')).toBe(true);
  });

  test('skips non-width media queries (e.g. prefers-color-scheme)', () => {
    const sheet = makeSheet(['(prefers-color-scheme: dark)']);
    const result = extractBreakpointsFromSheets([sheet]);
    expect(result).toHaveLength(0);
  });

  test('handles multiple sheets', () => {
    const s1 = makeSheet(['(min-width: 768px)']);
    const s2 = makeSheet(['(min-width: 1024px)']);
    const result = extractBreakpointsFromSheets([s1, s2]);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});
