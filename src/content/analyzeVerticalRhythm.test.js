import { describe, test, expect } from 'bun:test';
import { analyzeVerticalRhythm } from './analyzeVerticalRhythm.js';

describe('analyzeVerticalRhythm', () => {
  test('returns defaults for empty input', () => {
    const result = analyzeVerticalRhythm([], []);
    expect(result.baselineUnit).toBeNull();
    expect(result.rhythmScore).toBe(0);
    expect(result.alignments).toEqual([]);
  });

  test('detects 4px baseline from line-heights', () => {
    const styles = [
      { fontSize: '16px', lineHeight: '24px' },
      { fontSize: '14px', lineHeight: '20px' },
      { fontSize: '12px', lineHeight: '16px' },
    ];
    const result = analyzeVerticalRhythm(styles, []);
    expect(result.baselineUnit).toBe(4);
    expect(result.rhythmScore).toBe(1);
  });

  test('detects 8px baseline', () => {
    const styles = [
      { fontSize: '16px', lineHeight: '24px' },
      { fontSize: '24px', lineHeight: '32px' },
      { fontSize: '32px', lineHeight: '40px' },
    ];
    const result = analyzeVerticalRhythm(styles, []);
    expect(result.baselineUnit).toBe(8);
  });

  test('computes multiples correctly', () => {
    const styles = [
      { fontSize: '16px', lineHeight: '24px' },
    ];
    const result = analyzeVerticalRhythm(styles, []);
    // Single style — can't compute GCD with just one value
    // Still returns alignments
    expect(result.alignments).toHaveLength(1);
  });

  test('handles unitless line-heights', () => {
    const styles = [
      { fontSize: '16px', lineHeight: '1.5' },
      { fontSize: '24px', lineHeight: '1.5' },
    ];
    const result = analyzeVerticalRhythm(styles, []);
    // 16*1.5=24, 24*1.5=36 — GCD of 24 and 36 is 12
    expect(result.baselineUnit).not.toBeNull();
    expect(result.alignments).toHaveLength(2);
  });

  test('handles "normal" line-height', () => {
    const styles = [
      { fontSize: '16px', lineHeight: 'normal' },
      { fontSize: '16px', lineHeight: '24px' },
    ];
    const result = analyzeVerticalRhythm(styles, []);
    // 'normal' — 16 * 1.2 = 19.2, and 24 — GCD
    expect(result.alignments).toHaveLength(2);
  });
});
