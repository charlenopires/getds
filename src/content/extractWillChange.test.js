import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractWillChange } from './extractWillChange.js';

function fakeStyle(props = {}) {
  return {
    display: props.display ?? 'block',
    visibility: props.visibility ?? 'visible',
    opacity: props.opacity ?? '1',
    getPropertyValue(name) { return props[name] ?? ''; },
  };
}

describe('extractWillChange', () => {
  let window;

  beforeEach(() => {
    window = new Window({ url: 'https://example.com' });
    globalThis.document = window.document;
    globalThis.window = window;
    globalThis.getComputedStyle = (el) => el.__fakeStyle__ ?? fakeStyle();
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
    delete globalThis.getComputedStyle;
  });

  function addEl(tag, styleProps = {}) {
    const el = document.createElement(tag);
    el.__fakeStyle__ = fakeStyle(styleProps);
    document.body.appendChild(el);
    return el;
  }

  test('returns an object with a willChangeHints array', () => {
    const result = extractWillChange();
    expect(result).toHaveProperty('willChangeHints');
    expect(Array.isArray(result.willChangeHints)).toBe(true);
  });

  test('returns empty array when no will-change hints exist', () => {
    addEl('div');
    const { willChangeHints } = extractWillChange();
    expect(willChangeHints).toEqual([]);
  });

  test('extracts will-change property from visible elements', () => {
    addEl('div', { 'will-change': 'transform' });
    const { willChangeHints } = extractWillChange();
    expect(willChangeHints).toHaveLength(1);
    expect(willChangeHints[0].property).toBe('transform');
    expect(willChangeHints[0].count).toBe(1);
  });

  test('skips hidden elements', () => {
    addEl('div', { display: 'none', 'will-change': 'opacity' });
    const { willChangeHints } = extractWillChange();
    expect(willChangeHints).toEqual([]);
  });

  test('ignores auto value', () => {
    addEl('div', { 'will-change': 'auto' });
    const { willChangeHints } = extractWillChange();
    expect(willChangeHints).toEqual([]);
  });

  test('aggregates counts for same property across elements', () => {
    addEl('div', { 'will-change': 'transform' });
    addEl('span', { 'will-change': 'transform' });
    const { willChangeHints } = extractWillChange();
    expect(willChangeHints).toHaveLength(1);
    expect(willChangeHints[0].property).toBe('transform');
    expect(willChangeHints[0].count).toBe(2);
  });

  test('handles multiple will-change properties on one element', () => {
    addEl('div', { 'will-change': 'transform, opacity' });
    const { willChangeHints } = extractWillChange();
    expect(willChangeHints.length).toBe(2);
    expect(willChangeHints.find(h => h.property === 'transform')).toBeDefined();
    expect(willChangeHints.find(h => h.property === 'opacity')).toBeDefined();
  });

  test('sorts results by count descending', () => {
    addEl('div', { 'will-change': 'transform' });
    addEl('span', { 'will-change': 'transform' });
    addEl('p', { 'will-change': 'opacity' });
    const { willChangeHints } = extractWillChange();
    expect(willChangeHints[0].property).toBe('transform');
    expect(willChangeHints[0].count).toBe(2);
    expect(willChangeHints[1].property).toBe('opacity');
    expect(willChangeHints[1].count).toBe(1);
  });
});
