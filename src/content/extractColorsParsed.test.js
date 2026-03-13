/**
 * Task: b361d751 — Collect colors from all relevant CSS properties
 *   including box-shadow, text-shadow, and gradient color stops
 * Spec: fff645a0 — Color System Extraction
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractColors } from './extractColors.js';
import { parseColorsFromValue } from './extractColors.js';

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

describe('parseColorsFromValue — extract embedded colors from shadow/gradient strings', () => {
  test('extracts rgb color from box-shadow value', () => {
    const value = '2px 2px 4px rgb(100, 0, 200)';
    const colors = parseColorsFromValue(value);
    expect(colors).toContain('rgb(100, 0, 200)');
  });

  test('extracts rgba color from box-shadow value', () => {
    const value = '0px 4px 8px rgba(0, 0, 0, 0.5)';
    const colors = parseColorsFromValue(value);
    expect(colors).toContain('rgba(0, 0, 0, 0.5)');
  });

  test('extracts rgb color from text-shadow value', () => {
    const value = '1px 1px 2px rgb(255, 0, 0)';
    const colors = parseColorsFromValue(value);
    expect(colors).toContain('rgb(255, 0, 0)');
  });

  test('extracts multiple rgb stops from linear-gradient', () => {
    const value = 'linear-gradient(to right, rgb(255, 0, 0), rgb(0, 0, 255))';
    const colors = parseColorsFromValue(value);
    expect(colors).toContain('rgb(255, 0, 0)');
    expect(colors).toContain('rgb(0, 0, 255)');
  });

  test('extracts hex colors from gradient', () => {
    const value = 'linear-gradient(to bottom, #ff0000, #0000ff)';
    const colors = parseColorsFromValue(value);
    expect(colors).toContain('#ff0000');
    expect(colors).toContain('#0000ff');
  });

  test('returns empty array for values with no colors', () => {
    const value = '2px 2px 4px';
    const colors = parseColorsFromValue(value);
    expect(colors).toEqual([]);
  });

  test('extracts color from inset box-shadow', () => {
    const value = 'inset 0px 0px 6px rgb(30, 60, 90)';
    const colors = parseColorsFromValue(value);
    expect(colors).toContain('rgb(30, 60, 90)');
  });

  test('handles multiple box-shadow layers', () => {
    const value = '0 1px 3px rgb(0, 0, 0), 0 2px 6px rgb(255, 0, 0)';
    const colors = parseColorsFromValue(value);
    expect(colors).toContain('rgb(0, 0, 0)');
    expect(colors).toContain('rgb(255, 0, 0)');
  });
});

describe('extractColors — box-shadow and text-shadow integration', () => {
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

  test('extracts color from box-shadow property', () => {
    addEl('div', { 'box-shadow': '2px 2px 4px rgb(50, 100, 150)' });
    const result = extractColors();
    const raws = result.colors.map(c => c.raw);
    expect(raws).toContain('rgb(50, 100, 150)');
  });

  test('extracts color from text-shadow property', () => {
    addEl('p', { 'text-shadow': '1px 1px 2px rgb(200, 50, 10)' });
    const result = extractColors();
    const raws = result.colors.map(c => c.raw);
    expect(raws).toContain('rgb(200, 50, 10)');
  });

  test('extracts gradient color stops from background-image', () => {
    addEl('div', {
      'background-image': 'linear-gradient(to right, rgb(255, 0, 0), rgb(0, 0, 255))',
    });
    const result = extractColors();
    const raws = result.colors.map(c => c.raw);
    expect(raws).toContain('rgb(255, 0, 0)');
    expect(raws).toContain('rgb(0, 0, 255)');
  });

  test('box-shadow color entry records property as box-shadow', () => {
    addEl('div', { 'box-shadow': '0 0 8px rgb(10, 20, 30)' });
    const result = extractColors();
    const entry = result.colors.find(c => c.raw === 'rgb(10, 20, 30)');
    expect(entry).toBeDefined();
    expect(entry.property).toBe('box-shadow');
  });

  test('text-shadow color entry records property as text-shadow', () => {
    addEl('p', { 'text-shadow': '0 0 4px rgb(70, 80, 90)' });
    const result = extractColors();
    const entry = result.colors.find(c => c.raw === 'rgb(70, 80, 90)');
    expect(entry).toBeDefined();
    expect(entry.property).toBe('text-shadow');
  });

  test('gradient color stops remain deduplicated', () => {
    addEl('div', {
      'background-image': 'linear-gradient(rgb(1, 2, 3), rgb(1, 2, 3))',
    });
    addEl('section', {
      'background-image': 'linear-gradient(rgb(1, 2, 3), rgb(4, 5, 6))',
    });
    const result = extractColors();
    const occurrences = result.colors.filter(c => c.raw === 'rgb(1, 2, 3)');
    expect(occurrences).toHaveLength(1);
  });
});
