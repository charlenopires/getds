/**
 * Tests for generateFontFaceTokens — W3C DTCG font-face token generation
 */

import { describe, test, expect } from 'bun:test';
import { generateFontFaceTokens } from './generateFontFaceTokens.js';

describe('generateFontFaceTokens', () => {
  test('returns an empty object when called with no arguments', () => {
    expect(generateFontFaceTokens()).toEqual({});
  });

  test('returns an empty object for empty arrays', () => {
    expect(generateFontFaceTokens([], [])).toEqual({});
  });

  test('skips rules without fontFamily', () => {
    const rules = [{ fontWeight: '400', fontStyle: 'normal' }];
    expect(generateFontFaceTokens(rules)).toEqual({});
  });

  test('generates a token for a basic font-face rule', () => {
    const rules = [{ fontFamily: 'Inter', fontWeight: '400', fontStyle: 'normal' }];
    const result = generateFontFaceTokens(rules);
    expect(result).toHaveProperty('fontFace-inter-400-normal');
    const token = result['fontFace-inter-400-normal'];
    expect(token.$type).toBe('fontFamily');
    expect(token.$value).toEqual(['Inter']);
  });

  test('defaults fontWeight to "normal" when not provided', () => {
    const rules = [{ fontFamily: 'Roboto' }];
    const result = generateFontFaceTokens(rules);
    const key = Object.keys(result)[0];
    expect(result[key].$extensions['com.getds.fontFace'].fontWeight).toBe('normal');
  });

  test('defaults fontStyle to "normal" when not provided', () => {
    const rules = [{ fontFamily: 'Roboto' }];
    const result = generateFontFaceTokens(rules);
    const key = Object.keys(result)[0];
    expect(result[key].$extensions['com.getds.fontFace'].fontStyle).toBe('normal');
  });

  test('includes fontDisplay in extensions when provided', () => {
    const rules = [{ fontFamily: 'Inter', fontDisplay: 'swap' }];
    const result = generateFontFaceTokens(rules);
    const key = Object.keys(result)[0];
    expect(result[key].$extensions['com.getds.fontFace'].fontDisplay).toBe('swap');
  });

  test('includes sources array in extensions', () => {
    const sources = [{ url: 'https://fonts.gstatic.com/inter.woff2', format: 'woff2' }];
    const rules = [{ fontFamily: 'Inter', sources }];
    const result = generateFontFaceTokens(rules);
    const key = Object.keys(result)[0];
    expect(result[key].$extensions['com.getds.fontFace'].sources).toEqual(sources);
  });

  test('merges provider info from fontSources', () => {
    const rules = [{ fontFamily: 'Inter' }];
    const fontSources = [{ family: 'Inter', provider: 'google-fonts', linkTag: '<link href="..." />' }];
    const result = generateFontFaceTokens(rules, fontSources);
    const key = Object.keys(result)[0];
    const ext = result[key].$extensions['com.getds.fontFace'];
    expect(ext.provider).toBe('google-fonts');
    expect(ext.linkTag).toBe('<link href="..." />');
  });

  test('provider is null when fontSources has no match', () => {
    const rules = [{ fontFamily: 'Inter' }];
    const fontSources = [{ family: 'Roboto', provider: 'google-fonts' }];
    const result = generateFontFaceTokens(rules, fontSources);
    const key = Object.keys(result)[0];
    expect(result[key].$extensions['com.getds.fontFace'].provider).toBeNull();
  });

  test('avoids duplicate tokens for the same family/weight/style', () => {
    const rules = [
      { fontFamily: 'Inter', fontWeight: '400', fontStyle: 'normal' },
      { fontFamily: 'Inter', fontWeight: '400', fontStyle: 'normal' },
    ];
    const result = generateFontFaceTokens(rules);
    expect(Object.keys(result)).toHaveLength(1);
  });

  test('creates separate tokens for different weights of the same family', () => {
    const rules = [
      { fontFamily: 'Inter', fontWeight: '400', fontStyle: 'normal' },
      { fontFamily: 'Inter', fontWeight: '700', fontStyle: 'normal' },
    ];
    const result = generateFontFaceTokens(rules);
    expect(Object.keys(result)).toHaveLength(2);
    expect(result).toHaveProperty('fontFace-inter-400-normal');
    expect(result).toHaveProperty('fontFace-inter-700-normal');
  });

  test('creates separate tokens for different styles of the same family', () => {
    const rules = [
      { fontFamily: 'Inter', fontWeight: '400', fontStyle: 'normal' },
      { fontFamily: 'Inter', fontWeight: '400', fontStyle: 'italic' },
    ];
    const result = generateFontFaceTokens(rules);
    expect(Object.keys(result)).toHaveLength(2);
  });

  test('slugifies family name with special characters', () => {
    const rules = [{ fontFamily: 'Open Sans' }];
    const result = generateFontFaceTokens(rules);
    expect(result).toHaveProperty('fontFace-open-sans-normal-normal');
  });

  test('includes unicodeRange in extensions when provided', () => {
    const rules = [{ fontFamily: 'Inter', unicodeRange: 'U+0000-00FF' }];
    const result = generateFontFaceTokens(rules);
    const key = Object.keys(result)[0];
    expect(result[key].$extensions['com.getds.fontFace'].unicodeRange).toBe('U+0000-00FF');
  });

  test('includes fontStretch in extensions when provided', () => {
    const rules = [{ fontFamily: 'Inter', fontStretch: '75% 125%' }];
    const result = generateFontFaceTokens(rules);
    const key = Object.keys(result)[0];
    expect(result[key].$extensions['com.getds.fontFace'].fontStretch).toBe('75% 125%');
  });

  test('nulls out missing optional extension fields', () => {
    const rules = [{ fontFamily: 'Inter' }];
    const result = generateFontFaceTokens(rules);
    const key = Object.keys(result)[0];
    const ext = result[key].$extensions['com.getds.fontFace'];
    expect(ext.fontDisplay).toBeNull();
    expect(ext.unicodeRange).toBeNull();
    expect(ext.fontStretch).toBeNull();
    expect(ext.provider).toBeNull();
    expect(ext.linkTag).toBeNull();
  });
});
