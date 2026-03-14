/**
 * Task: 66223169 — Detect custom fonts loaded via @font-face rules
 * Spec: f7625baf — Typography System Extraction
 */

import { describe, test, expect } from 'bun:test';
import { parseFontFaceRules } from './detectFontFace.js';

describe('parseFontFaceRules — extract @font-face declarations from CSS text', () => {
  test('returns an array', () => {
    const result = parseFontFaceRules('');
    expect(Array.isArray(result)).toBe(true);
  });

  test('returns empty array for CSS with no @font-face', () => {
    expect(parseFontFaceRules('body { color: red; }')).toHaveLength(0);
  });

  test('extracts font-family from @font-face block', () => {
    const css = `
      @font-face {
        font-family: "Inter";
        src: url("/fonts/inter.woff2") format("woff2");
      }
    `;
    const result = parseFontFaceRules(css);
    expect(result[0].fontFamily).toBe('Inter');
  });

  test('strips quotes from font-family name', () => {
    const css = `@font-face { font-family: 'Roboto'; src: url(roboto.woff2); }`;
    const result = parseFontFaceRules(css);
    expect(result[0].fontFamily).toBe('Roboto');
  });

  test('extracts src URL from @font-face block', () => {
    const css = `
      @font-face {
        font-family: "Inter";
        src: url("/fonts/inter.woff2") format("woff2");
      }
    `;
    const result = parseFontFaceRules(css);
    expect(result[0].sources).toContainEqual(
      expect.objectContaining({ url: '/fonts/inter.woff2' })
    );
  });

  test('extracts format from src declaration', () => {
    const css = `
      @font-face {
        font-family: "Inter";
        src: url("inter.woff2") format("woff2");
      }
    `;
    const result = parseFontFaceRules(css);
    expect(result[0].sources[0].format).toBe('woff2');
  });

  test('handles multiple src formats in one @font-face', () => {
    const css = `
      @font-face {
        font-family: "Inter";
        src: url("inter.woff2") format("woff2"),
             url("inter.woff") format("woff");
      }
    `;
    const result = parseFontFaceRules(css);
    expect(result[0].sources).toHaveLength(2);
    const formats = result[0].sources.map(s => s.format);
    expect(formats).toContain('woff2');
    expect(formats).toContain('woff');
  });

  test('extracts font-weight from @font-face block', () => {
    const css = `
      @font-face {
        font-family: "Inter";
        src: url("inter-bold.woff2") format("woff2");
        font-weight: 700;
      }
    `;
    const result = parseFontFaceRules(css);
    expect(result[0].fontWeight).toBe('700');
  });

  test('extracts font-style from @font-face block', () => {
    const css = `
      @font-face {
        font-family: "Inter";
        src: url("inter-italic.woff2") format("woff2");
        font-style: italic;
      }
    `;
    const result = parseFontFaceRules(css);
    expect(result[0].fontStyle).toBe('italic');
  });

  test('parses multiple @font-face blocks', () => {
    const css = `
      @font-face { font-family: "Inter"; src: url("inter.woff2"); }
      @font-face { font-family: "Roboto"; src: url("roboto.woff2"); }
    `;
    const result = parseFontFaceRules(css);
    expect(result).toHaveLength(2);
    const names = result.map(r => r.fontFamily);
    expect(names).toContain('Inter');
    expect(names).toContain('Roboto');
  });

  test('format is null when not specified in src', () => {
    const css = `@font-face { font-family: "X"; src: url("x.woff2"); }`;
    const result = parseFontFaceRules(css);
    expect(result[0].sources[0].format).toBeNull();
  });

  test('fontWeight is null when not specified', () => {
    const css = `@font-face { font-family: "X"; src: url("x.woff2"); }`;
    const result = parseFontFaceRules(css);
    expect(result[0].fontWeight).toBeNull();
  });

  test('fontStyle defaults to normal when not specified', () => {
    const css = `@font-face { font-family: "X"; src: url("x.woff2"); }`;
    const result = parseFontFaceRules(css);
    expect(result[0].fontStyle).toBe('normal');
  });

  test('extracts font-display property', () => {
    const css = `@font-face { font-family: "X"; src: url("x.woff2"); font-display: swap; }`;
    const result = parseFontFaceRules(css);
    expect(result[0].fontDisplay).toBe('swap');
  });

  test('fontDisplay is null when not specified', () => {
    const css = `@font-face { font-family: "X"; src: url("x.woff2"); }`;
    const result = parseFontFaceRules(css);
    expect(result[0].fontDisplay).toBeNull();
  });

  test('extracts font-stretch property', () => {
    const css = `@font-face { font-family: "X"; src: url("x.woff2"); font-stretch: condensed; }`;
    const result = parseFontFaceRules(css);
    expect(result[0].fontStretch).toBe('condensed');
  });

  test('extracts unicode-range property', () => {
    const css = `@font-face { font-family: "X"; src: url("x.woff2"); unicode-range: U+0000-00FF; }`;
    const result = parseFontFaceRules(css);
    expect(result[0].unicodeRange).toBe('U+0000-00FF');
  });

  test('extracts font-feature-settings property', () => {
    const css = `@font-face { font-family: "X"; src: url("x.woff2"); font-feature-settings: "liga" 1; }`;
    const result = parseFontFaceRules(css);
    expect(result[0].fontFeatureSettings).toBe('"liga" 1');
  });

  test('extracts font-variation-settings property', () => {
    const css = `@font-face { font-family: "X"; src: url("x.woff2"); font-variation-settings: "wght" 400; }`;
    const result = parseFontFaceRules(css);
    expect(result[0].fontVariationSettings).toBe('"wght" 400');
  });

  test('extracts size-adjust property', () => {
    const css = `@font-face { font-family: "X"; src: url("x.woff2"); size-adjust: 110%; }`;
    const result = parseFontFaceRules(css);
    expect(result[0].sizeAdjust).toBe('110%');
  });

  test('extracts ascent-override property', () => {
    const css = `@font-face { font-family: "X"; src: url("x.woff2"); ascent-override: 90%; }`;
    const result = parseFontFaceRules(css);
    expect(result[0].ascentOverride).toBe('90%');
  });

  test('extracts descent-override property', () => {
    const css = `@font-face { font-family: "X"; src: url("x.woff2"); descent-override: 20%; }`;
    const result = parseFontFaceRules(css);
    expect(result[0].descentOverride).toBe('20%');
  });

  test('extracts line-gap-override property', () => {
    const css = `@font-face { font-family: "X"; src: url("x.woff2"); line-gap-override: 0%; }`;
    const result = parseFontFaceRules(css);
    expect(result[0].lineGapOverride).toBe('0%');
  });

  test('isVariable is false for standard woff2 format', () => {
    const css = `@font-face { font-family: "X"; src: url("x.woff2") format("woff2"); }`;
    const result = parseFontFaceRules(css);
    expect(result[0].sources[0].isVariable).toBe(false);
  });

  test('isVariable is true for woff2-variations format', () => {
    const css = `@font-face { font-family: "X"; src: url("x.woff2") format("woff2-variations"); }`;
    const result = parseFontFaceRules(css);
    expect(result[0].sources[0].isVariable).toBe(true);
  });

  test('isVariable is false when no format is specified', () => {
    const css = `@font-face { font-family: "X"; src: url("x.woff2"); }`;
    const result = parseFontFaceRules(css);
    expect(result[0].sources[0].isVariable).toBe(false);
  });

  test('extracts all new properties from a fully-specified @font-face block', () => {
    const css = `
      @font-face {
        font-family: "Inter Variable";
        src: url("inter-var.woff2") format("woff2-variations");
        font-weight: 100 900;
        font-style: normal;
        font-display: swap;
        font-stretch: 75% 125%;
        unicode-range: U+0000-00FF, U+0131;
        font-feature-settings: "kern" 1;
        font-variation-settings: "wght" 400, "slnt" 0;
        size-adjust: 100%;
        ascent-override: 95%;
        descent-override: 22%;
        line-gap-override: 0%;
      }
    `;
    const result = parseFontFaceRules(css);
    expect(result).toHaveLength(1);
    const r = result[0];
    expect(r.fontFamily).toBe('Inter Variable');
    expect(r.fontDisplay).toBe('swap');
    expect(r.fontStretch).toBe('75% 125%');
    expect(r.unicodeRange).toBe('U+0000-00FF, U+0131');
    expect(r.fontFeatureSettings).toBe('"kern" 1');
    expect(r.fontVariationSettings).toBe('"wght" 400, "slnt" 0');
    expect(r.sizeAdjust).toBe('100%');
    expect(r.ascentOverride).toBe('95%');
    expect(r.descentOverride).toBe('22%');
    expect(r.lineGapOverride).toBe('0%');
    expect(r.sources[0].isVariable).toBe(true);
    expect(r.sources[0].format).toBe('woff2-variations');
  });
});
