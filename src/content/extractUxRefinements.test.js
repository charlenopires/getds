import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractUxRefinements } from './extractUxRefinements.js';

describe('extractUxRefinements — UX micro-detail extraction', () => {
  let window;

  beforeEach(() => {
    window = new Window({ url: 'https://example.com' });
    globalThis.document = window.document;
    globalThis.window = window;
    globalThis.getComputedStyle = (el) => ({
      getPropertyValue: (prop) => el.__fakeStyle__?.[prop] ?? '',
    });
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
    delete globalThis.getComputedStyle;
  });

  test('returns expected shape', () => {
    const result = extractUxRefinements();
    expect(result).toHaveProperty('customCursors');
    expect(result).toHaveProperty('scrollBehavior');
    expect(result).toHaveProperty('scrollSnap');
    expect(result).toHaveProperty('overscrollBehavior');
    expect(result).toHaveProperty('scrollPaddingTop');
    expect(result).toHaveProperty('focusVisibleStyles');
    expect(result).toHaveProperty('touchAction');
  });

  test('detects scroll-behavior on html', () => {
    document.documentElement.__fakeStyle__ = { 'scroll-behavior': 'smooth' };
    const { scrollBehavior } = extractUxRefinements();
    expect(scrollBehavior.html).toBe('smooth');
  });

  test('returns auto for default scroll behavior', () => {
    document.documentElement.__fakeStyle__ = {};
    const { scrollBehavior } = extractUxRefinements();
    expect(scrollBehavior.html).toBe('auto');
  });

  test('detects focus-visible styles from stylesheet text', () => {
    const cssText = '.btn:focus-visible { outline: 2px solid blue; box-shadow: 0 0 4px blue; }';
    const { focusVisibleStyles } = extractUxRefinements([cssText]);
    expect(focusVisibleStyles.length).toBeGreaterThan(0);
  });

  test('returns empty arrays when no UX refinements detected', () => {
    const result = extractUxRefinements([]);
    expect(result.customCursors).toEqual([]);
    expect(result.scrollSnap).toEqual([]);
    expect(result.focusVisibleStyles).toEqual([]);
    expect(result.touchAction).toEqual([]);
  });

  test('detects scroll-padding-top', () => {
    document.documentElement.__fakeStyle__ = { 'scroll-padding-top': '80px' };
    const { scrollPaddingTop } = extractUxRefinements();
    expect(scrollPaddingTop).toBe('80px');
  });

  test('detects overscroll-behavior', () => {
    document.documentElement.__fakeStyle__ = {
      'overscroll-behavior-x': 'contain',
      'overscroll-behavior-y': 'none',
    };
    const { overscrollBehavior } = extractUxRefinements();
    expect(overscrollBehavior.x).toBe('contain');
    expect(overscrollBehavior.y).toBe('none');
  });
});
