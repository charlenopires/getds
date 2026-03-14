import { describe, test, expect } from 'bun:test';
import { generateFontFamilyTokens } from './generateFontFamilyTokens.js';

describe('generateFontFamilyTokens', () => {
  test('generates token for a font with stack', () => {
    const fonts = [{ stack: '"Inter", sans-serif', primary: 'Inter', generic: 'sans-serif' }];
    const tokens = generateFontFamilyTokens(fonts);
    expect(tokens['fontFamily-inter']).toBeDefined();
    expect(tokens['fontFamily-inter'].$type).toBe('fontFamily');
    expect(tokens['fontFamily-inter'].$value).toEqual(['Inter', 'sans-serif']);
    expect(tokens['fontFamily-inter'].$extensions['com.getds.primary']).toBe('Inter');
  });

  test('deduplicates by primary name', () => {
    const fonts = [
      { stack: '"Inter", sans-serif', primary: 'Inter', generic: 'sans-serif' },
      { stack: '"Inter", Arial, sans-serif', primary: 'Inter', generic: 'sans-serif' },
    ];
    const tokens = generateFontFamilyTokens(fonts);
    expect(Object.keys(tokens).length).toBe(1);
  });

  test('handles multiple distinct fonts', () => {
    const fonts = [
      { stack: '"Inter", sans-serif', primary: 'Inter', generic: 'sans-serif' },
      { stack: '"Fira Code", monospace', primary: 'Fira Code', generic: 'monospace' },
    ];
    const tokens = generateFontFamilyTokens(fonts);
    expect(Object.keys(tokens).length).toBe(2);
    expect(tokens['fontFamily-fira-code'].$value).toEqual(['Fira Code', 'monospace']);
  });

  test('returns empty for empty input', () => {
    expect(generateFontFamilyTokens([])).toEqual({});
    expect(generateFontFamilyTokens(null)).toEqual({});
  });

  test('skips entries without primary', () => {
    const fonts = [{ stack: 'sans-serif', primary: '', generic: 'sans-serif' }];
    expect(generateFontFamilyTokens(fonts)).toEqual({});
  });
});
