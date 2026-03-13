/**
 * Task: 45a19733 — Detect all inline SVG elements and extract viewBox, path data, and contextual usage
 * Spec: 4e6f0589 — Iconography and Asset Detection
 */

import { describe, test, expect } from 'bun:test';
import { extractSvgDescriptor, classifySvgContext } from './extractInlineSvgs.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSvg({ viewBox = '', paths = [], ariaLabel = '', ariaHidden = false, parentTag = 'div', title = '' } = {}) {
  return {
    getAttribute: (attr) => {
      if (attr === 'viewBox') return viewBox || null;
      if (attr === 'aria-label') return ariaLabel || null;
      if (attr === 'aria-hidden') return ariaHidden ? 'true' : null;
      if (attr === 'title') return title || null;
      return null;
    },
    querySelectorAll: (sel) => {
      if (sel === 'path') return paths.map(d => ({ getAttribute: (a) => a === 'd' ? d : null }));
      if (sel === 'title') return title ? [{ textContent: title }] : [];
      return [];
    },
    closest: (sel) => sel === parentTag ? { tagName: parentTag.toUpperCase() } : null,
    parentElement: { tagName: parentTag.toUpperCase() },
  };
}

// ── extractSvgDescriptor ───────────────────────────────────────────────────────

describe('extractSvgDescriptor — extract viewBox, paths, and label from SVG element', () => {
  test('returns object with viewBox', () => {
    const svg = makeSvg({ viewBox: '0 0 24 24' });
    expect(extractSvgDescriptor(svg)).toHaveProperty('viewBox', '0 0 24 24');
  });

  test('viewBox is null when not present', () => {
    const svg = makeSvg({});
    expect(extractSvgDescriptor(svg).viewBox).toBeNull();
  });

  test('returns paths array', () => {
    const svg = makeSvg({ paths: ['M0 0 L10 10', 'M5 5 L15 15'] });
    const result = extractSvgDescriptor(svg);
    expect(result.paths).toEqual(['M0 0 L10 10', 'M5 5 L15 15']);
  });

  test('paths is empty when no path elements', () => {
    const svg = makeSvg({ paths: [] });
    expect(extractSvgDescriptor(svg).paths).toEqual([]);
  });

  test('returns label from aria-label', () => {
    const svg = makeSvg({ ariaLabel: 'Close menu' });
    expect(extractSvgDescriptor(svg).label).toBe('Close menu');
  });

  test('returns label from title element when no aria-label', () => {
    const svg = makeSvg({ title: 'Settings icon' });
    expect(extractSvgDescriptor(svg).label).toBe('Settings icon');
  });

  test('label is null when neither aria-label nor title', () => {
    const svg = makeSvg({});
    expect(extractSvgDescriptor(svg).label).toBeNull();
  });

  test('ariaHidden is true when aria-hidden="true"', () => {
    const svg = makeSvg({ ariaHidden: true });
    expect(extractSvgDescriptor(svg).ariaHidden).toBe(true);
  });

  test('ariaHidden is false when not set', () => {
    const svg = makeSvg({ ariaHidden: false });
    expect(extractSvgDescriptor(svg).ariaHidden).toBe(false);
  });
});

// ── classifySvgContext ─────────────────────────────────────────────────────────

describe('classifySvgContext — classify SVG usage context', () => {
  test('returns "decorative" when aria-hidden', () => {
    const svg = makeSvg({ ariaHidden: true, parentTag: 'div' });
    expect(classifySvgContext(svg)).toBe('decorative');
  });

  test('returns "action" when inside button', () => {
    const svg = {
      getAttribute: (a) => null,
      parentElement: { tagName: 'BUTTON' },
    };
    expect(classifySvgContext(svg)).toBe('action');
  });

  test('returns "action" when inside a[href]', () => {
    const svg = {
      getAttribute: (a) => null,
      parentElement: { tagName: 'A' },
    };
    expect(classifySvgContext(svg)).toBe('action');
  });

  test('returns "navigation" when inside nav', () => {
    const svg = {
      getAttribute: (a) => null,
      parentElement: { tagName: 'NAV' },
    };
    expect(classifySvgContext(svg)).toBe('navigation');
  });

  test('returns "informative" when has aria-label and not decorative', () => {
    const svg = {
      getAttribute: (a) => a === 'aria-label' ? 'Warning' : null,
      parentElement: { tagName: 'DIV' },
    };
    expect(classifySvgContext(svg)).toBe('informative');
  });

  test('returns "decorative" when no label and not in interactive parent', () => {
    const svg = {
      getAttribute: (a) => null,
      parentElement: { tagName: 'DIV' },
    };
    expect(classifySvgContext(svg)).toBe('decorative');
  });
});
