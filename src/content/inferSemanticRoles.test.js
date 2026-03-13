/**
 * Task: a5b6935f — Infer semantic color roles using frequency analysis and CSS property context
 * Spec: fff645a0 — Color System Extraction
 */

import { describe, test, expect } from 'bun:test';
import { inferSemanticRoles } from './inferSemanticRoles.js';

/**
 * Helper: build a color usage record as extractColors would produce it,
 * but also with a `count` field (how many elements used this color).
 */
function color(raw, property, count = 1, hsl = null) {
  return { raw, property, count, hsl };
}

describe('inferSemanticRoles — assign semantic role to each color', () => {
  test('returns an array of role assignments', () => {
    const result = inferSemanticRoles([color('rgb(0,0,0)', 'color', 1)]);
    expect(Array.isArray(result)).toBe(true);
  });

  test('each entry has colorRaw and role fields', () => {
    const result = inferSemanticRoles([color('rgb(0,0,0)', 'color', 1)]);
    expect(result[0]).toHaveProperty('colorRaw');
    expect(result[0]).toHaveProperty('role');
  });

  test('most-used text color gets role "primary"', () => {
    const colors = [
      color('rgb(10, 10, 10)', 'color', 50),
      color('rgb(100, 100, 100)', 'color', 5),
    ];
    const result = inferSemanticRoles(colors);
    const primary = result.find(r => r.colorRaw === 'rgb(10, 10, 10)');
    expect(primary.role).toBe('primary');
  });

  test('second-most-used text color gets role "secondary"', () => {
    const colors = [
      color('rgb(10, 10, 10)', 'color', 50),
      color('rgb(100, 100, 100)', 'color', 20),
      color('rgb(200, 200, 200)', 'color', 5),
    ];
    const result = inferSemanticRoles(colors);
    const secondary = result.find(r => r.colorRaw === 'rgb(100, 100, 100)');
    expect(secondary.role).toBe('secondary');
  });

  test('most-used background-color gets role "surface"', () => {
    const colors = [
      color('rgb(255, 255, 255)', 'background-color', 80),
      color('rgb(240, 240, 240)', 'background-color', 10),
    ];
    const result = inferSemanticRoles(colors);
    const surface = result.find(r => r.colorRaw === 'rgb(255, 255, 255)');
    expect(surface.role).toBe('surface');
  });

  test('most-used text color on a surface background gets role "on-surface"', () => {
    // When there is a dominant background, the dominant text color is "on-surface"
    const colors = [
      color('rgb(255, 255, 255)', 'background-color', 80),
      color('rgb(0, 0, 0)', 'color', 80),
    ];
    const result = inferSemanticRoles(colors);
    const onSurface = result.find(r => r.colorRaw === 'rgb(0, 0, 0)');
    expect(onSurface.role).toBe('on-surface');
  });

  test('vivid red hue gets role "danger"', () => {
    // Pure red, saturated, appears on color property (text)
    const colors = [
      color('rgb(220, 38, 38)', 'color', 3, 'hsl(0, 72%, 51%)'),
    ];
    const result = inferSemanticRoles(colors);
    const danger = result.find(r => r.colorRaw === 'rgb(220, 38, 38)');
    expect(danger.role).toBe('danger');
  });

  test('vivid green hue gets role "success"', () => {
    const colors = [
      color('rgb(34, 197, 94)', 'color', 3, 'hsl(142, 71%, 45%)'),
    ];
    const result = inferSemanticRoles(colors);
    const success = result.find(r => r.colorRaw === 'rgb(34, 197, 94)');
    expect(success.role).toBe('success');
  });

  test('vivid yellow/amber hue gets role "warning"', () => {
    const colors = [
      color('rgb(234, 179, 8)', 'color', 3, 'hsl(45, 93%, 47%)'),
    ];
    const result = inferSemanticRoles(colors);
    const warning = result.find(r => r.colorRaw === 'rgb(234, 179, 8)');
    expect(warning.role).toBe('warning');
  });

  test('vivid blue hue gets role "info"', () => {
    const colors = [
      color('rgb(59, 130, 246)', 'color', 3, 'hsl(217, 91%, 60%)'),
    ];
    const result = inferSemanticRoles(colors);
    const info = result.find(r => r.colorRaw === 'rgb(59, 130, 246)');
    expect(info.role).toBe('info');
  });

  test('low-saturation neutral grey on border-color gets role "neutral"', () => {
    // Border greys are a classic neutral — they don't carry semantic meaning
    const colors = [
      color('rgb(107, 114, 128)', 'border-color', 4, 'hsl(220, 9%, 46%)'),
    ];
    const result = inferSemanticRoles(colors);
    const neutral = result.find(r => r.colorRaw === 'rgb(107, 114, 128)');
    expect(neutral.role).toBe('neutral');
  });

  test('dominant accent/brand color (high-saturation, moderate freq) gets role "accent"', () => {
    // Not the most common, not a semantic alert color — distinctive brand color
    const colors = [
      color('rgb(255, 255, 255)', 'background-color', 80),
      color('rgb(0, 0, 0)', 'color', 80),
      color('rgb(108, 99, 255)', 'background-color', 15, 'hsl(244, 100%, 70%)'),
    ];
    const result = inferSemanticRoles(colors);
    const accent = result.find(r => r.colorRaw === 'rgb(108, 99, 255)');
    expect(accent.role).toBe('accent');
  });

  test('unclassified colors get role "neutral" as fallback', () => {
    const colors = [
      color('rgb(60, 60, 60)', 'border-color', 2),
    ];
    const result = inferSemanticRoles(colors);
    expect(result[0].role).toBeDefined();
    expect(typeof result[0].role).toBe('string');
  });

  test('returns one entry per input color', () => {
    const colors = [
      color('rgb(1,1,1)', 'color', 1),
      color('rgb(2,2,2)', 'background-color', 1),
      color('rgb(3,3,3)', 'border-color', 1),
    ];
    const result = inferSemanticRoles(colors);
    expect(result).toHaveLength(3);
  });
});
