/**
 * Tests for extractCssSpacingVariables — CSS spacing variable extraction
 */

import { describe, test, expect } from 'bun:test';
import {
  extractCssSpacingVariables,
  matchSpacingCategory,
  resolveToPx,
} from './extractCssSpacingVariables.js';

// ---------------------------------------------------------------------------
// Unit: matchSpacingCategory
// ---------------------------------------------------------------------------

describe('matchSpacingCategory — classify CSS variable names by spacing category', () => {
  test('returns "spacing" for --spacing- prefix', () => {
    expect(matchSpacingCategory('--spacing-sm')).toBe('spacing');
  });

  test('returns "space" for --space- prefix', () => {
    expect(matchSpacingCategory('--space-4')).toBe('space');
  });

  test('returns "gap" for --gap- prefix', () => {
    expect(matchSpacingCategory('--gap-row')).toBe('gap');
  });

  test('returns "gutter" for --gutter- prefix', () => {
    expect(matchSpacingCategory('--gutter-lg')).toBe('gutter');
  });

  test('returns "margin" for --margin- prefix', () => {
    expect(matchSpacingCategory('--margin-top')).toBe('margin');
  });

  test('returns "padding" for --padding- prefix', () => {
    expect(matchSpacingCategory('--padding-x')).toBe('padding');
  });

  test('returns "size" for --size- prefix', () => {
    expect(matchSpacingCategory('--size-icon')).toBe('size');
  });

  test('returns null for non-spacing variable', () => {
    expect(matchSpacingCategory('--color-primary')).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(matchSpacingCategory('')).toBeNull();
  });

  test('is case-insensitive', () => {
    expect(matchSpacingCategory('--Spacing-MD')).toBe('spacing');
  });
});

// ---------------------------------------------------------------------------
// Unit: resolveToPx
// ---------------------------------------------------------------------------

describe('resolveToPx — resolve CSS values to pixel numbers', () => {
  test('resolves px values', () => {
    expect(resolveToPx('16px', {})).toBe(16);
  });

  test('resolves rem values using 16px base', () => {
    expect(resolveToPx('1.5rem', {})).toBe(24);
  });

  test('resolves em values using 16px base', () => {
    expect(resolveToPx('2em', {})).toBe(32);
  });

  test('resolves var() references from resolvedMap', () => {
    expect(resolveToPx('var(--spacing-sm)', { '--spacing-sm': '8px' })).toBe(8);
  });

  test('returns null for unresolvable values', () => {
    expect(resolveToPx('auto', {})).toBeNull();
  });

  test('returns null for percentage values', () => {
    expect(resolveToPx('50%', {})).toBeNull();
  });

  test('handles decimal px values', () => {
    expect(resolveToPx('0.5px', {})).toBe(0.5);
  });
});

// ---------------------------------------------------------------------------
// Unit: extractCssSpacingVariables
// ---------------------------------------------------------------------------

describe('extractCssSpacingVariables — extract spacing custom properties from stylesheets', () => {
  test('returns an object with spacingVariables array', () => {
    const result = extractCssSpacingVariables([]);
    expect(result).toHaveProperty('spacingVariables');
    expect(Array.isArray(result.spacingVariables)).toBe(true);
  });

  test('returns empty array for empty input', () => {
    const result = extractCssSpacingVariables([]);
    expect(result.spacingVariables).toHaveLength(0);
  });

  test('returns empty array for stylesheet with no spacing variables', () => {
    const result = extractCssSpacingVariables([':root { --color-bg: #fff; }']);
    expect(result.spacingVariables).toHaveLength(0);
  });

  test('extracts --spacing- variables', () => {
    const css = ':root { --spacing-sm: 8px; --spacing-md: 16px; }';
    const result = extractCssSpacingVariables([css]);
    expect(result.spacingVariables).toHaveLength(2);
    expect(result.spacingVariables[0]).toEqual(
      expect.objectContaining({ name: '--spacing-sm', value: '8px', category: 'spacing' })
    );
  });

  test('extracts --gap- variables', () => {
    const css = ':root { --gap-grid: 24px; }';
    const result = extractCssSpacingVariables([css]);
    expect(result.spacingVariables).toHaveLength(1);
    expect(result.spacingVariables[0].category).toBe('gap');
  });

  test('resolves px value from raw CSS', () => {
    const css = ':root { --spacing-lg: 32px; }';
    const result = extractCssSpacingVariables([css]);
    expect(result.spacingVariables[0].resolvedPx).toBe(32);
  });

  test('resolves rem value to px', () => {
    const css = ':root { --spacing-base: 1rem; }';
    const result = extractCssSpacingVariables([css]);
    expect(result.spacingVariables[0].resolvedPx).toBe(16);
  });

  test('uses resolvedMap when available', () => {
    const css = ':root { --spacing-xs: var(--base); }';
    const resolvedMap = { '--spacing-xs': '4px' };
    const result = extractCssSpacingVariables([css], resolvedMap);
    expect(result.spacingVariables[0].resolvedPx).toBe(4);
  });

  test('deduplicates variables by name', () => {
    const css1 = ':root { --spacing-sm: 8px; }';
    const css2 = ':root { --spacing-sm: 12px; }';
    const result = extractCssSpacingVariables([css1, css2]);
    expect(result.spacingVariables).toHaveLength(1);
    expect(result.spacingVariables[0].value).toBe('8px');
  });

  test('extracts from multiple stylesheets', () => {
    const css1 = ':root { --spacing-sm: 8px; }';
    const css2 = ':root { --padding-x: 16px; }';
    const result = extractCssSpacingVariables([css1, css2]);
    expect(result.spacingVariables).toHaveLength(2);
  });

  test('each entry has name, value, resolvedPx, and category', () => {
    const css = ':root { --spacing-md: 16px; }';
    const result = extractCssSpacingVariables([css]);
    const entry = result.spacingVariables[0];
    expect(entry).toHaveProperty('name');
    expect(entry).toHaveProperty('value');
    expect(entry).toHaveProperty('resolvedPx');
    expect(entry).toHaveProperty('category');
  });

  test('sets resolvedPx to null for unresolvable values', () => {
    const css = ':root { --spacing-auto: auto; }';
    const result = extractCssSpacingVariables([css]);
    expect(result.spacingVariables[0].resolvedPx).toBeNull();
  });
});
