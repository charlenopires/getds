/**
 * Task: a2da9c9d — Generate executive summary section with extraction counts
 * Spec: b0d5a227 — Markdown Report Generation
 */

import { describe, test, expect } from 'bun:test';
import { generateExecutiveSummary } from './generateExecutiveSummary.js';

const makePayload = (overrides = {}) => ({
  'visual-foundations': {
    colors: [
      { raw: '#ff0000', hex: '#ff0000' },
      { raw: '#00ff00', hex: '#00ff00' },
      { raw: '#0000ff', hex: '#0000ff' },
    ],
    fonts: [
      { stack: '"Inter", sans-serif', primary: 'Inter', generic: 'sans-serif' },
      { stack: '"Roboto Mono", monospace', primary: 'Roboto Mono', generic: 'monospace' },
    ],
  },
  tokens: {},
  components: {
    buttons: [{ tag: 'button', classes: [] }],
    cards: [{ tag: 'div', classes: [] }],
    inputs: [{ tag: 'input', classes: [] }],
  },
  'layout-patterns': {
    typeScale: { steps: [12, 14, 16, 20, 24, 32] },
    spacingGrid: { baseUnit: 8, scale: [4, 8, 12, 16, 24, 32, 48, 64] },
  },
  animations: {
    cssAnimations: [{ name: 'fadeIn', duration: '300ms' }],
    keyframes: [{ name: 'fadeIn', stops: [] }],
    transitions: [],
  },
  accessibility: {
    issues: [
      { type: 'missing-alt', severity: 'critical', element: 'img', message: 'Missing alt' },
    ],
  },
  ...overrides,
});

describe('generateExecutiveSummary — produce executive summary Markdown section', () => {
  test('returns a string', () => {
    expect(typeof generateExecutiveSummary(makePayload())).toBe('string');
  });

  test('includes an H2 section header', () => {
    const result = generateExecutiveSummary(makePayload());
    expect(result).toMatch(/^## /m);
  });

  test('includes unique colours count', () => {
    const result = generateExecutiveSummary(makePayload());
    expect(result).toContain('3');
    expect(result.toLowerCase()).toContain('colour');
  });

  test('includes font families count', () => {
    const result = generateExecutiveSummary(makePayload());
    expect(result).toContain('2');
    expect(result.toLowerCase()).toContain('font');
  });

  test('includes type scale steps count', () => {
    const result = generateExecutiveSummary(makePayload());
    expect(result).toContain('6');
    expect(result.toLowerCase()).toContain('type scale');
  });

  test('includes spacing steps count', () => {
    const result = generateExecutiveSummary(makePayload());
    expect(result).toContain('8');
    expect(result.toLowerCase()).toContain('spacing');
  });

  test('includes components detected count', () => {
    const result = generateExecutiveSummary(makePayload());
    expect(result).toContain('3');
    expect(result.toLowerCase()).toContain('component');
  });

  test('includes animations found count', () => {
    const result = generateExecutiveSummary(makePayload());
    // cssAnimations.length (1) + keyframes.length (1) = 2
    expect(result).toContain('2');
    expect(result.toLowerCase()).toContain('animation');
  });

  test('includes accessibility issues count', () => {
    const result = generateExecutiveSummary(makePayload());
    expect(result).toContain('1');
    expect(result.toLowerCase()).toContain('accessib');
  });

  test('returns zeros for empty payload', () => {
    const result = generateExecutiveSummary({});
    expect(result).toContain('0');
  });

  test('handles missing visual-foundations gracefully', () => {
    const payload = makePayload();
    delete payload['visual-foundations'];
    expect(() => generateExecutiveSummary(payload)).not.toThrow();
  });

  test('handles missing layout-patterns gracefully', () => {
    const payload = makePayload();
    delete payload['layout-patterns'];
    expect(() => generateExecutiveSummary(payload)).not.toThrow();
  });

  test('handles missing animations gracefully', () => {
    const payload = makePayload();
    delete payload.animations;
    expect(() => generateExecutiveSummary(payload)).not.toThrow();
  });

  test('handles missing accessibility gracefully', () => {
    const payload = makePayload();
    delete payload.accessibility;
    expect(() => generateExecutiveSummary(payload)).not.toThrow();
  });

  test('renders as a Markdown table with pipe separators', () => {
    const result = generateExecutiveSummary(makePayload());
    expect(result).toMatch(/\|.*\|/);
  });
});
