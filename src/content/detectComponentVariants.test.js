/**
 * Task: 46253124 — Detect component variants by comparing style differences
 * Spec: 86aa4a39 — UI Component Detection
 */

import { describe, test, expect } from 'bun:test';
import { detectComponentVariants } from './detectComponentVariants.js';

// Helper: build a mock component entry (as returned by detectButtons etc.)
function makeComponent(tag, classes = [], styles = {}) {
  return { tag, classes, styles };
}

describe('detectComponentVariants — cluster same-type components into variants', () => {
  test('returns an array of variant groups', () => {
    const components = [
      makeComponent('button', ['btn'], { 'background-color': 'blue', color: 'white' }),
      makeComponent('button', ['btn'], { 'background-color': 'blue', color: 'white' }),
    ];
    const result = detectComponentVariants(components);
    expect(Array.isArray(result)).toBe(true);
  });

  test('single component produces one variant with instanceCount 1', () => {
    const components = [
      makeComponent('button', ['btn'], { 'background-color': 'blue' }),
    ];
    const result = detectComponentVariants(components);
    expect(result).toHaveLength(1);
    expect(result[0].instanceCount).toBe(1);
  });

  test('two components with identical styles produce one variant with instanceCount 2', () => {
    const styles = { 'background-color': 'blue', color: 'white' };
    const components = [
      makeComponent('button', ['btn'], styles),
      makeComponent('button', ['btn'], styles),
    ];
    const result = detectComponentVariants(components);
    expect(result).toHaveLength(1);
    expect(result[0].instanceCount).toBe(2);
  });

  test('two components with different background-color produce two variants', () => {
    const components = [
      makeComponent('button', ['btn'], { 'background-color': 'blue', color: 'white' }),
      makeComponent('button', ['btn-secondary'], { 'background-color': 'grey', color: 'black' }),
    ];
    const result = detectComponentVariants(components);
    expect(result).toHaveLength(2);
  });

  test('each variant has a distinguishingProps field listing differing properties', () => {
    const components = [
      makeComponent('button', [], { 'background-color': 'blue', color: 'white' }),
      makeComponent('button', [], { 'background-color': 'red',  color: 'white' }),
    ];
    const result = detectComponentVariants(components);
    expect(result[0]).toHaveProperty('distinguishingProps');
    expect(Array.isArray(result[0].distinguishingProps)).toBe(true);
  });

  test('distinguishingProps contains the property that differs between variants', () => {
    const components = [
      makeComponent('button', [], { 'background-color': 'blue', color: 'white' }),
      makeComponent('button', [], { 'background-color': 'red',  color: 'white' }),
    ];
    const result = detectComponentVariants(components);
    const allDistinguishing = result.flatMap(v => v.distinguishingProps);
    expect(allDistinguishing).toContain('background-color');
  });

  test('each variant has a styles snapshot', () => {
    const components = [
      makeComponent('button', [], { 'background-color': 'blue' }),
    ];
    const result = detectComponentVariants(components);
    expect(result[0]).toHaveProperty('styles');
  });

  test('each variant has a classes array (union of seen classes)', () => {
    const components = [
      makeComponent('button', ['btn', 'btn-primary'], { 'background-color': 'blue' }),
      makeComponent('button', ['btn', 'btn-primary'], { 'background-color': 'blue' }),
    ];
    const result = detectComponentVariants(components);
    expect(result[0]).toHaveProperty('classes');
    expect(result[0].classes).toContain('btn');
    expect(result[0].classes).toContain('btn-primary');
  });

  test('each variant has an instanceCount field', () => {
    const components = [
      makeComponent('button', [], { 'background-color': 'blue' }),
    ];
    const result = detectComponentVariants(components);
    expect(result[0]).toHaveProperty('instanceCount');
  });

  test('returns empty array for empty input', () => {
    expect(detectComponentVariants([])).toEqual([]);
  });

  test('three components: 2 identical + 1 different → 2 variants', () => {
    const components = [
      makeComponent('button', [], { 'background-color': 'blue' }),
      makeComponent('button', [], { 'background-color': 'blue' }),
      makeComponent('button', [], { 'background-color': 'red' }),
    ];
    const result = detectComponentVariants(components);
    expect(result).toHaveLength(2);
    const counts = result.map(v => v.instanceCount).sort();
    expect(counts).toEqual([1, 2]);
  });

  test('components with same styles but different classes are still one variant', () => {
    const styles = { 'background-color': 'blue' };
    const components = [
      makeComponent('button', ['btn-a'], styles),
      makeComponent('button', ['btn-b'], styles),
    ];
    const result = detectComponentVariants(components);
    expect(result).toHaveLength(1);
    expect(result[0].instanceCount).toBe(2);
  });
});
