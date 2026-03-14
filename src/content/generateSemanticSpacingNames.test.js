/**
 * Tests for assignSemanticNames — semantic spacing name assignment
 */

import { describe, test, expect } from 'bun:test';
import { assignSemanticNames } from './generateSemanticSpacingNames.js';

describe('assignSemanticNames — map spacing scale steps to semantic t-shirt sizes', () => {
  test('returns an empty array for empty input', () => {
    expect(assignSemanticNames([])).toEqual([]);
  });

  test('returns an empty array for null input', () => {
    expect(assignSemanticNames(null)).toEqual([]);
  });

  test('returns an empty array for undefined input', () => {
    expect(assignSemanticNames(undefined)).toEqual([]);
  });

  // --- Single item ---
  test('assigns "md" to a single-item scale', () => {
    const scale = [{ step: 1, px: 16, value: '16px' }];
    const result = assignSemanticNames(scale);
    expect(result).toHaveLength(1);
    expect(result[0].semanticName).toBe('md');
  });

  // --- 3 items ---
  test('assigns sm, md, lg for a 3-item scale', () => {
    const scale = [
      { step: 1, px: 8, value: '8px' },
      { step: 2, px: 16, value: '16px' },
      { step: 3, px: 24, value: '24px' },
    ];
    const result = assignSemanticNames(scale);
    expect(result).toHaveLength(3);
    expect(result[0].semanticName).toBe('sm');
    expect(result[1].semanticName).toBe('md');
    expect(result[2].semanticName).toBe('lg');
  });

  // --- 5 items ---
  test('assigns xs through xl for a 5-item scale', () => {
    const scale = [
      { step: 1, px: 4, value: '4px' },
      { step: 2, px: 8, value: '8px' },
      { step: 3, px: 16, value: '16px' },
      { step: 4, px: 24, value: '24px' },
      { step: 5, px: 32, value: '32px' },
    ];
    const result = assignSemanticNames(scale);
    expect(result).toHaveLength(5);
    expect(result[0].semanticName).toBe('xs');
    expect(result[1].semanticName).toBe('sm');
    expect(result[2].semanticName).toBe('md');
    expect(result[3].semanticName).toBe('lg');
    expect(result[4].semanticName).toBe('xl');
  });

  // --- 9 items (full range) ---
  test('assigns full range 3xs through 3xl for a 9-item scale', () => {
    const scale = [
      { step: 1, px: 2, value: '2px' },
      { step: 2, px: 4, value: '4px' },
      { step: 3, px: 8, value: '8px' },
      { step: 4, px: 12, value: '12px' },
      { step: 5, px: 16, value: '16px' },
      { step: 6, px: 24, value: '24px' },
      { step: 7, px: 32, value: '32px' },
      { step: 8, px: 48, value: '48px' },
      { step: 9, px: 64, value: '64px' },
    ];
    const result = assignSemanticNames(scale);
    expect(result).toHaveLength(9);
    const names = result.map(r => r.semanticName);
    expect(names).toEqual(['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']);
  });

  // --- 12 items (overflow clamps) ---
  test('clamps names for scales longer than 9 items', () => {
    const scale = Array.from({ length: 12 }, (_, i) => ({
      step: i + 1,
      px: (i + 1) * 4,
      value: `${(i + 1) * 4}px`,
    }));
    const result = assignSemanticNames(scale);
    expect(result).toHaveLength(12);
    // First item should clamp to '3xs'
    expect(result[0].semanticName).toBe('3xs');
    // Last item should clamp to '3xl'
    expect(result[11].semanticName).toBe('3xl');
  });

  // --- Mid value gets 'md' ---
  test('the median value always receives "md"', () => {
    const scale = [
      { step: 1, px: 4, value: '4px' },
      { step: 2, px: 8, value: '8px' },
      { step: 3, px: 16, value: '16px' },
      { step: 4, px: 24, value: '24px' },
      { step: 5, px: 32, value: '32px' },
      { step: 6, px: 48, value: '48px' },
      { step: 7, px: 64, value: '64px' },
    ];
    const result = assignSemanticNames(scale);
    // midIndex = floor(7/2) = 3, so index 3 (px: 24) gets 'md'
    const mdEntry = result.find(r => r.semanticName === 'md');
    expect(mdEntry).toBeDefined();
    expect(mdEntry.px).toBe(24);
  });

  // --- Sorting ---
  test('sorts input by px value ascending', () => {
    const scale = [
      { step: 3, px: 32, value: '32px' },
      { step: 1, px: 8, value: '8px' },
      { step: 2, px: 16, value: '16px' },
    ];
    const result = assignSemanticNames(scale);
    expect(result[0].px).toBe(8);
    expect(result[1].px).toBe(16);
    expect(result[2].px).toBe(32);
  });

  // --- Preserves original properties ---
  test('preserves step, px, and value properties in output', () => {
    const scale = [{ step: 2, px: 16, value: '1rem' }];
    const result = assignSemanticNames(scale);
    expect(result[0].step).toBe(2);
    expect(result[0].px).toBe(16);
    expect(result[0].value).toBe('1rem');
    expect(result[0].semanticName).toBe('md');
  });
});
