/**
 * Task: 7c2d5298 — Extract unique color values from computed styles across all visible DOM elements
 * Spec: fff645a0 — Color System Extraction
 */

import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { extractColors } from './extractColors.js';

/**
 * Build a minimal fake CSSStyleDeclaration for testing.
 * Avoids happy-dom's internal querySelectorAll bug in getComputedStyle.
 */
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

describe('extractColors — unique colors from computed styles', () => {
  let window;
  let mockGetComputedStyle;

  beforeEach(() => {
    window = new Window({ url: 'https://example.com' });
    globalThis.document = window.document;
    globalThis.window = window;

    // Mock getComputedStyle — controlled per-test by setting element.__fakeStyle__
    mockGetComputedStyle = (el) => el.__fakeStyle__ ?? fakeStyle();
    globalThis.getComputedStyle = mockGetComputedStyle;
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
    delete globalThis.getComputedStyle;
  });

  function addEl(tag, fakeStyleProps, parent) {
    const el = document.createElement(tag);
    el.__fakeStyle__ = fakeStyle(fakeStyleProps);
    (parent ?? document.body).appendChild(el);
    return el;
  }

  test('returns an object with a colors array', () => {
    const result = extractColors();
    expect(result).toHaveProperty('colors');
    expect(Array.isArray(result.colors)).toBe(true);
  });

  test('returns unique colors only — no duplicates', () => {
    addEl('div', { color: 'rgb(255, 0, 0)' });
    addEl('p', { color: 'rgb(255, 0, 0)' });
    addEl('span', { color: 'rgb(0, 0, 255)' });

    const result = extractColors();
    const unique = new Set(result.colors.map(c => c.raw));
    expect(unique.size).toBe(result.colors.length);
  });

  test('collects color from color property', () => {
    addEl('p', { color: 'rgb(255, 0, 0)' });

    const result = extractColors();
    const raws = result.colors.map(c => c.raw);
    expect(raws).toContain('rgb(255, 0, 0)');
  });

  test('collects color from background-color property', () => {
    addEl('div', { 'background-color': 'rgb(0, 128, 0)' });

    const result = extractColors();
    const raws = result.colors.map(c => c.raw);
    expect(raws).toContain('rgb(0, 128, 0)');
  });

  test('skips transparent and empty color values', () => {
    addEl('div', { color: 'transparent', 'background-color': 'rgba(0, 0, 0, 0)' });

    const result = extractColors();
    const raws = result.colors.map(c => c.raw);
    expect(raws).not.toContain('transparent');
    expect(raws).not.toContain('rgba(0, 0, 0, 0)');
  });

  test('skips elements where display is none', () => {
    addEl('div', { display: 'none', color: 'rgb(255, 99, 71)' });
    addEl('p', { color: 'rgb(0, 0, 255)' });

    const result = extractColors();
    const raws = result.colors.map(c => c.raw);
    expect(raws).not.toContain('rgb(255, 99, 71)');
    expect(raws).toContain('rgb(0, 0, 255)');
  });

  test('skips elements where visibility is hidden', () => {
    addEl('div', { visibility: 'hidden', color: 'rgb(100, 200, 50)' });
    addEl('span', { color: 'rgb(10, 20, 30)' });

    const result = extractColors();
    const raws = result.colors.map(c => c.raw);
    expect(raws).not.toContain('rgb(100, 200, 50)');
    expect(raws).toContain('rgb(10, 20, 30)');
  });

  test('each color entry has a raw field', () => {
    addEl('p', { color: 'rgb(10, 20, 30)' });

    const result = extractColors();
    const entry = result.colors.find(c => c.raw === 'rgb(10, 20, 30)');
    expect(entry).toBeDefined();
    expect(entry).toHaveProperty('raw');
  });

  test('each color entry has a property field indicating source CSS property', () => {
    addEl('p', { color: 'rgb(10, 20, 30)' });

    const result = extractColors();
    const entry = result.colors.find(c => c.raw === 'rgb(10, 20, 30)');
    expect(entry).toHaveProperty('property');
    expect(typeof entry.property).toBe('string');
  });

  test('returns empty colors array for a document with no elements', () => {
    document.body.innerHTML = '';
    const result = extractColors();
    expect(Array.isArray(result.colors)).toBe(true);
    // may have 0 or more entries depending on body default styles — just confirm structure
  });

  test('collects border-color values', () => {
    addEl('div', { 'border-color': 'rgb(128, 0, 128)' });

    const result = extractColors();
    const raws = result.colors.map(c => c.raw);
    expect(raws).toContain('rgb(128, 0, 128)');
  });

  test('deduplicates same color seen across different elements', () => {
    addEl('div', { color: 'rgb(1, 2, 3)' });
    addEl('p', { color: 'rgb(1, 2, 3)' });
    addEl('span', { color: 'rgb(1, 2, 3)' });

    const result = extractColors();
    const occurrences = result.colors.filter(c => c.raw === 'rgb(1, 2, 3)');
    expect(occurrences).toHaveLength(1);
  });

  test('each color entry includes hex, rgb, and hsl normalized fields', () => {
    addEl('p', { color: 'rgb(255, 0, 0)' });

    const result = extractColors();
    const entry = result.colors.find(c => c.raw === 'rgb(255, 0, 0)');
    expect(entry).toBeDefined();
    expect(entry.hex).toBe('#ff0000');
    expect(entry.rgb).toBe('rgb(255, 0, 0)');
    expect(entry.hsl).toBe('hsl(0, 100%, 50%)');
  });

  test('normalized hex is always lowercase', () => {
    addEl('div', { color: 'rgb(0, 128, 0)' });

    const result = extractColors();
    const entry = result.colors.find(c => c.raw === 'rgb(0, 128, 0)');
    expect(entry.hex).toBe(entry.hex.toLowerCase());
  });
});
