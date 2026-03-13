/**
 * Task: 6a427208 — Extract all unique font-family stacks from computed styles
 * Spec: f7625baf — Typography System Extraction
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractFontFamilies } from './extractFontFamilies.js';

function fakeStyle(props = {}) {
  return {
    display: props.display ?? 'block',
    visibility: props.visibility ?? 'visible',
    opacity: props.opacity ?? '1',
    getPropertyValue(name) {
      return props[name] ?? '';
    },
  };
}

describe('extractFontFamilies — unique font-family stacks from computed styles', () => {
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

  function addEl(tag, fakeStyleProps) {
    const el = document.createElement(tag);
    el.__fakeStyle__ = fakeStyle(fakeStyleProps);
    document.body.appendChild(el);
    return el;
  }

  test('returns an object with a fonts array', () => {
    const result = extractFontFamilies();
    expect(result).toHaveProperty('fonts');
    expect(Array.isArray(result.fonts)).toBe(true);
  });

  test('extracts a font-family stack from a text element', () => {
    addEl('p', { 'font-family': '"Inter", sans-serif' });
    const result = extractFontFamilies();
    const stacks = result.fonts.map(f => f.stack);
    expect(stacks).toContain('"Inter", sans-serif');
  });

  test('deduplicates identical font-family stacks', () => {
    addEl('p', { 'font-family': '"Inter", sans-serif' });
    addEl('span', { 'font-family': '"Inter", sans-serif' });
    const result = extractFontFamilies();
    const matches = result.fonts.filter(f => f.stack === '"Inter", sans-serif');
    expect(matches).toHaveLength(1);
  });

  test('collects multiple distinct stacks', () => {
    addEl('p',    { 'font-family': '"Inter", sans-serif' });
    addEl('code', { 'font-family': '"Fira Code", monospace' });
    const result = extractFontFamilies();
    const stacks = result.fonts.map(f => f.stack);
    expect(stacks).toContain('"Inter", sans-serif');
    expect(stacks).toContain('"Fira Code", monospace');
  });

  test('skips elements with empty font-family', () => {
    addEl('div', { 'font-family': '' });
    const result = extractFontFamilies();
    expect(result.fonts.every(f => f.stack !== '')).toBe(true);
  });

  test('skips invisible elements (display:none)', () => {
    addEl('p', { display: 'none', 'font-family': '"HiddenFont", serif' });
    addEl('span', { 'font-family': '"VisibleFont", sans-serif' });
    const result = extractFontFamilies();
    const stacks = result.fonts.map(f => f.stack);
    expect(stacks).not.toContain('"HiddenFont", serif');
    expect(stacks).toContain('"VisibleFont", sans-serif');
  });

  test('each font entry has a stack field (full font-family string)', () => {
    addEl('p', { 'font-family': 'Georgia, serif' });
    const result = extractFontFamilies();
    expect(result.fonts[0]).toHaveProperty('stack');
  });

  test('each font entry has a primary field (first font in the stack)', () => {
    addEl('p', { 'font-family': '"Inter", Arial, sans-serif' });
    const result = extractFontFamilies();
    const entry = result.fonts.find(f => f.stack === '"Inter", Arial, sans-serif');
    expect(entry).toHaveProperty('primary');
    expect(entry.primary).toBe('Inter');
  });

  test('primary strips quotes from font name', () => {
    addEl('p', { 'font-family': '"Helvetica Neue", sans-serif' });
    const result = extractFontFamilies();
    const entry = result.fonts[0];
    expect(entry.primary).toBe('Helvetica Neue');
  });

  test('each font entry has a generic field (last generic family in stack)', () => {
    addEl('p', { 'font-family': '"Inter", sans-serif' });
    const result = extractFontFamilies();
    const entry = result.fonts.find(f => f.stack.includes('Inter'));
    expect(entry).toHaveProperty('generic');
    expect(entry.generic).toBe('sans-serif');
  });

  test('generic is null when no generic family present', () => {
    addEl('p', { 'font-family': '"CustomFont"' });
    const result = extractFontFamilies();
    const entry = result.fonts[0];
    expect(entry.generic).toBeNull();
  });

  test('returns empty fonts array when document has no elements', () => {
    document.body.innerHTML = '';
    const result = extractFontFamilies();
    expect(Array.isArray(result.fonts)).toBe(true);
  });
});
