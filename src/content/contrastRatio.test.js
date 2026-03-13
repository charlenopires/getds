/**
 * Task: 08924e3f — Calculate color contrast ratios using WCAG 2.1 luminance formula
 * Spec: 10ab6f26 — Accessibility Audit
 */

import { describe, test, expect } from 'bun:test';
import { relativeLuminance, contrastRatio, parseRgb } from './contrastRatio.js';

// ── parseRgb ──────────────────────────────────────────────────────────────────

describe('parseRgb — parse CSS rgb/rgba string to [r, g, b]', () => {
  test('parses rgb(0, 0, 0) as [0, 0, 0]', () => {
    expect(parseRgb('rgb(0, 0, 0)')).toEqual([0, 0, 0]);
  });

  test('parses rgb(255, 255, 255) as [255, 255, 255]', () => {
    expect(parseRgb('rgb(255, 255, 255)')).toEqual([255, 255, 255]);
  });

  test('parses rgba(0, 0, 0, 0.5) — ignores alpha', () => {
    expect(parseRgb('rgba(0, 0, 0, 0.5)')).toEqual([0, 0, 0]);
  });

  test('parses rgb(34, 85, 170)', () => {
    expect(parseRgb('rgb(34, 85, 170)')).toEqual([34, 85, 170]);
  });

  test('returns null for non-rgb strings', () => {
    expect(parseRgb('transparent')).toBeNull();
    expect(parseRgb('')).toBeNull();
    expect(parseRgb('none')).toBeNull();
  });
});

// ── relativeLuminance ─────────────────────────────────────────────────────────

describe('relativeLuminance — WCAG 2.1 relative luminance', () => {
  test('black (0,0,0) has luminance 0', () => {
    expect(relativeLuminance([0, 0, 0])).toBeCloseTo(0, 5);
  });

  test('white (255,255,255) has luminance 1', () => {
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 5);
  });

  test('pure red (255,0,0) has luminance ~0.2126', () => {
    expect(relativeLuminance([255, 0, 0])).toBeCloseTo(0.2126, 3);
  });

  test('pure green (0,128,0) has non-zero luminance', () => {
    expect(relativeLuminance([0, 128, 0])).toBeGreaterThan(0);
  });

  test('returns value between 0 and 1', () => {
    const L = relativeLuminance([100, 150, 200]);
    expect(L).toBeGreaterThanOrEqual(0);
    expect(L).toBeLessThanOrEqual(1);
  });
});

// ── contrastRatio ─────────────────────────────────────────────────────────────

describe('contrastRatio — WCAG 2.1 contrast ratio between two colors', () => {
  test('black on white = 21:1', () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 0);
  });

  test('white on black = 21:1 (symmetric)', () => {
    expect(contrastRatio([255, 255, 255], [0, 0, 0])).toBeCloseTo(21, 0);
  });

  test('same color = 1:1', () => {
    expect(contrastRatio([128, 128, 128], [128, 128, 128])).toBeCloseTo(1, 1);
  });

  test('result is always >= 1', () => {
    const ratio = contrastRatio([100, 100, 100], [200, 200, 200]);
    expect(ratio).toBeGreaterThanOrEqual(1);
  });

  test('typical body text: dark grey on white is > 4.5', () => {
    // #333 on white
    expect(contrastRatio([51, 51, 51], [255, 255, 255])).toBeGreaterThan(4.5);
  });
});
