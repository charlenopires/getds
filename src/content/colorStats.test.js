/**
 * Task: ffb4e943 — Report color stats: unique count, top-10 most-used, distribution by property type
 * Spec: fff645a0 — Color System Extraction
 */

import { describe, test, expect } from 'bun:test';
import { computeColorStats } from './colorStats.js';

/** Build a color usage entry as the extraction pipeline produces */
function color(raw, property, count = 1, hex = '#000000') {
  return { raw, property, count, hex };
}

describe('computeColorStats — color usage statistics', () => {
  test('returns an object with totalUnique, topColors, and distributionByProperty', () => {
    const result = computeColorStats([]);
    expect(result).toHaveProperty('totalUnique');
    expect(result).toHaveProperty('topColors');
    expect(result).toHaveProperty('distributionByProperty');
  });

  test('totalUnique equals the number of distinct color entries', () => {
    const colors = [
      color('rgb(1,1,1)', 'color', 5),
      color('rgb(2,2,2)', 'background-color', 3),
      color('rgb(3,3,3)', 'border-color', 1),
    ];
    const result = computeColorStats(colors);
    expect(result.totalUnique).toBe(3);
  });

  test('totalUnique is 0 for empty input', () => {
    expect(computeColorStats([]).totalUnique).toBe(0);
  });

  test('topColors is an array', () => {
    const result = computeColorStats([color('rgb(1,1,1)', 'color', 10)]);
    expect(Array.isArray(result.topColors)).toBe(true);
  });

  test('topColors is sorted descending by count', () => {
    const colors = [
      color('rgb(1,1,1)', 'color', 1),
      color('rgb(2,2,2)', 'color', 10),
      color('rgb(3,3,3)', 'color', 5),
    ];
    const result = computeColorStats(colors);
    const counts = result.topColors.map(c => c.count);
    expect(counts[0]).toBeGreaterThanOrEqual(counts[1]);
    expect(counts[1]).toBeGreaterThanOrEqual(counts[2]);
  });

  test('topColors contains at most 10 entries', () => {
    const colors = Array.from({ length: 15 }, (_, i) =>
      color(`rgb(${i},0,0)`, 'color', 15 - i)
    );
    const result = computeColorStats(colors);
    expect(result.topColors.length).toBeLessThanOrEqual(10);
  });

  test('topColors entries have raw, count, and hex fields', () => {
    const colors = [color('rgb(255,0,0)', 'color', 7, '#ff0000')];
    const result = computeColorStats(colors);
    const entry = result.topColors[0];
    expect(entry).toHaveProperty('raw');
    expect(entry).toHaveProperty('count');
    expect(entry).toHaveProperty('hex');
  });

  test('topColors contains exactly the colors with highest counts', () => {
    const colors = [
      color('rgb(1,0,0)', 'color', 100),
      color('rgb(2,0,0)', 'color', 50),
      color('rgb(3,0,0)', 'color', 10),
    ];
    const result = computeColorStats(colors);
    expect(result.topColors[0].raw).toBe('rgb(1,0,0)');
    expect(result.topColors[1].raw).toBe('rgb(2,0,0)');
    expect(result.topColors[2].raw).toBe('rgb(3,0,0)');
  });

  test('distributionByProperty is an object', () => {
    const result = computeColorStats([color('rgb(1,1,1)', 'color', 5)]);
    expect(typeof result.distributionByProperty).toBe('object');
  });

  test('distributionByProperty keys are property names', () => {
    const colors = [
      color('rgb(1,1,1)', 'color', 5),
      color('rgb(2,2,2)', 'background-color', 3),
    ];
    const result = computeColorStats(colors);
    expect(result.distributionByProperty).toHaveProperty('color');
    expect(result.distributionByProperty).toHaveProperty('background-color');
  });

  test('distributionByProperty value is count of unique colors for that property', () => {
    const colors = [
      color('rgb(1,1,1)', 'color', 5),
      color('rgb(2,2,2)', 'color', 3),
      color('rgb(3,3,3)', 'background-color', 10),
    ];
    const result = computeColorStats(colors);
    expect(result.distributionByProperty['color']).toBe(2);
    expect(result.distributionByProperty['background-color']).toBe(1);
  });

  test('handles a single color correctly', () => {
    const result = computeColorStats([color('rgb(0,0,0)', 'color', 1, '#000000')]);
    expect(result.totalUnique).toBe(1);
    expect(result.topColors).toHaveLength(1);
    expect(result.distributionByProperty['color']).toBe(1);
  });

  test('topColors count defaults to 1 when count field is absent', () => {
    const result = computeColorStats([{ raw: 'rgb(1,2,3)', property: 'color', hex: '#010203' }]);
    expect(result.topColors[0].count).toBe(1);
  });
});
