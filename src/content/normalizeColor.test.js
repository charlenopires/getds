/**
 * Task: 865bb89a — Normalize all color formats to hex, rgb, and hsl
 * Spec: fff645a0 — Color System Extraction
 */

import { describe, test, expect } from 'bun:test';
import { normalizeColor } from './normalizeColor.js';

describe('normalizeColor — converts any CSS color to hex + rgb + hsl', () => {
  test('normalizes rgb() to all three formats', () => {
    const result = normalizeColor('rgb(255, 0, 0)');
    expect(result.hex).toBe('#ff0000');
    expect(result.rgb).toBe('rgb(255, 0, 0)');
    expect(result.hsl).toBe('hsl(0, 100%, 50%)');
  });

  test('normalizes rgb() with zero values', () => {
    const result = normalizeColor('rgb(0, 0, 0)');
    expect(result.hex).toBe('#000000');
    expect(result.rgb).toBe('rgb(0, 0, 0)');
    expect(result.hsl).toBe('hsl(0, 0%, 0%)');
  });

  test('normalizes white rgb()', () => {
    const result = normalizeColor('rgb(255, 255, 255)');
    expect(result.hex).toBe('#ffffff');
    expect(result.rgb).toBe('rgb(255, 255, 255)');
    expect(result.hsl).toBe('hsl(0, 0%, 100%)');
  });

  test('normalizes rgba() — preserves alpha in rgb output, hex gets alpha channel', () => {
    const result = normalizeColor('rgba(255, 0, 0, 0.5)');
    expect(result.hex).toBe('#ff000080');
    expect(result.rgb).toBe('rgba(255, 0, 0, 0.5)');
    expect(result.hsl).toBe('hsla(0, 100%, 50%, 0.5)');
  });

  test('normalizes 6-digit hex to all three formats', () => {
    const result = normalizeColor('#00ff00');
    expect(result.hex).toBe('#00ff00');
    expect(result.rgb).toBe('rgb(0, 255, 0)');
    expect(result.hsl).toBe('hsl(120, 100%, 50%)');
  });

  test('normalizes 3-digit hex (expands to 6)', () => {
    const result = normalizeColor('#f00');
    expect(result.hex).toBe('#ff0000');
    expect(result.rgb).toBe('rgb(255, 0, 0)');
    expect(result.hsl).toBe('hsl(0, 100%, 50%)');
  });

  test('normalizes blue', () => {
    const result = normalizeColor('rgb(0, 0, 255)');
    expect(result.hex).toBe('#0000ff');
    expect(result.rgb).toBe('rgb(0, 0, 255)');
    expect(result.hsl).toBe('hsl(240, 100%, 50%)');
  });

  test('normalizes a mid-range color', () => {
    const result = normalizeColor('rgb(128, 64, 32)');
    expect(result.hex).toBe('#804020');
    expect(result.rgb).toBe('rgb(128, 64, 32)');
    expect(typeof result.hsl).toBe('string');
    expect(result.hsl).toMatch(/^hsl\(/);
  });

  test('returns null for unrecognized or unparseable color', () => {
    const result = normalizeColor('not-a-color');
    expect(result).toBeNull();
  });

  test('normalizes hsl() input', () => {
    const result = normalizeColor('hsl(120, 100%, 50%)');
    expect(result.hex).toBe('#00ff00');
    expect(result.rgb).toBe('rgb(0, 255, 0)');
    expect(result.hsl).toBe('hsl(120, 100%, 50%)');
  });

  test('result always has hex, rgb, and hsl keys', () => {
    const result = normalizeColor('rgb(10, 20, 30)');
    expect(result).toHaveProperty('hex');
    expect(result).toHaveProperty('rgb');
    expect(result).toHaveProperty('hsl');
  });
});
