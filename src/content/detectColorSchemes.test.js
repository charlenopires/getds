/**
 * Task: 9ef08351 — Detect dark/light mode palettes via prefers-color-scheme analysis
 * Spec: fff645a0 — Color System Extraction
 */

import { describe, test, expect } from 'bun:test';
import { detectColorSchemes, parseMediaColorRules } from './detectColorSchemes.js';

// ---------------------------------------------------------------------------
// Unit tests for the CSS parser
// ---------------------------------------------------------------------------

describe('parseMediaColorRules — extract colors from @media prefers-color-scheme blocks', () => {
  test('extracts colors from a dark-mode media block', () => {
    const css = `
      @media (prefers-color-scheme: dark) {
        body { background-color: rgb(18, 18, 18); color: rgb(255, 255, 255); }
      }
    `;
    const result = parseMediaColorRules(css);
    expect(result.dark).toContainEqual(
      expect.objectContaining({ value: 'rgb(18, 18, 18)', property: 'background-color' })
    );
    expect(result.dark).toContainEqual(
      expect.objectContaining({ value: 'rgb(255, 255, 255)', property: 'color' })
    );
  });

  test('extracts colors from a light-mode media block', () => {
    const css = `
      @media (prefers-color-scheme: light) {
        body { background-color: rgb(255, 255, 255); color: rgb(0, 0, 0); }
      }
    `;
    const result = parseMediaColorRules(css);
    expect(result.light).toContainEqual(
      expect.objectContaining({ value: 'rgb(255, 255, 255)', property: 'background-color' })
    );
  });

  test('returns both dark and light arrays even when one is absent', () => {
    const css = `@media (prefers-color-scheme: dark) { body { color: red; } }`;
    const result = parseMediaColorRules(css);
    expect(Array.isArray(result.dark)).toBe(true);
    expect(Array.isArray(result.light)).toBe(true);
  });

  test('returns empty arrays for CSS with no prefers-color-scheme blocks', () => {
    const css = `body { color: rgb(0, 0, 0); }`;
    const result = parseMediaColorRules(css);
    expect(result.dark).toHaveLength(0);
    expect(result.light).toHaveLength(0);
  });

  test('handles multiple rules inside a dark-mode block', () => {
    const css = `
      @media (prefers-color-scheme: dark) {
        h1 { color: rgb(200, 200, 200); }
        a  { color: rgb(100, 149, 237); }
      }
    `;
    const result = parseMediaColorRules(css);
    expect(result.dark.length).toBeGreaterThanOrEqual(2);
  });

  test('deduplicated same color value in the same scheme', () => {
    const css = `
      @media (prefers-color-scheme: dark) {
        h1 { color: rgb(255, 255, 255); }
        p  { color: rgb(255, 255, 255); }
      }
    `;
    const result = parseMediaColorRules(css);
    const whites = result.dark.filter(r => r.value === 'rgb(255, 255, 255)');
    expect(whites.length).toBe(1);
  });

  test('extracts hex colors from media blocks', () => {
    const css = `
      @media (prefers-color-scheme: dark) {
        body { background-color: #121212; }
      }
    `;
    const result = parseMediaColorRules(css);
    expect(result.dark).toContainEqual(
      expect.objectContaining({ value: '#121212' })
    );
  });
});

// ---------------------------------------------------------------------------
// Integration tests for detectColorSchemes (operates on document.styleSheets)
// ---------------------------------------------------------------------------

describe('detectColorSchemes — scan document stylesheets', () => {
  test('returns an object with dark and light palette arrays', () => {
    const result = detectColorSchemes([]);
    expect(result).toHaveProperty('dark');
    expect(result).toHaveProperty('light');
    expect(Array.isArray(result.dark)).toBe(true);
    expect(Array.isArray(result.light)).toBe(true);
  });

  test('returns empty palettes when no stylesheets provided', () => {
    const result = detectColorSchemes([]);
    expect(result.dark).toHaveLength(0);
    expect(result.light).toHaveLength(0);
  });

  test('collects dark-mode colors from provided stylesheet text', () => {
    const sheets = [
      `@media (prefers-color-scheme: dark) { body { background-color: rgb(10, 10, 10); } }`,
    ];
    const result = detectColorSchemes(sheets);
    expect(result.dark).toContainEqual(
      expect.objectContaining({ value: 'rgb(10, 10, 10)' })
    );
  });

  test('merges colors from multiple stylesheets', () => {
    const sheets = [
      `@media (prefers-color-scheme: dark) { body { color: rgb(255, 255, 255); } }`,
      `@media (prefers-color-scheme: dark) { a { color: rgb(100, 149, 237); } }`,
    ];
    const result = detectColorSchemes(sheets);
    const values = result.dark.map(r => r.value);
    expect(values).toContain('rgb(255, 255, 255)');
    expect(values).toContain('rgb(100, 149, 237)');
  });

  test('separates dark and light colors correctly', () => {
    const sheets = [
      `
        @media (prefers-color-scheme: dark)  { body { color: rgb(255,255,255); } }
        @media (prefers-color-scheme: light) { body { color: rgb(0,0,0); } }
      `,
    ];
    const result = detectColorSchemes(sheets);
    const darkValues  = result.dark.map(r => r.value);
    const lightValues = result.light.map(r => r.value);
    expect(darkValues).toContain('rgb(255,255,255)');
    expect(lightValues).toContain('rgb(0,0,0)');
  });
});
