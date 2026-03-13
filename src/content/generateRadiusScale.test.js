/**
 * Task: fd1f7071 — Generate border-radius scale (none, xs, sm, md, lg, xl, full)
 * Spec: 7c17b9ef — Elevation and Border Radius Extraction
 */

import { describe, test, expect } from 'bun:test';
import { generateRadiusScale } from './generateRadiusScale.js';

describe('generateRadiusScale — map border-radius values to a named scale', () => {
  test('returns an object with a scale array', () => {
    const result = generateRadiusScale([]);
    expect(result).toHaveProperty('scale');
    expect(Array.isArray(result.scale)).toBe(true);
  });

  test('each entry has name, value, and px fields', () => {
    const radii = [{ value: '4px' }];
    const { scale } = generateRadiusScale(radii);
    expect(scale[0]).toHaveProperty('name');
    expect(scale[0]).toHaveProperty('value');
    expect(scale[0]).toHaveProperty('px');
  });

  test('scale is sorted ascending by px value', () => {
    const radii = [{ value: '8px' }, { value: '4px' }, { value: '2px' }];
    const { scale } = generateRadiusScale(radii);
    const pxList = scale.map(s => s.px);
    expect(pxList).toEqual([...pxList].sort((a, b) => a - b));
  });

  test('assigns "full" to 9999px value', () => {
    const radii = [{ value: '9999px' }];
    const { scale } = generateRadiusScale(radii);
    expect(scale[0].name).toBe('full');
  });

  test('assigns "full" to large value (>= 9999px)', () => {
    const radii = [{ value: '9999px' }, { value: '4px' }];
    const { scale } = generateRadiusScale(radii);
    const full = scale.find(s => s.px >= 9999);
    expect(full.name).toBe('full');
  });

  test('returns empty scale for empty input', () => {
    expect(generateRadiusScale([]).scale).toEqual([]);
  });

  test('assigns sequential names xs→xl for 2-6 regular values', () => {
    const radii = [
      { value: '2px' }, { value: '4px' }, { value: '8px' },
      { value: '12px' }, { value: '16px' },
    ];
    const { scale } = generateRadiusScale(radii);
    const names = scale.map(s => s.name);
    expect(names).toContain('xs');
    expect(names).toContain('sm');
  });

  test('single value gets name "md"', () => {
    const radii = [{ value: '8px' }];
    const { scale } = generateRadiusScale(radii);
    expect(scale[0].name).toBe('md');
  });

  test('ignores null/unparseable values', () => {
    const radii = [{ value: 'auto' }, { value: '4px' }];
    const { scale } = generateRadiusScale(radii);
    expect(scale.length).toBe(1);
  });

  test('percentage >= 50 is assigned "full"', () => {
    const radii = [{ value: '50%' }];
    const { scale } = generateRadiusScale(radii);
    expect(scale[0].name).toBe('full');
  });
});
