/**
 * Task: e8cc4adc — Output animation descriptors with human-readable easing names
 * Spec: 1bd1426a — Motion and Animation Extraction
 */

import { describe, test, expect } from 'bun:test';
import { normalizeEasing, attachEasingName } from './normalizeEasing.js';

describe('normalizeEasing — map timing function to human-readable name', () => {
  test('returns a string', () => {
    expect(typeof normalizeEasing('ease')).toBe('string');
  });

  test('"ease" → "ease"', () => {
    expect(normalizeEasing('ease')).toBe('ease');
  });

  test('"ease-in" → "ease-in"', () => {
    expect(normalizeEasing('ease-in')).toBe('ease-in');
  });

  test('"ease-out" → "ease-out"', () => {
    expect(normalizeEasing('ease-out')).toBe('ease-out');
  });

  test('"ease-in-out" → "ease-in-out"', () => {
    expect(normalizeEasing('ease-in-out')).toBe('ease-in-out');
  });

  test('"linear" → "linear"', () => {
    expect(normalizeEasing('linear')).toBe('linear');
  });

  test('"step-start" → "step-start"', () => {
    expect(normalizeEasing('step-start')).toBe('step-start');
  });

  test('"step-end" → "step-end"', () => {
    expect(normalizeEasing('step-end')).toBe('step-end');
  });

  test('cubic-bezier matching ease → "ease"', () => {
    expect(normalizeEasing('cubic-bezier(0.25, 0.1, 0.25, 1)')).toBe('ease');
  });

  test('cubic-bezier matching ease-in → "ease-in"', () => {
    expect(normalizeEasing('cubic-bezier(0.42, 0, 1, 1)')).toBe('ease-in');
  });

  test('cubic-bezier matching ease-out → "ease-out"', () => {
    expect(normalizeEasing('cubic-bezier(0, 0, 0.58, 1)')).toBe('ease-out');
  });

  test('cubic-bezier matching ease-in-out → "ease-in-out"', () => {
    expect(normalizeEasing('cubic-bezier(0.42, 0, 0.58, 1)')).toBe('ease-in-out');
  });

  test('unknown cubic-bezier → "custom cubic-bezier(...)"', () => {
    const result = normalizeEasing('cubic-bezier(0.4, 0, 0.2, 1)');
    expect(result).toMatch(/^custom cubic-bezier/);
  });

  test('empty string → "linear"', () => {
    expect(normalizeEasing('')).toBe('linear');
  });

  test('unknown value → returns the value as-is', () => {
    expect(normalizeEasing('steps(4, end)')).toBe('steps(4, end)');
  });
});

describe('attachEasingName — enrich animation descriptor with easingName', () => {
  test('adds easingName field to descriptor', () => {
    const descriptor = { name: 'fadeIn', timingFunction: 'ease-in' };
    const result = attachEasingName(descriptor);
    expect(result).toHaveProperty('easingName');
  });

  test('easingName matches normalized value of timingFunction', () => {
    const descriptor = { name: 'fadeIn', timingFunction: 'ease-out' };
    expect(attachEasingName(descriptor).easingName).toBe('ease-out');
  });

  test('preserves all original fields', () => {
    const descriptor = { name: 'fadeIn', duration: '300ms', timingFunction: 'ease' };
    const result = attachEasingName(descriptor);
    expect(result.name).toBe('fadeIn');
    expect(result.duration).toBe('300ms');
  });

  test('works with easing field (Web Animations API uses "easing")', () => {
    const descriptor = { id: 'anim-1', easing: 'ease-in-out' };
    const result = attachEasingName(descriptor, 'easing');
    expect(result.easingName).toBe('ease-in-out');
  });
});
