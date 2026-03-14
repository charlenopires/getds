import { describe, test, expect } from 'bun:test';
import { detectFluidTypography } from './detectFluidTypography.js';

describe('detectFluidTypography', () => {
  test('returns empty array for no stylesheets', () => {
    const { fluidTypography } = detectFluidTypography([]);
    expect(fluidTypography).toEqual([]);
  });

  test('returns empty array for CSS without fluid typography', () => {
    const { fluidTypography } = detectFluidTypography(['body { font-size: 16px; }']);
    expect(fluidTypography).toEqual([]);
  });

  test('detects clamp() font-size', () => {
    const css = 'h1 { font-size: clamp(2rem, 5vw, 3.5rem); }';
    const { fluidTypography } = detectFluidTypography([css]);
    expect(fluidTypography).toHaveLength(1);
    expect(fluidTypography[0].type).toBe('clamp');
    expect(fluidTypography[0].min).toBe('2rem');
    expect(fluidTypography[0].preferred).toBe('5vw');
    expect(fluidTypography[0].max).toBe('3.5rem');
  });

  test('detects calc() font-size with vw', () => {
    const css = '.title { font-size: calc(1rem + 2vw); }';
    const { fluidTypography } = detectFluidTypography([css]);
    expect(fluidTypography).toHaveLength(1);
    expect(fluidTypography[0].type).toBe('calc');
  });

  test('detects viewport-unit font-size', () => {
    const css = '.hero { font-size: 5vw; }';
    const { fluidTypography } = detectFluidTypography([css]);
    expect(fluidTypography).toHaveLength(1);
    expect(fluidTypography[0].type).toBe('viewport-unit');
  });

  test('captures selector', () => {
    const css = '.hero h1 { font-size: clamp(1rem, 3vw, 2rem); }';
    const { fluidTypography } = detectFluidTypography([css]);
    expect(fluidTypography[0].selector).toBe('.hero h1');
  });

  test('deduplicates identical declarations', () => {
    const css = 'h1 { font-size: clamp(2rem, 5vw, 3.5rem); }';
    const { fluidTypography } = detectFluidTypography([css, css]);
    expect(fluidTypography).toHaveLength(1);
  });

  test('detects multiple fluid declarations', () => {
    const css = `
      h1 { font-size: clamp(2rem, 5vw, 3.5rem); }
      h2 { font-size: clamp(1.5rem, 3vw, 2.5rem); }
    `;
    const { fluidTypography } = detectFluidTypography([css]);
    expect(fluidTypography).toHaveLength(2);
  });
});
