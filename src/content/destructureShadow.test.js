import { describe, test, expect } from 'bun:test';
import { destructureShadow } from './destructureShadow.js';

describe('destructureShadow', () => {
  test('parses simple shadow with rgba color', () => {
    const result = destructureShadow('0px 4px 6px 0px rgba(0,0,0,0.1)');
    expect(result.offsetX).toEqual({ value: 0, unit: 'px' });
    expect(result.offsetY).toEqual({ value: 4, unit: 'px' });
    expect(result.blur).toEqual({ value: 6, unit: 'px' });
    expect(result.spread).toEqual({ value: 0, unit: 'px' });
    expect(result.color).toBe('rgba(0,0,0,0.1)');
    expect(result.inset).toBe(false);
  });

  test('parses inset shadow', () => {
    const result = destructureShadow('inset 0px 2px 4px #000');
    expect(result.inset).toBe(true);
    expect(result.color).toBe('#000');
  });

  test('parses shadow with hex color', () => {
    const result = destructureShadow('2px 3px 5px #ff0000');
    expect(result.offsetX.value).toBe(2);
    expect(result.offsetY.value).toBe(3);
    expect(result.blur.value).toBe(5);
    expect(result.color).toBe('#ff0000');
  });

  test('defaults missing values', () => {
    const result = destructureShadow('2px 3px');
    expect(result.offsetX.value).toBe(2);
    expect(result.offsetY.value).toBe(3);
    expect(result.blur.value).toBe(0);
    expect(result.spread.value).toBe(0);
    expect(result.color).toBe('#000000');
  });

  test('handles multiple shadows', () => {
    const result = destructureShadow('0px 1px 2px #000, 0px 4px 8px rgba(0,0,0,0.2)');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0].blur.value).toBe(2);
    expect(result[1].blur.value).toBe(8);
  });

  test('returns null for "none"', () => {
    expect(destructureShadow('none')).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(destructureShadow('')).toBeNull();
  });

  test('returns null for null input', () => {
    expect(destructureShadow(null)).toBeNull();
  });
});
