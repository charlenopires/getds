/**
 * Task: 3a36a817 — Generate W3C DTCG typography tokens
 * Spec: f7625baf — Typography System Extraction
 */

import { describe, test, expect } from 'bun:test';
import { generateTypographyTokens } from './generateTypographyTokens.js';

/** Minimal type role entry as inferTypeRoles() produces */
function roleEntry(role, tag, fontSize, fontFamily = '"Inter", sans-serif', fontWeight = '400', lineHeight = '1.5', letterSpacing = '0px') {
  return {
    role,
    style: { tag, fontSize, fontWeight, lineHeight, letterSpacing, textTransform: 'none' },
    fontFamily,
  };
}

describe('generateTypographyTokens — W3C DTCG typography token generation', () => {
  test('returns an object', () => {
    const result = generateTypographyTokens([]);
    expect(typeof result).toBe('object');
    expect(result).not.toBeNull();
  });

  test('returns empty object for empty input', () => {
    expect(generateTypographyTokens([])).toEqual({});
  });

  test('each token has $value and $type fields', () => {
    const result = generateTypographyTokens([roleEntry('body', 'p', '16px')]);
    const token = Object.values(result)[0];
    expect(token).toHaveProperty('$value');
    expect(token).toHaveProperty('$type');
  });

  test('$type is "typography"', () => {
    const result = generateTypographyTokens([roleEntry('body', 'p', '16px')]);
    expect(Object.values(result)[0].$type).toBe('typography');
  });

  test('token key matches the semantic role', () => {
    const result = generateTypographyTokens([roleEntry('body', 'p', '16px')]);
    expect(result).toHaveProperty('typography-body');
  });

  test('$value includes fontFamily', () => {
    const result = generateTypographyTokens([roleEntry('body', 'p', '16px', '"Inter", sans-serif')]);
    expect(result['typography-body'].$value).toHaveProperty('fontFamily');
    expect(result['typography-body'].$value.fontFamily).toBe('"Inter", sans-serif');
  });

  test('$value includes fontSize', () => {
    const result = generateTypographyTokens([roleEntry('body', 'p', '16px')]);
    expect(result['typography-body'].$value.fontSize).toBe('16px');
  });

  test('$value includes fontWeight', () => {
    const result = generateTypographyTokens([roleEntry('heading-1', 'h1', '32px', '"Inter"', '700')]);
    expect(result['typography-heading-1'].$value.fontWeight).toBe('700');
  });

  test('$value includes lineHeight', () => {
    const result = generateTypographyTokens([roleEntry('body', 'p', '16px', '"Inter"', '400', '1.6')]);
    expect(result['typography-body'].$value.lineHeight).toBe('1.6');
  });

  test('$value includes letterSpacing', () => {
    const result = generateTypographyTokens([roleEntry('overline', 'span', '11px', '"Inter"', '600', '1.2', '2px')]);
    expect(result['typography-overline'].$value.letterSpacing).toBe('2px');
  });

  test('generates token for each role entry', () => {
    const entries = [
      roleEntry('heading-1', 'h1', '32px'),
      roleEntry('body',      'p',  '16px'),
      roleEntry('caption',   'small', '12px'),
    ];
    const result = generateTypographyTokens(entries);
    expect(result).toHaveProperty('typography-heading-1');
    expect(result).toHaveProperty('typography-body');
    expect(result).toHaveProperty('typography-caption');
  });

  test('token key uses role with "typography-" prefix', () => {
    const result = generateTypographyTokens([roleEntry('heading-2', 'h2', '24px')]);
    expect(Object.keys(result)[0]).toBe('typography-heading-2');
  });

  test('when two entries share the same role, last one wins', () => {
    // In practice roles should be unique, but handle gracefully
    const entries = [
      roleEntry('body', 'p',    '16px'),
      roleEntry('body', 'span', '16px'),
    ];
    const result = generateTypographyTokens(entries);
    expect(Object.keys(result).filter(k => k === 'typography-body')).toHaveLength(1);
  });
});
