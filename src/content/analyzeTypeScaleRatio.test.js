import { describe, test, expect } from 'bun:test';
import { analyzeTypeScaleRatio } from './analyzeTypeScaleRatio.js';

describe('analyzeTypeScaleRatio', () => {
  test('returns defaults for empty scale', () => {
    const result = analyzeTypeScaleRatio([]);
    expect(result.detectedRatio).toBeNull();
    expect(result.fitScore).toBe(0);
    expect(result.baseSize).toBe(16);
    expect(result.pairRatios).toEqual([]);
  });

  test('returns defaults for single-step scale', () => {
    const result = analyzeTypeScaleRatio([{ step: 1, value: '16px', px: 16 }]);
    expect(result.detectedRatio).toBeNull();
    expect(result.pairRatios).toEqual([]);
  });

  test('detects Minor Third ratio (1.200)', () => {
    // 12, 14.4, 17.28, 20.736 — ratios all ~1.2
    const scale = [
      { step: 1, value: '12px', px: 12 },
      { step: 2, value: '14.4px', px: 14.4 },
      { step: 3, value: '17.28px', px: 17.28 },
      { step: 4, value: '20.736px', px: 20.736 },
    ];
    const result = analyzeTypeScaleRatio(scale);
    expect(result.detectedRatio).not.toBeNull();
    expect(result.detectedRatio.name).toBe('Minor Third');
    expect(result.fitScore).toBe(1);
  });

  test('detects Perfect Fourth ratio (1.333)', () => {
    const base = 12;
    const scale = [
      { step: 1, value: '12px', px: 12 },
      { step: 2, value: '16px', px: base * 1.333 },
      { step: 3, value: '21.3px', px: base * 1.333 * 1.333 },
    ];
    const result = analyzeTypeScaleRatio(scale);
    expect(result.detectedRatio).not.toBeNull();
    expect(result.detectedRatio.name).toBe('Perfect Fourth');
  });

  test('detects Golden Ratio (1.618)', () => {
    const scale = [
      { step: 1, value: '10px', px: 10 },
      { step: 2, value: '16.18px', px: 16.18 },
      { step: 3, value: '26.18px', px: 26.18 },
    ];
    const result = analyzeTypeScaleRatio(scale);
    expect(result.detectedRatio).not.toBeNull();
    expect(result.detectedRatio.name).toBe('Golden Ratio');
  });

  test('returns null detectedRatio for non-standard ratios', () => {
    const scale = [
      { step: 1, value: '10px', px: 10 },
      { step: 2, value: '15px', px: 15 },
      { step: 3, value: '22px', px: 22 },
    ];
    const result = analyzeTypeScaleRatio(scale);
    // 15/10 = 1.5 and 22/15 = 1.467 — neither consistently matches
    expect(result.pairRatios).toHaveLength(2);
  });

  test('computes baseSize as closest to 16px', () => {
    const scale = [
      { step: 1, value: '12px', px: 12 },
      { step: 2, value: '14px', px: 14 },
      { step: 3, value: '17px', px: 17 },
      { step: 4, value: '24px', px: 24 },
    ];
    const result = analyzeTypeScaleRatio(scale);
    expect(result.baseSize).toBe(17); // closest to 16
  });

  test('computes pairRatios for each consecutive pair', () => {
    const scale = [
      { step: 1, value: '10px', px: 10 },
      { step: 2, value: '20px', px: 20 },
      { step: 3, value: '40px', px: 40 },
    ];
    const result = analyzeTypeScaleRatio(scale);
    expect(result.pairRatios).toHaveLength(2);
    expect(result.pairRatios[0]).toBe(2);
    expect(result.pairRatios[1]).toBe(2);
  });
});
