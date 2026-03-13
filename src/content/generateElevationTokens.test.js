/**
 * Task: c17c745d — Generate W3C DTCG tokens for elevation levels and border-radius scale
 * Spec: 7c17b9ef — Elevation and Border Radius Extraction
 */

import { describe, test, expect } from 'bun:test';
import { generateElevationTokens, generateRadiusTokens } from './generateElevationTokens.js';

describe('generateElevationTokens — DTCG shadow tokens', () => {
  test('returns an object', () => {
    expect(typeof generateElevationTokens([])).toBe('object');
  });

  test('each token has $value and $type fields', () => {
    const entries = [{ level: 1, value: '0px 2px 4px rgba(0,0,0,0.2)', blur: 4 }];
    const tokens = generateElevationTokens(entries);
    const token = Object.values(tokens)[0];
    expect(token).toHaveProperty('$value');
    expect(token).toHaveProperty('$type');
  });

  test('$type is "shadow" for elevation tokens', () => {
    const entries = [{ level: 1, value: '0px 2px 4px rgba(0,0,0,0.2)', blur: 4 }];
    const tokens = generateElevationTokens(entries);
    expect(Object.values(tokens)[0].$type).toBe('shadow');
  });

  test('token key follows elevation-{level} pattern', () => {
    const entries = [{ level: 2, value: '0px 4px 8px rgba(0,0,0,0.2)', blur: 8 }];
    const tokens = generateElevationTokens(entries);
    expect(tokens).toHaveProperty('elevation-2');
  });

  test('returns empty object for empty input', () => {
    expect(generateElevationTokens({})).toEqual({});
  });

  test('$value is the original shadow string', () => {
    const entries = [{ level: 1, value: '0px 2px 4px rgba(0,0,0,0.2)', blur: 4 }];
    const tokens = generateElevationTokens(entries);
    expect(tokens['elevation-1'].$value).toBe('0px 2px 4px rgba(0,0,0,0.2)');
  });
});

describe('generateRadiusTokens — DTCG dimension tokens for border-radius', () => {
  test('returns an object', () => {
    expect(typeof generateRadiusTokens([])).toBe('object');
  });

  test('each token has $value and $type fields', () => {
    const scale = [{ name: 'md', value: '8px', px: 8 }];
    const tokens = generateRadiusTokens(scale);
    const token = Object.values(tokens)[0];
    expect(token).toHaveProperty('$value');
    expect(token).toHaveProperty('$type');
  });

  test('$type is "dimension" for radius tokens', () => {
    const scale = [{ name: 'md', value: '8px', px: 8 }];
    const tokens = generateRadiusTokens(scale);
    expect(Object.values(tokens)[0].$type).toBe('dimension');
  });

  test('token key follows border-radius-{name} pattern', () => {
    const scale = [{ name: 'md', value: '8px', px: 8 }];
    const tokens = generateRadiusTokens(scale);
    expect(tokens).toHaveProperty('border-radius-md');
  });

  test('$value is the original value string', () => {
    const scale = [{ name: 'sm', value: '4px', px: 4 }];
    const tokens = generateRadiusTokens(scale);
    expect(tokens['border-radius-sm'].$value).toBe('4px');
  });

  test('returns empty object for empty input', () => {
    expect(generateRadiusTokens([])).toEqual({});
  });
});
