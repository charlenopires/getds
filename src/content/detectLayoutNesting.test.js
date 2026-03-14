import { describe, test, expect } from 'bun:test';
import { detectLayoutNestingDepth } from './detectLayoutNesting.js';

function fakeStyle(display) {
  return { getPropertyValue: (name) => name === 'display' ? display : '' };
}

describe('detectLayoutNestingDepth', () => {
  test('returns zero depth for no layout elements', () => {
    const result = detectLayoutNestingDepth([
      { element: { parentElement: null }, computedStyle: fakeStyle('block') },
    ]);
    expect(result.maxDepth).toBe(0);
    expect(result.nestingPatterns).toEqual([]);
  });

  test('returns zero depth for flat layout elements', () => {
    const el = { parentElement: null };
    const result = detectLayoutNestingDepth([
      { element: el, computedStyle: fakeStyle('flex') },
    ]);
    expect(result.maxDepth).toBe(0);
  });

  test('handles empty input', () => {
    const result = detectLayoutNestingDepth([]);
    expect(result.maxDepth).toBe(0);
    expect(result.nestingPatterns).toEqual([]);
  });
});
