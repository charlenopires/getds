/**
 * Task: ab2bc922 — Detect CSS custom properties used for colors and preserve as token references
 * Spec: fff645a0 — Color System Extraction
 */

import { describe, test, expect } from 'bun:test';
import { extractCssColorVariables, cssVarNameToTokenName } from './extractCssVariables.js';

// ---------------------------------------------------------------------------
// Unit: cssVarNameToTokenName
// ---------------------------------------------------------------------------

describe('cssVarNameToTokenName — convert CSS variable name to token key', () => {
  test('strips leading -- from variable name', () => {
    expect(cssVarNameToTokenName('--color-primary')).toBe('color-primary');
  });

  test('converts camelCase segments to kebab-case', () => {
    expect(cssVarNameToTokenName('--colorPrimary')).toBe('color-primary');
  });

  test('preserves existing kebab-case names unchanged', () => {
    expect(cssVarNameToTokenName('--brand-accent')).toBe('brand-accent');
  });

  test('lowercases the result', () => {
    expect(cssVarNameToTokenName('--Color-PRIMARY')).toBe('color-primary');
  });

  test('handles single-word variable', () => {
    expect(cssVarNameToTokenName('--red')).toBe('red');
  });
});

// ---------------------------------------------------------------------------
// Unit: extractCssColorVariables
// ---------------------------------------------------------------------------

describe('extractCssColorVariables — find CSS custom properties that resolve to colors', () => {
  test('returns an array', () => {
    const result = extractCssColorVariables('', {});
    expect(Array.isArray(result)).toBe(true);
  });

  test('finds a color custom property in :root', () => {
    const css = `:root { --color-brand: #6c63ff; }`;
    const result = extractCssColorVariables(css, {});
    expect(result).toContainEqual(
      expect.objectContaining({ name: '--color-brand', value: '#6c63ff' })
    );
  });

  test('finds rgb() value in custom property', () => {
    const css = `:root { --surface: rgb(255, 255, 255); }`;
    const result = extractCssColorVariables(css, {});
    expect(result).toContainEqual(
      expect.objectContaining({ name: '--surface', value: 'rgb(255, 255, 255)' })
    );
  });

  test('ignores non-color custom properties', () => {
    const css = `:root { --spacing-sm: 8px; --font-size: 16px; }`;
    const result = extractCssColorVariables(css, {});
    expect(result).toHaveLength(0);
  });

  test('includes tokenName field derived from the variable name', () => {
    const css = `:root { --color-primary: #0000ff; }`;
    const result = extractCssColorVariables(css, {});
    const entry = result.find(r => r.name === '--color-primary');
    expect(entry).toHaveProperty('tokenName');
    expect(entry.tokenName).toBe('color-primary');
  });

  test('finds multiple color variables', () => {
    const css = `:root {
      --color-bg: #ffffff;
      --color-text: rgb(0, 0, 0);
      --color-accent: hsl(244, 100%, 70%);
    }`;
    const result = extractCssColorVariables(css, {});
    expect(result.length).toBeGreaterThanOrEqual(3);
  });

  test('resolves var() reference when value map is provided', () => {
    // --color-text uses var(--color-brand) which resolves to #6c63ff
    const css = `:root { --color-brand: #6c63ff; --color-text: var(--color-brand); }`;
    const resolvedMap = { '--color-brand': '#6c63ff' };
    const result = extractCssColorVariables(css, resolvedMap);
    const textEntry = result.find(r => r.name === '--color-text');
    expect(textEntry).toBeDefined();
    expect(textEntry.resolvedValue).toBe('#6c63ff');
  });

  test('each entry has name, value, and tokenName fields', () => {
    const css = `:root { --primary: #ff0000; }`;
    const result = extractCssColorVariables(css, {});
    const entry = result[0];
    expect(entry).toHaveProperty('name');
    expect(entry).toHaveProperty('value');
    expect(entry).toHaveProperty('tokenName');
  });

  test('returns empty array for empty CSS', () => {
    expect(extractCssColorVariables('', {})).toHaveLength(0);
  });

  test('handles hsl() color values', () => {
    const css = `:root { --accent: hsl(120, 100%, 50%); }`;
    const result = extractCssColorVariables(css, {});
    expect(result).toContainEqual(
      expect.objectContaining({ name: '--accent', value: 'hsl(120, 100%, 50%)' })
    );
  });
});
