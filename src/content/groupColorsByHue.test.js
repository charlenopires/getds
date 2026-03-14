import { describe, test, expect } from 'bun:test';
import { groupColorsByHue } from './groupColorsByHue.js';

describe('groupColorsByHue', () => {
  test('classifies pure red', () => {
    const result = groupColorsByHue([{ hex: '#ff0000', hsl: 'hsl(0, 100%, 50%)' }]);
    expect(result.length).toBe(1);
    expect(result[0].family).toBe('red');
  });
  test('classifies pure blue', () => {
    const result = groupColorsByHue([{ hex: '#0000ff', hsl: 'hsl(240, 100%, 50%)' }]);
    expect(result[0].family).toBe('blue');
  });
  test('classifies pure green', () => {
    const result = groupColorsByHue([{ hex: '#00ff00', hsl: 'hsl(120, 100%, 50%)' }]);
    expect(result[0].family).toBe('green');
  });
  test('classifies white (low saturation, high lightness)', () => {
    const result = groupColorsByHue([{ hex: '#fafafa', hsl: 'hsl(0, 0%, 98%)' }]);
    expect(result[0].family).toBe('white');
  });
  test('classifies black (low saturation, low lightness)', () => {
    const result = groupColorsByHue([{ hex: '#0a0a0a', hsl: 'hsl(0, 0%, 4%)' }]);
    expect(result[0].family).toBe('black');
  });
  test('classifies grey (very low saturation)', () => {
    const result = groupColorsByHue([{ hex: '#808080', hsl: 'hsl(0, 0%, 50%)' }]);
    expect(result[0].family).toBe('grey');
  });
  test('classifies orange', () => {
    const result = groupColorsByHue([{ hex: '#ff8c00', hsl: 'hsl(33, 100%, 50%)' }]);
    expect(result[0].family).toBe('orange');
  });
  test('classifies purple', () => {
    const result = groupColorsByHue([{ hex: '#8b00ff', hsl: 'hsl(270, 100%, 50%)' }]);
    expect(result[0].family).toBe('purple');
  });
  test('groups multiple colors and sorts by size', () => {
    const colors = [
      { hex: '#ff0000', hsl: 'hsl(0, 100%, 50%)' },
      { hex: '#ff3333', hsl: 'hsl(0, 100%, 60%)' },
      { hex: '#0000ff', hsl: 'hsl(240, 100%, 50%)' },
    ];
    const result = groupColorsByHue(colors);
    expect(result[0].family).toBe('red');
    expect(result[0].colors.length).toBe(2);
    expect(result[1].family).toBe('blue');
  });
  test('returns empty for empty input', () => {
    expect(groupColorsByHue([])).toEqual([]);
  });
  test('skips colors without hsl', () => {
    const result = groupColorsByHue([{ hex: '#ff0000' }]);
    expect(result).toEqual([]);
  });
});
