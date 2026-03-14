import { describe, test, expect } from 'bun:test';
import { generateBorderTokens } from './generateBorderTokens.js';

describe('generateBorderTokens', () => {
  test('generates border token with color/width/style', () => {
    const borders = [{ width: '1px', style: 'solid', color: 'rgb(229, 231, 235)', count: 15 }];
    const tokens = generateBorderTokens(borders);
    expect(tokens['border-1']).toBeDefined();
    expect(tokens['border-1'].$type).toBe('border');
    expect(tokens['border-1'].$value.width).toBe('1px');
    expect(tokens['border-1'].$value.style).toBe('solid');
  });

  test('generates borderWidth dimension tokens', () => {
    const borders = [
      { width: '1px', style: 'solid', color: '#000', count: 5 },
      { width: '2px', style: 'solid', color: '#000', count: 3 },
    ];
    const tokens = generateBorderTokens(borders);
    expect(tokens['borderWidth-1'].$value).toBe('1px');
    expect(tokens['borderWidth-2'].$value).toBe('2px');
  });

  test('returns empty for empty input', () => {
    expect(generateBorderTokens([])).toEqual({});
    expect(generateBorderTokens(null)).toEqual({});
  });

  test('includes usage count in extensions', () => {
    const borders = [{ width: '1px', style: 'solid', color: '#ccc', count: 42 }];
    const tokens = generateBorderTokens(borders);
    expect(tokens['border-1'].$extensions['com.getds.usageCount']).toBe(42);
  });
});
