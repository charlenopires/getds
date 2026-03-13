/**
 * Task: ca22cba1 — Detect and flag icon fonts by name and unicode-range patterns
 * Spec: f7625baf — Typography System Extraction
 */

import { describe, test, expect } from 'bun:test';
import { detectIconFonts, isIconFont } from './detectIconFonts.js';

describe('isIconFont — classify a single font-family name as icon font', () => {
  test('detects "Font Awesome 6 Free" as icon font', () => {
    expect(isIconFont('Font Awesome 6 Free')).toBe(true);
  });

  test('detects "Font Awesome 5 Free" as icon font', () => {
    expect(isIconFont('Font Awesome 5 Free')).toBe(true);
  });

  test('detects "FontAwesome" as icon font', () => {
    expect(isIconFont('FontAwesome')).toBe(true);
  });

  test('detects "Material Icons" as icon font', () => {
    expect(isIconFont('Material Icons')).toBe(true);
  });

  test('detects "Material Symbols Outlined" as icon font', () => {
    expect(isIconFont('Material Symbols Outlined')).toBe(true);
  });

  test('detects "Ionicons" as icon font', () => {
    expect(isIconFont('Ionicons')).toBe(true);
  });

  test('detects "Glyphicons Halflings" as icon font', () => {
    expect(isIconFont('Glyphicons Halflings')).toBe(true);
  });

  test('detects "feather" as icon font (case-insensitive)', () => {
    expect(isIconFont('feather')).toBe(true);
  });

  test('detects "remixicon" as icon font', () => {
    expect(isIconFont('remixicon')).toBe(true);
  });

  test('does NOT flag "Inter" as icon font', () => {
    expect(isIconFont('Inter')).toBe(false);
  });

  test('does NOT flag "Roboto" as icon font', () => {
    expect(isIconFont('Roboto')).toBe(false);
  });

  test('does NOT flag "Georgia" as icon font', () => {
    expect(isIconFont('Georgia')).toBe(false);
  });

  test('case-insensitive matching', () => {
    expect(isIconFont('MATERIAL ICONS')).toBe(true);
    expect(isIconFont('font awesome 6 free')).toBe(true);
  });
});

describe('detectIconFonts — filter icon fonts from a font list', () => {
  test('returns an array', () => {
    expect(Array.isArray(detectIconFonts([]))).toBe(true);
  });

  test('returns empty array for no fonts', () => {
    expect(detectIconFonts([])).toHaveLength(0);
  });

  test('flags Font Awesome in a mixed font list', () => {
    const fonts = [
      { primary: 'Inter',              stack: '"Inter", sans-serif' },
      { primary: 'Font Awesome 6 Free', stack: '"Font Awesome 6 Free"' },
    ];
    const result = detectIconFonts(fonts);
    expect(result).toHaveLength(1);
    expect(result[0].primary).toBe('Font Awesome 6 Free');
  });

  test('flags Material Icons in a mixed font list', () => {
    const fonts = [
      { primary: 'Roboto',          stack: '"Roboto", sans-serif' },
      { primary: 'Material Icons',  stack: '"Material Icons"' },
    ];
    const result = detectIconFonts(fonts);
    expect(result[0].primary).toBe('Material Icons');
  });

  test('returns no icon fonts when none present', () => {
    const fonts = [
      { primary: 'Inter',  stack: '"Inter", sans-serif' },
      { primary: 'Roboto', stack: '"Roboto", sans-serif' },
    ];
    expect(detectIconFonts(fonts)).toHaveLength(0);
  });

  test('each result entry has primary, stack, and isIconFont=true fields', () => {
    const fonts = [{ primary: 'Material Icons', stack: '"Material Icons"' }];
    const result = detectIconFonts(fonts);
    expect(result[0]).toHaveProperty('primary');
    expect(result[0]).toHaveProperty('stack');
    expect(result[0].isIconFont).toBe(true);
  });

  test('detects multiple icon fonts in one list', () => {
    const fonts = [
      { primary: 'Font Awesome 6 Free', stack: '"Font Awesome 6 Free"' },
      { primary: 'Material Icons',       stack: '"Material Icons"' },
      { primary: 'Inter',                stack: '"Inter", sans-serif' },
    ];
    const result = detectIconFonts(fonts);
    expect(result).toHaveLength(2);
  });
});
