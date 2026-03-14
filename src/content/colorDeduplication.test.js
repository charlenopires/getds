import { describe, test, expect } from 'bun:test';
import {
  hexToRgb,
  srgbToLinear,
  rgbToLab,
  deltaE76,
  deduplicateColors,
  filterNoiseColors,
} from './colorDeduplication.js';

describe('hexToRgb', () => {
  test('parses 6-digit hex', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });
  test('parses 3-digit hex', () => {
    expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 });
  });
  test('parses without hash', () => {
    expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
  });
});

describe('srgbToLinear', () => {
  test('linearizes 0 to 0', () => {
    expect(srgbToLinear(0)).toBe(0);
  });
  test('linearizes 255 to 1', () => {
    expect(srgbToLinear(255)).toBeCloseTo(1, 4);
  });
  test('linearizes mid-range value', () => {
    expect(srgbToLinear(128)).toBeCloseTo(0.2158, 3);
  });
});

describe('rgbToLab', () => {
  test('converts white', () => {
    const lab = rgbToLab(255, 255, 255);
    expect(lab.L).toBeCloseTo(100, 0);
    expect(lab.a).toBeCloseTo(0, 0);
    expect(lab.b).toBeCloseTo(0, 0);
  });
  test('converts black', () => {
    const lab = rgbToLab(0, 0, 0);
    expect(lab.L).toBeCloseTo(0, 0);
  });
  test('converts pure red', () => {
    const lab = rgbToLab(255, 0, 0);
    expect(lab.L).toBeCloseTo(53.2, 0);
    expect(lab.a).toBeGreaterThan(50);
  });
});

describe('deltaE76', () => {
  test('same color returns 0', () => {
    const lab = rgbToLab(128, 128, 128);
    expect(deltaE76(lab, lab)).toBe(0);
  });
  test('similar colors return small delta', () => {
    const lab1 = rgbToLab(100, 100, 100);
    const lab2 = rgbToLab(105, 100, 100);
    expect(deltaE76(lab1, lab2)).toBeLessThan(5);
  });
  test('black vs white returns large delta', () => {
    const lab1 = rgbToLab(0, 0, 0);
    const lab2 = rgbToLab(255, 255, 255);
    expect(deltaE76(lab1, lab2)).toBeGreaterThan(90);
  });
});

describe('deduplicateColors', () => {
  test('merges perceptually similar colors', () => {
    const colors = [
      { hex: '#ff0000', count: 10 },
      { hex: '#fe0101', count: 5 },
      { hex: '#0000ff', count: 8 },
    ];
    const result = deduplicateColors(colors, 15);
    expect(result.length).toBe(2);
    const red = result.find((c) => c.hex === '#ff0000');
    expect(red.count).toBe(15);
    expect(red.mergedFrom).toBe(1);
  });
  test('keeps distinct colors separate', () => {
    const colors = [
      { hex: '#ff0000', count: 5 },
      { hex: '#00ff00', count: 5 },
      { hex: '#0000ff', count: 5 },
    ];
    const result = deduplicateColors(colors, 15);
    expect(result.length).toBe(3);
  });
  test('returns empty for empty input', () => {
    expect(deduplicateColors([])).toEqual([]);
    expect(deduplicateColors(null)).toEqual([]);
  });
});

describe('filterNoiseColors', () => {
  test('removes colors below minCount', () => {
    const colors = [
      { hex: '#ff0000', count: 10 },
      { hex: '#00ff00', count: 2 },
      { hex: '#0000ff', count: 1 },
    ];
    const result = filterNoiseColors(colors, 3);
    expect(result.length).toBe(1);
    expect(result[0].hex).toBe('#ff0000');
  });
  test('returns empty for empty input', () => {
    expect(filterNoiseColors([])).toEqual([]);
  });
});
