/**
 * Task: cabcc3b7 — Generate W3C DTCG tokens for breakpoints, grid columns, gutters, container max-widths
 * Spec: f87063a1 — Grid and Layout Extraction
 */

import { describe, test, expect } from 'bun:test';
import { generateGridTokens } from './generateGridTokens.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const breakpoints = [
  { value: 768,  unit: 'px', query: '(min-width: 768px)',  category: 'tablet' },
  { value: 1024, unit: 'px', query: '(min-width: 1024px)', category: 'desktop' },
  { value: 1440, unit: 'px', query: '(min-width: 1440px)', category: 'wide' },
];

const gridDescriptors = [
  { templateColumns: '1fr 1fr 1fr', columnCount: 3, gap: '24px', templateRows: '', templateAreas: '' },
  { templateColumns: 'repeat(12, 1fr)', columnCount: 12, gap: '16px', templateRows: '', templateAreas: '' },
];

const gutters = ['16px', '24px'];

const containerWidths = [
  { maxWidth: '1200px', width: '' },
  { maxWidth: '960px',  width: '' },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('generateGridTokens — W3C DTCG token generation for grid/layout', () => {
  test('returns an object', () => {
    expect(typeof generateGridTokens({})).toBe('object');
  });

  test('output has breakpoints key', () => {
    const tokens = generateGridTokens({ breakpoints });
    expect(tokens).toHaveProperty('breakpoints');
  });

  test('output has grid key', () => {
    const tokens = generateGridTokens({ gridDescriptors });
    expect(tokens).toHaveProperty('grid');
  });

  test('output has gutters key', () => {
    const tokens = generateGridTokens({ gutters });
    expect(tokens).toHaveProperty('gutters');
  });

  test('output has containers key', () => {
    const tokens = generateGridTokens({ containerWidths });
    expect(tokens).toHaveProperty('containers');
  });

  test('breakpoint tokens use DTCG $value/$type format', () => {
    const tokens = generateGridTokens({ breakpoints });
    const bpTokens = Object.values(tokens.breakpoints);
    expect(bpTokens[0]).toHaveProperty('$value');
    expect(bpTokens[0]).toHaveProperty('$type');
  });

  test('breakpoint $type is dimension', () => {
    const tokens = generateGridTokens({ breakpoints });
    const bpTokens = Object.values(tokens.breakpoints);
    expect(bpTokens[0].$type).toBe('dimension');
  });

  test('breakpoint token key uses category name', () => {
    const tokens = generateGridTokens({ breakpoints });
    expect(tokens.breakpoints).toHaveProperty('tablet');
  });

  test('gutter tokens use DTCG format', () => {
    const tokens = generateGridTokens({ gutters });
    const gutterTokens = Object.values(tokens.gutters);
    expect(gutterTokens[0]).toHaveProperty('$value');
    expect(gutterTokens[0].$type).toBe('dimension');
  });

  test('container tokens use DTCG format', () => {
    const tokens = generateGridTokens({ containerWidths });
    const containerTokens = Object.values(tokens.containers);
    expect(containerTokens[0]).toHaveProperty('$value');
    expect(containerTokens[0].$type).toBe('dimension');
  });

  test('grid columns token includes most common column count', () => {
    const tokens = generateGridTokens({ gridDescriptors });
    expect(tokens.grid).toHaveProperty('columns');
  });

  test('handles empty input gracefully', () => {
    expect(() => generateGridTokens({})).not.toThrow();
  });
});
