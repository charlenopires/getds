import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractScrollAnimations } from './extractScrollAnimations.js';

function makeSheet(cssText) {
  return {
    cssRules: [{ cssText }],
    ownerNode: { textContent: cssText },
  };
}

describe('extractScrollAnimations', () => {
  let window;
  let origStyleSheets;

  beforeEach(() => {
    window = new Window({ url: 'https://example.com' });
    globalThis.document = window.document;
    globalThis.window = window;
    // Override styleSheets since happy-dom doesn't support it well
    origStyleSheets = Object.getOwnPropertyDescriptor(window.document.__proto__, 'styleSheets') ||
                      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window.document), 'styleSheets');
  });

  afterEach(async () => {
    // Restore if needed
    if (origStyleSheets) {
      Object.defineProperty(window.document, 'styleSheets', origStyleSheets);
    }
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
  });

  function setStyleSheets(sheets) {
    Object.defineProperty(globalThis.document, 'styleSheets', {
      get: () => sheets,
      configurable: true,
    });
  }

  test('returns an object with a scrollAnimations array', () => {
    setStyleSheets([]);
    const result = extractScrollAnimations();
    expect(result).toHaveProperty('scrollAnimations');
    expect(Array.isArray(result.scrollAnimations)).toBe(true);
  });

  test('returns empty array when no scroll animations exist', () => {
    setStyleSheets([makeSheet('.foo { color: red; }')]);
    const { scrollAnimations } = extractScrollAnimations();
    expect(scrollAnimations).toEqual([]);
  });

  test('extracts scroll-timeline declarations', () => {
    setStyleSheets([makeSheet('.container { scroll-timeline: --my-scroller block; animation: reveal linear; }')]);
    const { scrollAnimations } = extractScrollAnimations();
    expect(scrollAnimations.length).toBeGreaterThanOrEqual(1);
    expect(scrollAnimations[0].type).toBe('scroll');
    expect(scrollAnimations[0].timeline).toContain('--my-scroller');
  });

  test('extracts view-timeline declarations', () => {
    setStyleSheets([makeSheet('.card { view-timeline: --card-timeline inline; }')]);
    const { scrollAnimations } = extractScrollAnimations();
    const viewEntry = scrollAnimations.find(a => a.type === 'view');
    expect(viewEntry).toBeDefined();
    expect(viewEntry.timeline).toContain('--card-timeline');
  });

  test('extracts animation-timeline declarations', () => {
    setStyleSheets([makeSheet('.reveal { animation: slide-up linear; animation-timeline: scroll(); }')]);
    const { scrollAnimations } = extractScrollAnimations();
    const entry = scrollAnimations.find(a => a.type === 'animation-timeline');
    expect(entry).toBeDefined();
    expect(entry.timeline).toContain('scroll()');
  });

  test('ignores auto and none values', () => {
    setStyleSheets([
      makeSheet('.a { animation-timeline: auto; }'),
      makeSheet('.b { animation-timeline: none; }'),
    ]);
    const { scrollAnimations } = extractScrollAnimations();
    expect(scrollAnimations).toEqual([]);
  });

  test('deduplicates identical declarations', () => {
    setStyleSheets([
      makeSheet('.a { scroll-timeline: --t block; }'),
      makeSheet('.b { scroll-timeline: --t block; }'),
    ]);
    const { scrollAnimations } = extractScrollAnimations();
    const tEntries = scrollAnimations.filter(a => a.timeline.includes('--t'));
    expect(tEntries.length).toBe(1);
  });

  test('handles CORS-blocked sheets gracefully', () => {
    const corsSheet = {
      get cssRules() { throw new DOMException('CORS'); },
      ownerNode: { textContent: '.x { scroll-timeline: --cors block; }' },
    };
    setStyleSheets([corsSheet]);
    const { scrollAnimations } = extractScrollAnimations();
    // Should have extracted from ownerNode fallback
    expect(scrollAnimations.length).toBeGreaterThanOrEqual(1);
  });

  test('handles missing styleSheets gracefully', () => {
    Object.defineProperty(globalThis.document, 'styleSheets', {
      get: () => { throw new Error('not supported'); },
      configurable: true,
    });
    const { scrollAnimations } = extractScrollAnimations();
    expect(scrollAnimations).toEqual([]);
  });
});
