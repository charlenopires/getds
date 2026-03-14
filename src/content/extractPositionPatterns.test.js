import { describe, test, expect } from 'bun:test';
import { extractPositionPatterns } from './extractPositionPatterns.js';

function fakeStyle(props = {}) {
  return {
    getPropertyValue(name) { return props[name] ?? ''; },
  };
}

describe('extractPositionPatterns', () => {
  test('returns empty arrays for no position elements', () => {
    const result = extractPositionPatterns([
      fakeStyle({ position: 'static' }),
      fakeStyle({ position: 'relative' }),
    ]);
    expect(result.stickyElements).toHaveLength(0);
    expect(result.fixedElements).toHaveLength(0);
    expect(result.scrollSnapContainers).toHaveLength(0);
  });

  test('detects sticky elements', () => {
    const result = extractPositionPatterns([
      fakeStyle({ position: 'sticky', top: '0px', 'z-index': '100' }),
    ]);
    expect(result.stickyElements).toHaveLength(1);
    expect(result.stickyElements[0].top).toBe('0px');
    expect(result.stickyElements[0].zIndex).toBe('100');
  });

  test('detects fixed elements', () => {
    const result = extractPositionPatterns([
      fakeStyle({ position: 'fixed', top: '0px', 'z-index': '999' }),
    ]);
    expect(result.fixedElements).toHaveLength(1);
    expect(result.fixedElements[0].zIndex).toBe('999');
  });

  test('detects scroll-snap containers', () => {
    const result = extractPositionPatterns([
      fakeStyle({ 'scroll-snap-type': 'y mandatory', 'scroll-snap-align': 'start' }),
    ]);
    expect(result.scrollSnapContainers).toHaveLength(1);
    expect(result.scrollSnapContainers[0].snapType).toBe('y mandatory');
  });

  test('handles empty input', () => {
    const result = extractPositionPatterns([]);
    expect(result.stickyElements).toEqual([]);
    expect(result.fixedElements).toEqual([]);
    expect(result.scrollSnapContainers).toEqual([]);
  });
});
