/**
 * Task: 860f64f1 — Detect CSS background-image patterns
 * Spec: 4e6f0589 — Iconography and Asset Detection
 */

import { describe, test, expect } from 'bun:test';
import { classifyBackgroundImage, extractBackgroundPatterns } from './detectBackgroundPatterns.js';

// ── classifyBackgroundImage ───────────────────────────────────────────────────

describe('classifyBackgroundImage — classify a background-image CSS value', () => {
  test('gradient: linear-gradient', () => {
    expect(classifyBackgroundImage('linear-gradient(red, blue)')).toBe('gradient');
  });

  test('gradient: radial-gradient', () => {
    expect(classifyBackgroundImage('radial-gradient(circle, #fff, #000)')).toBe('gradient');
  });

  test('gradient: conic-gradient', () => {
    expect(classifyBackgroundImage('conic-gradient(red, blue)')).toBe('gradient');
  });

  test('gradient: repeating-linear-gradient', () => {
    expect(classifyBackgroundImage('repeating-linear-gradient(45deg, #ccc 0, #ccc 1px, #fff 0, #fff 50%)')).toBe('gradient');
  });

  test('pattern: repeating-radial-gradient', () => {
    expect(classifyBackgroundImage('repeating-radial-gradient(circle, red, blue 10px)')).toBe('pattern');
  });

  test('svg: url with .svg extension', () => {
    expect(classifyBackgroundImage('url("/icons/bg.svg")')).toBe('svg');
  });

  test('svg: data:image/svg+xml', () => {
    expect(classifyBackgroundImage('url("data:image/svg+xml;base64,PHN2Zy8+")')).toBe('svg');
  });

  test('image: url with .png', () => {
    expect(classifyBackgroundImage('url("/img/photo.png")')).toBe('image');
  });

  test('image: url with .jpg', () => {
    expect(classifyBackgroundImage('url("/img/photo.jpg")')).toBe('image');
  });

  test('image: url with .webp', () => {
    expect(classifyBackgroundImage('url("/img/photo.webp")')).toBe('image');
  });

  test('none: empty string', () => {
    expect(classifyBackgroundImage('')).toBe('none');
  });

  test('none: "none" value', () => {
    expect(classifyBackgroundImage('none')).toBe('none');
  });
});

// ── extractBackgroundPatterns ─────────────────────────────────────────────────

describe('extractBackgroundPatterns — collect background-image patterns from computed styles', () => {
  function cs(bgImage) {
    return { getPropertyValue: (p) => p === 'background-image' ? bgImage : '' };
  }

  test('returns array', () => {
    expect(Array.isArray(extractBackgroundPatterns([]))).toBe(true);
  });

  test('empty input returns empty array', () => {
    expect(extractBackgroundPatterns([])).toEqual([]);
  });

  test('skips elements with no background-image', () => {
    expect(extractBackgroundPatterns([cs('')])).toHaveLength(0);
  });

  test('skips elements with background-image: none', () => {
    expect(extractBackgroundPatterns([cs('none')])).toHaveLength(0);
  });

  test('includes gradient entry with type', () => {
    const result = extractBackgroundPatterns([cs('linear-gradient(red, blue)')]);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('gradient');
    expect(result[0].value).toBe('linear-gradient(red, blue)');
  });

  test('includes image entry', () => {
    const result = extractBackgroundPatterns([cs('url("/img/hero.jpg")')]);
    expect(result[0].type).toBe('image');
  });

  test('includes svg entry', () => {
    const result = extractBackgroundPatterns([cs('url("/icons/bg.svg")')]);
    expect(result[0].type).toBe('svg');
  });

  test('deduplicates identical values', () => {
    const styles = [cs('linear-gradient(red, blue)'), cs('linear-gradient(red, blue)')];
    expect(extractBackgroundPatterns(styles)).toHaveLength(1);
  });

  test('multiple distinct values all included', () => {
    const styles = [
      cs('linear-gradient(red, blue)'),
      cs('url("/img/photo.png")'),
      cs('url("/icons/bg.svg")'),
    ];
    expect(extractBackgroundPatterns(styles)).toHaveLength(3);
  });
});
