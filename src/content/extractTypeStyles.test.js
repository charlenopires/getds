/**
 * Task: 5c4ab7e3 — Extract font-weight, line-height, letter-spacing, text-transform per type style
 * Spec: f7625baf — Typography System Extraction
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractTypeStyles } from './extractTypeStyles.js';

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

describe('extractTypeStyles — font properties per type style', () => {
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

  test('returns an object with a styles array', () => {
    const result = extractTypeStyles();
    expect(result).toHaveProperty('styles');
    expect(Array.isArray(result.styles)).toBe(true);
  });

  test('each style entry has fontSize, fontWeight, lineHeight, letterSpacing, textTransform', () => {
    addEl('p', {
      'font-size': '16px',
      'font-weight': '400',
      'line-height': '1.5',
      'letter-spacing': '0px',
      'text-transform': 'none',
    });
    const result = extractTypeStyles();
    const entry = result.styles[0];
    expect(entry).toHaveProperty('fontSize');
    expect(entry).toHaveProperty('fontWeight');
    expect(entry).toHaveProperty('lineHeight');
    expect(entry).toHaveProperty('letterSpacing');
    expect(entry).toHaveProperty('textTransform');
  });

  test('records the correct fontWeight value', () => {
    addEl('strong', { 'font-size': '16px', 'font-weight': '700' });
    const result = extractTypeStyles();
    const entry = result.styles.find(s => s.fontWeight === '700');
    expect(entry).toBeDefined();
  });

  test('records the correct lineHeight value', () => {
    addEl('p', { 'font-size': '16px', 'line-height': '1.6' });
    const result = extractTypeStyles();
    const entry = result.styles.find(s => s.fontSize === '16px');
    expect(entry.lineHeight).toBe('1.6');
  });

  test('records the correct letterSpacing value', () => {
    addEl('h1', { 'font-size': '32px', 'letter-spacing': '-0.5px' });
    const result = extractTypeStyles();
    const entry = result.styles.find(s => s.fontSize === '32px');
    expect(entry.letterSpacing).toBe('-0.5px');
  });

  test('records the correct textTransform value', () => {
    addEl('span', { 'font-size': '12px', 'text-transform': 'uppercase' });
    const result = extractTypeStyles();
    const entry = result.styles.find(s => s.fontSize === '12px');
    expect(entry.textTransform).toBe('uppercase');
  });

  test('deduplicates entries with identical property combinations', () => {
    const props = {
      'font-size': '16px',
      'font-weight': '400',
      'line-height': '1.5',
      'letter-spacing': '0px',
      'text-transform': 'none',
    };
    addEl('p', props);
    addEl('li', props);
    const result = extractTypeStyles();
    const matches = result.styles.filter(s =>
      s.fontSize === '16px' && s.fontWeight === '400'
    );
    expect(matches).toHaveLength(1);
  });

  test('collects distinct type styles as separate entries', () => {
    addEl('p',  { 'font-size': '16px', 'font-weight': '400', 'line-height': '1.5', 'letter-spacing': '0px', 'text-transform': 'none' });
    addEl('h1', { 'font-size': '32px', 'font-weight': '700', 'line-height': '1.2', 'letter-spacing': '-1px', 'text-transform': 'none' });
    const result = extractTypeStyles();
    expect(result.styles.length).toBeGreaterThanOrEqual(2);
  });

  test('skips invisible elements', () => {
    addEl('p', { display: 'none', 'font-size': '99px', 'font-weight': '900' });
    addEl('span', { 'font-size': '16px', 'font-weight': '400' });
    const result = extractTypeStyles();
    expect(result.styles.every(s => s.fontSize !== '99px')).toBe(true);
  });

  test('includes tag field indicating the source element tag', () => {
    addEl('h2', { 'font-size': '24px', 'font-weight': '600' });
    const result = extractTypeStyles();
    const entry = result.styles.find(s => s.fontSize === '24px');
    expect(entry).toHaveProperty('tag');
    expect(entry.tag).toBe('h2');
  });

  test('returns empty styles for empty document', () => {
    document.body.innerHTML = '';
    const result = extractTypeStyles();
    expect(result.styles).toHaveLength(0);
  });
});
