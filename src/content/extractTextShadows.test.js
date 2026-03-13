/**
 * Task: d5ef3a2a — Extract all unique text-shadow values from computed styles
 * Spec: 7c17b9ef — Elevation and Border Radius Extraction
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractTextShadows } from './extractTextShadows.js';

describe('extractTextShadows — extract unique text-shadow values', () => {
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

  function addEl(shadow) {
    const el = document.createElement('div');
    el.__fakeStyle__ = { 'text-shadow': shadow };
    document.body.appendChild(el);
    return el;
  }

  test('returns an object with a shadows array', () => {
    expect(extractTextShadows()).toHaveProperty('shadows');
    expect(Array.isArray(extractTextShadows().shadows)).toBe(true);
  });

  test('returns empty array when no elements have text-shadow', () => {
    addEl('none');
    expect(extractTextShadows().shadows).toEqual([]);
  });

  test('captures a single text-shadow value', () => {
    addEl('1px 1px 2px rgba(0,0,0,0.5)');
    const { shadows } = extractTextShadows();
    expect(shadows.length).toBe(1);
    expect(shadows[0].value).toBe('1px 1px 2px rgba(0,0,0,0.5)');
  });

  test('deduplicates identical values', () => {
    addEl('1px 1px 2px rgba(0,0,0,0.5)');
    addEl('1px 1px 2px rgba(0,0,0,0.5)');
    expect(extractTextShadows().shadows.length).toBe(1);
  });

  test('collects multiple distinct values', () => {
    addEl('1px 1px 2px black');
    addEl('0px 2px 4px rgba(0,0,0,0.3)');
    expect(extractTextShadows().shadows.length).toBe(2);
  });

  test('skips "none" values', () => {
    addEl('none');
    expect(extractTextShadows().shadows).toEqual([]);
  });

  test('skips empty values', () => {
    addEl('');
    expect(extractTextShadows().shadows).toEqual([]);
  });

  test('each entry has a value field', () => {
    addEl('1px 1px 2px rgba(0,0,0,0.5)');
    expect(extractTextShadows().shadows[0]).toHaveProperty('value');
  });
});
