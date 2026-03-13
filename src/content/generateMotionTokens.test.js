/**
 * Task: f2ee1c24 — Generate motion tokens with easing curves and duration scale
 * Spec: 1bd1426a — Motion and Animation Extraction
 */

import { describe, test, expect } from 'bun:test';
import { generateMotionTokens } from './generateMotionTokens.js';

describe('generateMotionTokens — build W3C DTCG-style motion tokens', () => {
  test('returns an object with durationTokens', () => {
    const result = generateMotionTokens({ durations: [], easings: [] });
    expect(result).toHaveProperty('durationTokens');
  });

  test('returns an object with easingTokens', () => {
    const result = generateMotionTokens({ durations: [], easings: [] });
    expect(result).toHaveProperty('easingTokens');
  });

  test('durationTokens is an array', () => {
    expect(Array.isArray(generateMotionTokens({ durations: [], easings: [] }).durationTokens)).toBe(true);
  });

  test('easingTokens is an array', () => {
    expect(Array.isArray(generateMotionTokens({ durations: [], easings: [] }).easingTokens)).toBe(true);
  });

  test('each durationToken has $value field', () => {
    const result = generateMotionTokens({ durations: ['200ms'], easings: [] });
    expect(result.durationTokens[0]).toHaveProperty('$value');
  });

  test('each durationToken has $type: "duration"', () => {
    const result = generateMotionTokens({ durations: ['200ms'], easings: [] });
    expect(result.durationTokens[0].$type).toBe('duration');
  });

  test('each durationToken has a name field', () => {
    const result = generateMotionTokens({ durations: ['200ms'], easings: [] });
    expect(result.durationTokens[0]).toHaveProperty('name');
  });

  test('duration tokens are sorted ascending by ms value', () => {
    const result = generateMotionTokens({ durations: ['500ms', '100ms', '300ms'], easings: [] });
    const values = result.durationTokens.map(t => t.$value);
    expect(values).toEqual(['100ms', '300ms', '500ms']);
  });

  test('deduplicates identical duration values', () => {
    const result = generateMotionTokens({ durations: ['200ms', '200ms', '300ms'], easings: [] });
    expect(result.durationTokens).toHaveLength(2);
  });

  test('each easingToken has $value field', () => {
    const result = generateMotionTokens({ durations: [], easings: ['ease-in'] });
    expect(result.easingTokens[0]).toHaveProperty('$value');
    expect(result.easingTokens[0].$value).toBe('ease-in');
  });

  test('each easingToken has $type: "cubicBezier"', () => {
    const result = generateMotionTokens({ durations: [], easings: ['ease'] });
    expect(result.easingTokens[0].$type).toBe('cubicBezier');
  });

  test('each easingToken has a name field', () => {
    const result = generateMotionTokens({ durations: [], easings: ['ease-out'] });
    expect(result.easingTokens[0]).toHaveProperty('name');
  });

  test('deduplicates identical easing values', () => {
    const result = generateMotionTokens({ durations: [], easings: ['ease', 'ease', 'ease-in'] });
    expect(result.easingTokens).toHaveLength(2);
  });

  test('duration token name uses step index (duration-1, duration-2 ...)', () => {
    const result = generateMotionTokens({ durations: ['100ms', '200ms'], easings: [] });
    const names = result.durationTokens.map(t => t.name);
    expect(names).toContain('duration-1');
    expect(names).toContain('duration-2');
  });

  test('easing token name uses easing value as slug', () => {
    const result = generateMotionTokens({ durations: [], easings: ['ease-in-out'] });
    expect(result.easingTokens[0].name).toBe('easing-ease-in-out');
  });

  test('returns empty arrays for empty input', () => {
    const result = generateMotionTokens({ durations: [], easings: [] });
    expect(result.durationTokens).toHaveLength(0);
    expect(result.easingTokens).toHaveLength(0);
  });

  test('handles "s" unit durations by converting to ms for sorting', () => {
    const result = generateMotionTokens({ durations: ['1s', '200ms'], easings: [] });
    // 200ms < 1s → 200ms should come first
    expect(result.durationTokens[0].$value).toBe('200ms');
    expect(result.durationTokens[1].$value).toBe('1s');
  });
});
