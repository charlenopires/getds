import { describe, test, expect } from 'bun:test';
import { generateLineHeightTokens } from './generateLineHeightTokens.js';

describe('generateLineHeightTokens', () => {
  test('converts unitless line-height to number', () => {
    const tokens = generateLineHeightTokens([{ lineHeight: '1.5' }]);
    const key = Object.keys(tokens)[0];
    expect(tokens[key].$type).toBe('number');
    expect(tokens[key].$value).toBe(1.5);
  });

  test('converts px line-height to dimension', () => {
    const tokens = generateLineHeightTokens([{ lineHeight: '24px' }]);
    const key = Object.keys(tokens)[0];
    expect(tokens[key].$type).toBe('dimension');
    expect(tokens[key].$value).toBe('24px');
  });

  test('converts "normal" to 1.2', () => {
    const tokens = generateLineHeightTokens([{ lineHeight: 'normal' }]);
    const key = Object.keys(tokens)[0];
    expect(tokens[key].$type).toBe('number');
    expect(tokens[key].$value).toBe(1.2);
  });

  test('deduplicates identical values', () => {
    const tokens = generateLineHeightTokens([
      { lineHeight: '1.5' },
      { lineHeight: '1.5' },
      { lineHeight: '1.8' },
    ]);
    expect(Object.keys(tokens).length).toBe(2);
  });

  test('sorts by value ascending', () => {
    const tokens = generateLineHeightTokens([
      { lineHeight: '2.0' },
      { lineHeight: '1.2' },
      { lineHeight: '1.5' },
    ]);
    const values = Object.values(tokens).map((t) => t.$value);
    expect(values).toEqual([1.2, 1.5, 2.0]);
  });

  test('returns empty for empty input', () => {
    expect(generateLineHeightTokens([])).toEqual({});
    expect(generateLineHeightTokens(null)).toEqual({});
  });
});
