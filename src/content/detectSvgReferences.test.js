/**
 * Task: 96dd9398 — Detect SVG references via img[src], use[href], CSS background-image
 * Spec: 4e6f0589 — Iconography and Asset Detection
 */

import { describe, test, expect } from 'bun:test';
import { isSvgUrl, detectSvgImgRefs, detectSvgUseRefs, detectSvgBackgroundRefs } from './detectSvgReferences.js';

// ── isSvgUrl ──────────────────────────────────────────────────────────────────

describe('isSvgUrl — detect if a URL points to an SVG file', () => {
  test('returns true for .svg extension', () => {
    expect(isSvgUrl('icons/arrow.svg')).toBe(true);
  });

  test('returns true for .svg with query string', () => {
    expect(isSvgUrl('/assets/logo.svg?v=2')).toBe(true);
  });

  test('returns true for data:image/svg+xml URI', () => {
    expect(isSvgUrl('data:image/svg+xml;base64,PHN2Zy8+')).toBe(true);
  });

  test('returns false for .png', () => {
    expect(isSvgUrl('image.png')).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(isSvgUrl('')).toBe(false);
  });

  test('returns false for null', () => {
    expect(isSvgUrl(null)).toBe(false);
  });
});

// ── detectSvgImgRefs ──────────────────────────────────────────────────────────

describe('detectSvgImgRefs — find img elements with SVG src', () => {
  function img(src) {
    return { getAttribute: (a) => a === 'src' ? src : null };
  }

  test('returns array', () => {
    expect(Array.isArray(detectSvgImgRefs([]))).toBe(true);
  });

  test('detects img with .svg src', () => {
    const result = detectSvgImgRefs([img('/icons/logo.svg')]);
    expect(result).toHaveLength(1);
    expect(result[0].src).toBe('/icons/logo.svg');
    expect(result[0].type).toBe('img-src');
  });

  test('skips img with non-SVG src', () => {
    expect(detectSvgImgRefs([img('/photo.jpg')])).toHaveLength(0);
  });

  test('detects data:image/svg+xml src', () => {
    const result = detectSvgImgRefs([img('data:image/svg+xml;base64,PHN2Zy8+')]);
    expect(result).toHaveLength(1);
  });

  test('skips img with null src', () => {
    expect(detectSvgImgRefs([img(null)])).toHaveLength(0);
  });
});

// ── detectSvgUseRefs ──────────────────────────────────────────────────────────

describe('detectSvgUseRefs — find use elements with SVG href', () => {
  function use(href, xlinkHref = null) {
    return {
      getAttribute: (a) => {
        if (a === 'href') return href;
        if (a === 'xlink:href') return xlinkHref;
        return null;
      },
    };
  }

  test('returns array', () => {
    expect(Array.isArray(detectSvgUseRefs([]))).toBe(true);
  });

  test('detects use with href pointing to SVG fragment', () => {
    const result = detectSvgUseRefs([use('/sprite.svg#icon-home')]);
    expect(result).toHaveLength(1);
    expect(result[0].href).toBe('/sprite.svg#icon-home');
    expect(result[0].type).toBe('use-href');
  });

  test('detects use with xlink:href fallback', () => {
    const result = detectSvgUseRefs([use(null, '/sprite.svg#icon-star')]);
    expect(result).toHaveLength(1);
    expect(result[0].href).toBe('/sprite.svg#icon-star');
  });

  test('detects internal fragment reference (#icon-id)', () => {
    const result = detectSvgUseRefs([use('#icon-close')]);
    expect(result).toHaveLength(1);
  });

  test('skips use with no href', () => {
    expect(detectSvgUseRefs([use(null)])).toHaveLength(0);
  });
});

// ── detectSvgBackgroundRefs ───────────────────────────────────────────────────

describe('detectSvgBackgroundRefs — find elements with SVG background-image', () => {
  function cs(bgImage) {
    return { getPropertyValue: (p) => p === 'background-image' ? bgImage : '' };
  }

  test('returns array', () => {
    expect(Array.isArray(detectSvgBackgroundRefs([]))).toBe(true);
  });

  test('detects url() with .svg', () => {
    const result = detectSvgBackgroundRefs([cs('url("/icons/bg.svg")')]);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('/icons/bg.svg');
    expect(result[0].type).toBe('css-background');
  });

  test('skips non-SVG background-image', () => {
    expect(detectSvgBackgroundRefs([cs('url("/photo.jpg")')])).toHaveLength(0);
  });

  test('detects inline data:image/svg+xml in background-image', () => {
    const result = detectSvgBackgroundRefs([cs('url("data:image/svg+xml;base64,PHN2Zy8+")')]);
    expect(result).toHaveLength(1);
  });

  test('skips elements with no background-image', () => {
    expect(detectSvgBackgroundRefs([cs('')])).toHaveLength(0);
  });

  test('skips gradient backgrounds', () => {
    expect(detectSvgBackgroundRefs([cs('linear-gradient(red, blue)')])).toHaveLength(0);
  });
});
