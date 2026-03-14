/**
 * Tests for generateVariableFontTokens — W3C DTCG variable font token generation
 */

import { describe, test, expect } from 'bun:test';
import { generateVariableFontTokens } from './generateVariableFontTokens.js';

describe('generateVariableFontTokens', () => {
  test('returns an empty object when called with no arguments', () => {
    expect(generateVariableFontTokens()).toEqual({});
  });

  test('returns an empty object for an empty array', () => {
    expect(generateVariableFontTokens([])).toEqual({});
  });

  test('skips entries without a family', () => {
    const fonts = [{ axes: [{ tag: 'wght', min: 100, max: 900 }] }];
    expect(generateVariableFontTokens(fonts)).toEqual({});
  });

  test('generates a token for a variable font', () => {
    const fonts = [{ family: 'Inter', axes: [{ tag: 'wght', min: 100, max: 900 }] }];
    const result = generateVariableFontTokens(fonts);
    expect(result).toHaveProperty('fontVariable-inter');
    const token = result['fontVariable-inter'];
    expect(token.$type).toBe('fontFamily');
    expect(token.$value).toEqual(['Inter']);
  });

  test('includes axes in extensions', () => {
    const axes = [{ tag: 'wght', min: 100, max: 900 }, { tag: 'wdth', min: 75, max: 125 }];
    const fonts = [{ family: 'Inter', axes }];
    const result = generateVariableFontTokens(fonts);
    expect(result['fontVariable-inter'].$extensions['com.getds.variableFont'].axes).toEqual(axes);
  });

  test('includes usedSettings in extensions', () => {
    const usedSettings = [{ property: 'font-weight', value: '600' }];
    const fonts = [{ family: 'Inter', usedSettings }];
    const result = generateVariableFontTokens(fonts);
    expect(result['fontVariable-inter'].$extensions['com.getds.variableFont'].usedSettings).toEqual(usedSettings);
  });

  test('includes source in extensions', () => {
    const fonts = [{ family: 'Inter', source: 'google-fonts' }];
    const result = generateVariableFontTokens(fonts);
    expect(result['fontVariable-inter'].$extensions['com.getds.variableFont'].source).toBe('google-fonts');
  });

  test('defaults optional fields to empty array or null', () => {
    const fonts = [{ family: 'Inter' }];
    const result = generateVariableFontTokens(fonts);
    const ext = result['fontVariable-inter'].$extensions['com.getds.variableFont'];
    expect(ext.axes).toEqual([]);
    expect(ext.usedSettings).toEqual([]);
    expect(ext.source).toBeNull();
  });

  test('avoids duplicate tokens for the same family', () => {
    const fonts = [
      { family: 'Inter', axes: [{ tag: 'wght', min: 100, max: 900 }] },
      { family: 'Inter', axes: [{ tag: 'wght', min: 200, max: 800 }] },
    ];
    const result = generateVariableFontTokens(fonts);
    expect(Object.keys(result)).toHaveLength(1);
  });

  test('generates separate tokens for different families', () => {
    const fonts = [
      { family: 'Inter', axes: [{ tag: 'wght', min: 100, max: 900 }] },
      { family: 'Roboto Flex', axes: [{ tag: 'wght', min: 100, max: 1000 }] },
    ];
    const result = generateVariableFontTokens(fonts);
    expect(Object.keys(result)).toHaveLength(2);
    expect(result).toHaveProperty('fontVariable-inter');
    expect(result).toHaveProperty('fontVariable-roboto-flex');
  });

  test('slugifies family name with special characters', () => {
    const fonts = [{ family: 'Source Code Pro' }];
    const result = generateVariableFontTokens(fonts);
    expect(result).toHaveProperty('fontVariable-source-code-pro');
  });
});
