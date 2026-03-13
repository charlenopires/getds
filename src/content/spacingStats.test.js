/**
 * Task: a24198a5 — Report spacing frequency distribution
 * Spec: 29ea3708 — Spacing System Extraction
 */

import { describe, test, expect } from 'bun:test';
import { computeSpacingStats } from './spacingStats.js';

describe('computeSpacingStats — spacing frequency distribution', () => {
  test('returns an object with expected top-level fields', () => {
    const result = computeSpacingStats([], { baseUnit: 8 });
    expect(result).toHaveProperty('totalUnique');
    expect(result).toHaveProperty('topValues');
    expect(result).toHaveProperty('distributionByProperty');
  });

  test('totalUnique is the count of distinct px values', () => {
    const values = [
      { px: 8,  value: '8px',  properties: ['padding-top'] },
      { px: 16, value: '16px', properties: ['margin-top'] },
      { px: 8,  value: '8px',  properties: ['padding-bottom'] },
    ];
    const { totalUnique } = computeSpacingStats(values, { baseUnit: 8 });
    expect(totalUnique).toBe(2);
  });

  test('topValues is an array', () => {
    const { topValues } = computeSpacingStats([], { baseUnit: 8 });
    expect(Array.isArray(topValues)).toBe(true);
  });

  test('topValues entries have value, px, and count fields', () => {
    const values = [
      { px: 8, value: '8px', properties: ['padding-top'] },
    ];
    const { topValues } = computeSpacingStats(values, { baseUnit: 8 });
    expect(topValues[0]).toHaveProperty('value');
    expect(topValues[0]).toHaveProperty('px');
    expect(topValues[0]).toHaveProperty('count');
  });

  test('topValues sorted descending by count', () => {
    const values = [
      { px: 8,  value: '8px',  properties: ['padding-top'] },
      { px: 8,  value: '8px',  properties: ['padding-bottom'] },
      { px: 16, value: '16px', properties: ['margin-top'] },
    ];
    const { topValues } = computeSpacingStats(values, { baseUnit: 8 });
    expect(topValues[0].px).toBe(8);
    expect(topValues[0].count).toBe(2);
  });

  test('topValues limited to top 10', () => {
    const values = Array.from({ length: 15 }, (_, i) => ({
      px: (i + 1) * 4,
      value: `${(i + 1) * 4}px`,
      properties: ['gap'],
    }));
    const { topValues } = computeSpacingStats(values, { baseUnit: 4 });
    expect(topValues.length).toBeLessThanOrEqual(10);
  });

  test('distributionByProperty maps property names to counts', () => {
    const values = [
      { px: 8,  value: '8px',  properties: ['padding-top', 'padding-bottom'] },
      { px: 16, value: '16px', properties: ['margin-top'] },
    ];
    const { distributionByProperty } = computeSpacingStats(values, { baseUnit: 8 });
    expect(distributionByProperty['padding-top']).toBe(1);
    expect(distributionByProperty['padding-bottom']).toBe(1);
    expect(distributionByProperty['margin-top']).toBe(1);
  });

  test('returns zero totalUnique for empty input', () => {
    expect(computeSpacingStats([], { baseUnit: 8 }).totalUnique).toBe(0);
  });

  test('ignores null px entries in totalUnique', () => {
    const values = [
      { px: null, value: 'auto', properties: ['margin-top'] },
      { px: 8,    value: '8px',  properties: ['padding-top'] },
    ];
    expect(computeSpacingStats(values, { baseUnit: 8 }).totalUnique).toBe(1);
  });

  test('count reflects property occurrences not unique values', () => {
    // The same 8px appears 3 times across different properties
    const values = [
      { px: 8, value: '8px', properties: ['padding-top'] },
      { px: 8, value: '8px', properties: ['padding-bottom'] },
      { px: 8, value: '8px', properties: ['gap'] },
    ];
    const { topValues } = computeSpacingStats(values, { baseUnit: 8 });
    expect(topValues[0].count).toBe(3);
  });
});
