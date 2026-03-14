/**
 * Phase 2B — Collect @font-face rules from accessible stylesheets
 * Spec: f7625baf — Typography System Extraction
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { collectFontFaceFromSheets } from './collectFontFaceFromSheets.js';

describe('collectFontFaceFromSheets — bridge to parseFontFaceRules via document.styleSheets', () => {
  let originalDocument;

  beforeEach(() => {
    originalDocument = globalThis.document;
  });

  afterEach(() => {
    globalThis.document = originalDocument;
  });

  function mockDocument(sheets) {
    globalThis.document = { styleSheets: sheets };
  }

  test('returns an object with fontFaceRules array', () => {
    mockDocument([]);
    const result = collectFontFaceFromSheets();
    expect(result).toHaveProperty('fontFaceRules');
    expect(Array.isArray(result.fontFaceRules)).toBe(true);
  });

  test('returns empty array when no stylesheets exist', () => {
    mockDocument([]);
    const result = collectFontFaceFromSheets();
    expect(result.fontFaceRules).toHaveLength(0);
  });

  test('extracts font-face rules from accessible stylesheet', () => {
    const fontFaceCss = '@font-face { font-family: "TestFont"; src: url("/fonts/test.woff2") format("woff2"); font-display: swap; }';
    mockDocument([{
      cssRules: [{ cssText: fontFaceCss }],
    }]);

    const result = collectFontFaceFromSheets();
    expect(result.fontFaceRules).toHaveLength(1);
    expect(result.fontFaceRules[0].fontFamily).toBe('TestFont');
    expect(result.fontFaceRules[0].sources).toHaveLength(1);
    expect(result.fontFaceRules[0].fontDisplay).toBe('swap');
  });

  test('skips cross-origin sheets that throw SecurityError', () => {
    mockDocument([
      {
        get cssRules() {
          throw Object.assign(new Error('SecurityError'), { name: 'SecurityError' });
        },
      },
    ]);

    expect(() => collectFontFaceFromSheets()).not.toThrow();
    const result = collectFontFaceFromSheets();
    expect(result.fontFaceRules).toHaveLength(0);
  });

  test('collects from multiple sheets, skipping inaccessible ones', () => {
    const sheet1Css = '@font-face { font-family: "FontA"; src: url("/a.woff2"); }';
    const sheet2Css = '@font-face { font-family: "FontB"; src: url("/b.woff2"); }';
    mockDocument([
      { cssRules: [{ cssText: sheet1Css }] },
      {
        get cssRules() { throw new Error('cross-origin'); },
      },
      { cssRules: [{ cssText: sheet2Css }] },
    ]);

    const result = collectFontFaceFromSheets();
    expect(result.fontFaceRules).toHaveLength(2);
    const families = result.fontFaceRules.map(r => r.fontFamily);
    expect(families).toContain('FontA');
    expect(families).toContain('FontB');
  });

  test('returns empty array when sheet has no @font-face rules', () => {
    mockDocument([{
      cssRules: [{ cssText: 'body { color: red; }' }],
    }]);

    const result = collectFontFaceFromSheets();
    expect(result.fontFaceRules).toHaveLength(0);
  });

  test('extracts new properties like fontDisplay and unicodeRange', () => {
    const css = '@font-face { font-family: "VarFont"; src: url("/var.woff2") format("woff2-variations"); font-display: optional; unicode-range: U+0000-00FF; font-variation-settings: "wght" 400; }';
    mockDocument([{ cssRules: [{ cssText: css }] }]);

    const result = collectFontFaceFromSheets();
    expect(result.fontFaceRules[0].fontDisplay).toBe('optional');
    expect(result.fontFaceRules[0].unicodeRange).toBe('U+0000-00FF');
    expect(result.fontFaceRules[0].fontVariationSettings).toBe('"wght" 400');
    expect(result.fontFaceRules[0].sources[0].isVariable).toBe(true);
  });
});
