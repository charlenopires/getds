/**
 * Tests for classifyInsetSpacing — inset padding classification
 */

import { describe, test, expect } from 'bun:test';
import { classifyInset, extractInsetPatterns } from './classifyInsetSpacing.js';

describe('classifyInset — classify a padding pattern by its shape', () => {
  test('returns "equal" when all four sides are identical', () => {
    expect(classifyInset({ top: 16, right: 16, bottom: 16, left: 16 })).toEqual({ type: 'equal' });
  });

  test('returns "equal" for zero padding on all sides', () => {
    expect(classifyInset({ top: 0, right: 0, bottom: 0, left: 0 })).toEqual({ type: 'equal' });
  });

  test('returns "squish" when horizontal > vertical with symmetry', () => {
    expect(classifyInset({ top: 8, right: 16, bottom: 8, left: 16 })).toEqual({ type: 'squish' });
  });

  test('returns "stretch" when vertical > horizontal with symmetry', () => {
    expect(classifyInset({ top: 24, right: 12, bottom: 24, left: 12 })).toEqual({ type: 'stretch' });
  });

  test('returns "asymmetric" when top !== bottom', () => {
    expect(classifyInset({ top: 8, right: 16, bottom: 12, left: 16 })).toEqual({ type: 'asymmetric' });
  });

  test('returns "asymmetric" when left !== right', () => {
    expect(classifyInset({ top: 8, right: 16, bottom: 8, left: 24 })).toEqual({ type: 'asymmetric' });
  });

  test('returns "asymmetric" for all-different values', () => {
    expect(classifyInset({ top: 4, right: 8, bottom: 12, left: 16 })).toEqual({ type: 'asymmetric' });
  });

  test('returns "equal" for value of 1 on all sides', () => {
    expect(classifyInset({ top: 1, right: 1, bottom: 1, left: 1 })).toEqual({ type: 'equal' });
  });

  test('squish requires left/right > top/bottom (not equal)', () => {
    // When horizontal === vertical but symmetric, it's equal
    expect(classifyInset({ top: 10, right: 10, bottom: 10, left: 10 })).toEqual({ type: 'equal' });
  });
});

describe('extractInsetPatterns — extract padding patterns from computed styles', () => {
  /** Helper to create a fake computed style object with getPropertyValue */
  function fakeCS(top, right, bottom, left) {
    const map = {
      'padding-top': String(top),
      'padding-right': String(right),
      'padding-bottom': String(bottom),
      'padding-left': String(left),
    };
    return { getPropertyValue: (prop) => map[prop] ?? '' };
  }

  test('returns an object with an insets array', () => {
    const result = extractInsetPatterns([]);
    expect(result).toHaveProperty('insets');
    expect(Array.isArray(result.insets)).toBe(true);
  });

  test('returns empty insets for empty input', () => {
    expect(extractInsetPatterns([]).insets).toEqual([]);
  });

  test('skips elements with all-zero padding', () => {
    const styles = [fakeCS(0, 0, 0, 0)];
    expect(extractInsetPatterns(styles).insets).toEqual([]);
  });

  test('extracts a single equal inset pattern', () => {
    const styles = [fakeCS(16, 16, 16, 16)];
    const result = extractInsetPatterns(styles);
    expect(result.insets).toHaveLength(1);
    expect(result.insets[0].type).toBe('equal');
    expect(result.insets[0].values).toEqual({ top: 16, right: 16, bottom: 16, left: 16 });
    expect(result.insets[0].count).toBe(1);
  });

  test('counts duplicate patterns', () => {
    const styles = [fakeCS(16, 16, 16, 16), fakeCS(16, 16, 16, 16), fakeCS(16, 16, 16, 16)];
    const result = extractInsetPatterns(styles);
    expect(result.insets).toHaveLength(1);
    expect(result.insets[0].count).toBe(3);
  });

  test('separates different patterns into distinct entries', () => {
    const styles = [fakeCS(16, 16, 16, 16), fakeCS(8, 16, 8, 16)];
    const result = extractInsetPatterns(styles);
    expect(result.insets).toHaveLength(2);
    const types = result.insets.map((i) => i.type).sort();
    expect(types).toEqual(['equal', 'squish']);
  });

  test('classifies squish patterns from computed styles', () => {
    const styles = [fakeCS(4, 12, 4, 12)];
    const result = extractInsetPatterns(styles);
    expect(result.insets[0].type).toBe('squish');
  });

  test('classifies stretch patterns from computed styles', () => {
    const styles = [fakeCS(20, 8, 20, 8)];
    const result = extractInsetPatterns(styles);
    expect(result.insets[0].type).toBe('stretch');
  });

  test('classifies asymmetric patterns from computed styles', () => {
    const styles = [fakeCS(4, 8, 12, 16)];
    const result = extractInsetPatterns(styles);
    expect(result.insets[0].type).toBe('asymmetric');
  });

  test('handles non-numeric padding values gracefully (defaults to 0)', () => {
    const cs = { getPropertyValue: () => 'auto' };
    // All parse to 0 so this element is skipped
    expect(extractInsetPatterns([cs]).insets).toEqual([]);
  });

  test('parses pixel values with units', () => {
    const cs = {
      getPropertyValue: (prop) => {
        const map = {
          'padding-top': '8px',
          'padding-right': '16px',
          'padding-bottom': '8px',
          'padding-left': '16px',
        };
        return map[prop] ?? '';
      },
    };
    const result = extractInsetPatterns([cs]);
    expect(result.insets).toHaveLength(1);
    expect(result.insets[0].type).toBe('squish');
  });
});
