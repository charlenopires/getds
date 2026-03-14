import { describe, test, expect } from 'bun:test';
import { extractCssAnimationVariables } from './extractCssAnimationVariables.js';

describe('extractCssAnimationVariables', () => {
  test('extracts duration variables', () => {
    const css = ':root { --transition-duration: 300ms; --animation-duration: 0.5s; }';
    const result = extractCssAnimationVariables([css]);
    expect(result.motionVariables.length).toBeGreaterThanOrEqual(1);
    const dur = result.motionVariables.find(v => v.name === '--transition-duration');
    expect(dur).toBeDefined();
    expect(dur.category).toBe('duration');
    expect(dur.value).toBe('300ms');
  });

  test('extracts easing variables', () => {
    const css = ':root { --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1); --custom-easing: ease; }';
    const result = extractCssAnimationVariables([css]);
    const ease = result.motionVariables.find(v => v.name === '--ease-in-out');
    expect(ease).toBeDefined();
    expect(ease.category).toBe('easing');
  });

  test('extracts delay variables', () => {
    const css = ':root { --animation-delay: 100ms; }';
    const result = extractCssAnimationVariables([css]);
    const delay = result.motionVariables.find(v => v.name === '--animation-delay');
    expect(delay).toBeDefined();
    expect(delay.category).toBe('delay');
  });

  test('returns empty for no motion variables', () => {
    const css = ':root { --color-primary: #333; --font-size: 16px; }';
    const result = extractCssAnimationVariables([css]);
    expect(result.motionVariables).toHaveLength(0);
  });

  test('deduplicates across multiple sheets', () => {
    const css1 = ':root { --transition-duration: 300ms; }';
    const css2 = ':root { --transition-duration: 300ms; }';
    const result = extractCssAnimationVariables([css1, css2]);
    const matches = result.motionVariables.filter(v => v.name === '--transition-duration');
    expect(matches).toHaveLength(1);
  });

  test('handles empty input', () => {
    const result = extractCssAnimationVariables([]);
    expect(result.motionVariables).toEqual([]);
  });
});
