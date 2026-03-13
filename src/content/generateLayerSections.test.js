/**
 * Task: 440be8e3 — Structure document with 7 H2 sections corresponding to the 7 extraction layers
 * Spec: b0d5a227 — Markdown Report Generation
 */

import { describe, test, expect, mock } from 'bun:test';
import { generateLayerSections, LAYER_ORDER } from './generateLayerSections.js';

const LAYERS = [
  'visual-foundations',
  'tokens',
  'components',
  'layout-patterns',
  'animations',
  'iconography',
  'accessibility',
];

const makePayload = () =>
  Object.fromEntries(LAYERS.map(l => [l, { layer: l, data: 'stub' }]));

describe('generateLayerSections — 7 H2 sections for extraction layers', () => {
  test('returns a string', () => {
    expect(typeof generateLayerSections(makePayload())).toBe('string');
  });

  test('produces exactly 7 H2 section headers', () => {
    const result = generateLayerSections(makePayload());
    const h2s = result.match(/^## .+/gm);
    expect(h2s).not.toBeNull();
    expect(h2s.length).toBe(7);
  });

  test('LAYER_ORDER exports the 7 canonical layer names in order', () => {
    expect(LAYER_ORDER).toEqual(LAYERS);
  });

  test('sections appear in canonical layer order', () => {
    const result = generateLayerSections(makePayload());
    // Each layer name is embedded in its section's JSON content ("layer": "…")
    const lower = result.toLowerCase();
    const positions = LAYERS.map(l => lower.indexOf(l));
    // Each position should be greater than the previous
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });

  test('includes visual-foundations section', () => {
    const result = generateLayerSections(makePayload());
    expect(result.toLowerCase()).toContain('visual');
  });

  test('includes tokens section', () => {
    const result = generateLayerSections(makePayload());
    expect(result.toLowerCase()).toContain('token');
  });

  test('includes components section', () => {
    const result = generateLayerSections(makePayload());
    expect(result.toLowerCase()).toContain('component');
  });

  test('includes layout-patterns section', () => {
    const result = generateLayerSections(makePayload());
    expect(result.toLowerCase()).toContain('layout');
  });

  test('includes animations section', () => {
    const result = generateLayerSections(makePayload());
    expect(result.toLowerCase()).toContain('animation');
  });

  test('includes iconography section', () => {
    const result = generateLayerSections(makePayload());
    expect(result.toLowerCase()).toContain('icon');
  });

  test('includes accessibility section', () => {
    const result = generateLayerSections(makePayload());
    expect(result.toLowerCase()).toContain('accessib');
  });

  test('each section header contains an emoji', () => {
    const result = generateLayerSections(makePayload());
    const h2s = result.match(/^## .+/gm);
    // Emoji are non-ASCII; verify each header has a non-ASCII character
    h2s.forEach(header => {
      expect(/[^\x00-\x7F]/.test(header)).toBe(true);
    });
  });

  test('handles empty payload gracefully — missing layers produce empty sections', () => {
    expect(() => generateLayerSections({})).not.toThrow();
    const result = generateLayerSections({});
    const h2s = result.match(/^## .+/gm);
    expect(h2s.length).toBe(7);
  });

  test('custom renderer is called for a given layer', () => {
    const fn = mock(() => 'custom content');
    generateLayerSections(makePayload(), { 'visual-foundations': fn });
    expect(fn).toHaveBeenCalled();
  });

  test('custom renderer output appears in that section', () => {
    const result = generateLayerSections(makePayload(), {
      'visual-foundations': () => 'CUSTOM_OUTPUT',
    });
    expect(result).toContain('CUSTOM_OUTPUT');
  });

  test('sections are separated by blank lines', () => {
    const result = generateLayerSections(makePayload());
    expect(result).toContain('\n\n');
  });
});
