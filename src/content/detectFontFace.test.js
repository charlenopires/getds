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
});
