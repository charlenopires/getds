/**
 * Tests for computeSpacingConsistencyScore — spacing consistency scoring
 */

import { describe, test, expect } from 'bun:test';
import { computeSpacingConsistencyScore } from './computeSpacingConsistency.js';

describe('computeSpacingConsistencyScore — measure spacing scale consistency', () => {
  test('returns an object with score, onScale, offScale, total, and grade', () => {
    const result = computeSpacingConsistencyScore([8, 16, 24], 8);
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('onScale');
    expect(result).toHaveProperty('offScale');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('grade');
  });

  // --- Excellent ---
  test('returns excellent grade when all values are on scale', () => {
    const result = computeSpacingConsistencyScore([8, 16, 24, 32], 8);
    expect(result.score).toBe(1);
    expect(result.onScale).toBe(4);
    expect(result.offScale).toBe(0);
    expect(result.total).toBe(4);
    expect(result.grade).toBe('excellent');
  });

  test('returns excellent grade with 1px tolerance', () => {
    // 17px is within 1px of 16px (2*8)
    const result = computeSpacingConsistencyScore([8, 17, 24, 32], 8);
    expect(result.score).toBe(1);
    expect(result.grade).toBe('excellent');
  });

  // --- Poor ---
  test('returns poor grade when all values are off scale', () => {
    // 3, 5, 11, 19 — none within 1px of a multiple of 8
    const result = computeSpacingConsistencyScore([3, 5, 11, 19], 8);
    expect(result.onScale).toBe(0);
    expect(result.offScale).toBe(4);
    expect(result.grade).toBe('poor');
  });

  // --- Mixed ---
  test('returns good grade for mostly on-scale values', () => {
    // 8, 16, 24 on scale; 13 off scale => 3/4 = 0.75
    const result = computeSpacingConsistencyScore([8, 13, 16, 24], 8);
    expect(result.score).toBe(0.75);
    expect(result.grade).toBe('good');
  });

  test('returns fair grade for 50% on-scale values', () => {
    // 8, 16 on scale; 3, 5 off scale => 2/4 = 0.5
    const result = computeSpacingConsistencyScore([8, 3, 16, 5], 8);
    expect(result.score).toBe(0.5);
    expect(result.grade).toBe('fair');
  });

  // --- Edge cases ---
  test('returns poor with score 0 for empty array', () => {
    const result = computeSpacingConsistencyScore([], 8);
    expect(result.score).toBe(0);
    expect(result.total).toBe(0);
    expect(result.grade).toBe('poor');
  });

  test('returns poor with score 0 for null input', () => {
    const result = computeSpacingConsistencyScore(null, 8);
    expect(result.score).toBe(0);
    expect(result.grade).toBe('poor');
  });

  test('returns poor with score 0 for zero base unit', () => {
    const result = computeSpacingConsistencyScore([8, 16], 0);
    expect(result.score).toBe(0);
    expect(result.grade).toBe('poor');
  });

  test('returns poor with score 0 for negative base unit', () => {
    const result = computeSpacingConsistencyScore([8, 16], -4);
    expect(result.score).toBe(0);
    expect(result.grade).toBe('poor');
  });

  test('handles single value that is on scale', () => {
    const result = computeSpacingConsistencyScore([16], 8);
    expect(result.score).toBe(1);
    expect(result.onScale).toBe(1);
    expect(result.total).toBe(1);
    expect(result.grade).toBe('excellent');
  });

  test('handles single value that is off scale', () => {
    const result = computeSpacingConsistencyScore([5], 8);
    expect(result.score).toBe(0);
    expect(result.onScale).toBe(0);
    expect(result.total).toBe(1);
    expect(result.grade).toBe('poor');
  });

  test('handles base unit of 4', () => {
    const result = computeSpacingConsistencyScore([4, 8, 12, 16, 20], 4);
    expect(result.score).toBe(1);
    expect(result.grade).toBe('excellent');
  });
});
