/**
 * Task: 491465a8 — Report font families count, type scale steps, and base font-size
 * Spec: f7625baf — Typography System Extraction
 */

import { describe, test, expect } from 'bun:test';
import { computeTypographyStats } from './typographyStats.js';

function scaleStep(value, px, step) {
  return { value, px, step, remValue: null };
}

function fontEntry(primary, stack, generic = 'sans-serif') {
  return { primary, stack, generic };
}

describe('computeTypographyStats — typography summary statistics', () => {
  test('returns an object with totalFontFamilies, scaleSteps, and baseFontSize', () => {
    const result = computeTypographyStats([], []);
    expect(result).toHaveProperty('totalFontFamilies');
    expect(result).toHaveProperty('scaleSteps');
    expect(result).toHaveProperty('baseFontSize');
  });

  test('totalFontFamilies equals the number of distinct font entries', () => {
    const fonts = [
      fontEntry('Inter',   '"Inter", sans-serif'),
      fontEntry('Georgia', 'Georgia, serif'),
    ];
    const result = computeTypographyStats(fonts, []);
    expect(result.totalFontFamilies).toBe(2);
  });

  test('totalFontFamilies is 0 for empty font list', () => {
    expect(computeTypographyStats([], []).totalFontFamilies).toBe(0);
  });

  test('scaleSteps equals the number of steps in the type scale', () => {
    const scale = [
      scaleStep('12px', 12, 1),
      scaleStep('16px', 16, 2),
      scaleStep('24px', 24, 3),
      scaleStep('32px', 32, 4),
    ];
    const result = computeTypographyStats([], scale);
    expect(result.scaleSteps).toBe(4);
  });

  test('scaleSteps is 0 for empty scale', () => {
    expect(computeTypographyStats([], []).scaleSteps).toBe(0);
  });

  test('baseFontSize is the px value closest to 16px in the scale', () => {
    const scale = [
      scaleStep('12px', 12, 1),
      scaleStep('16px', 16, 2),
      scaleStep('24px', 24, 3),
    ];
    const result = computeTypographyStats([], scale);
    expect(result.baseFontSize).toBe('16px');
  });

  test('baseFontSize picks 14px when no 16px present', () => {
    const scale = [
      scaleStep('12px', 12, 1),
      scaleStep('14px', 14, 2),
      scaleStep('20px', 20, 3),
    ];
    const result = computeTypographyStats([], scale);
    expect(result.baseFontSize).toBe('14px');
  });

  test('baseFontSize is null when scale is empty', () => {
    expect(computeTypographyStats([], []).baseFontSize).toBeNull();
  });

  test('result includes fontFamilyNames — list of primary font names', () => {
    const fonts = [
      fontEntry('Inter',   '"Inter", sans-serif'),
      fontEntry('Roboto',  '"Roboto", sans-serif'),
    ];
    const result = computeTypographyStats(fonts, []);
    expect(result).toHaveProperty('fontFamilyNames');
    expect(result.fontFamilyNames).toContain('Inter');
    expect(result.fontFamilyNames).toContain('Roboto');
  });

  test('result includes scaleValues — list of font-size values', () => {
    const scale = [scaleStep('16px', 16, 1), scaleStep('24px', 24, 2)];
    const result = computeTypographyStats([], scale);
    expect(result).toHaveProperty('scaleValues');
    expect(result.scaleValues).toContain('16px');
    expect(result.scaleValues).toContain('24px');
  });

  test('handles a single scale step correctly', () => {
    const scale = [scaleStep('16px', 16, 1)];
    const result = computeTypographyStats([], scale);
    expect(result.scaleSteps).toBe(1);
    expect(result.baseFontSize).toBe('16px');
  });
});
