import { describe, test, expect } from 'bun:test';
import { detectFluidSpacing } from './detectFluidSpacing.js';

describe('detectFluidSpacing', () => {
  test('returns empty array for no stylesheets', () => {
    const { fluidSpacing } = detectFluidSpacing([]);
    expect(fluidSpacing).toEqual([]);
  });

  test('detects clamp() on padding', () => {
    const css = ['.hero { padding: clamp(1rem, 5vw, 3rem); }'];
    const { fluidSpacing } = detectFluidSpacing(css);
    expect(fluidSpacing).toHaveLength(1);
    expect(fluidSpacing[0].selector).toBe('.hero');
    expect(fluidSpacing[0].property).toBe('padding');
    expect(fluidSpacing[0].type).toBe('clamp');
    expect(fluidSpacing[0].min).toBe('1rem');
    expect(fluidSpacing[0].preferred).toBe('5vw');
    expect(fluidSpacing[0].max).toBe('3rem');
  });

  test('detects calc() on margin', () => {
    const css = ['.section { margin-top: calc(2rem + 2vw); }'];
    const { fluidSpacing } = detectFluidSpacing(css);
    expect(fluidSpacing).toHaveLength(1);
    expect(fluidSpacing[0].type).toBe('calc');
  });

  test('detects viewport units on gap', () => {
    const css = ['.grid { gap: 2vw; }'];
    const { fluidSpacing } = detectFluidSpacing(css);
    expect(fluidSpacing).toHaveLength(1);
    expect(fluidSpacing[0].type).toBe('viewport-unit');
  });

  test('detects min() and max() functions', () => {
    const css = ['.container { max-width: min(90vw, 1200px); width: max(300px, 50vw); }'];
    const { fluidSpacing } = detectFluidSpacing(css);
    expect(fluidSpacing.length).toBeGreaterThanOrEqual(1);
    const minEntry = fluidSpacing.find(e => e.type === 'min');
    expect(minEntry).toBeDefined();
  });

  test('deduplicates identical declarations', () => {
    const css = [
      '.a { padding: clamp(1rem, 3vw, 2rem); }',
      '.a { padding: clamp(1rem, 3vw, 2rem); }',
    ];
    const { fluidSpacing } = detectFluidSpacing(css);
    expect(fluidSpacing).toHaveLength(1);
  });

  test('handles multiple properties in one rule', () => {
    const css = ['.box { padding: clamp(1rem, 2vw, 3rem); margin: calc(1rem + 1vw); }'];
    const { fluidSpacing } = detectFluidSpacing(css);
    expect(fluidSpacing).toHaveLength(2);
  });

  test('ignores non-spacing properties', () => {
    const css = ['.text { color: calc(100); font-size: clamp(1rem, 2vw, 3rem); }'];
    const { fluidSpacing } = detectFluidSpacing(css);
    // font-size is not in spacing properties, and color is not a spacing property
    expect(fluidSpacing).toHaveLength(0);
  });
});
