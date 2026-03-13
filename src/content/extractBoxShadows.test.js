/**
 * Task: 24382a9a — Extract all unique box-shadow values from computed styles
 * Spec: 7c17b9ef — Elevation and Border Radius Extraction
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractBoxShadows } from './extractBoxShadows.js';

describe('extractBoxShadows — extract unique box-shadow values', () => {
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
    el.__fakeStyle__ = { 'box-shadow': shadow };
    document.body.appendChild(el);
    return el;
  }

  test('returns an object with a shadows array', () => {
    const result = extractBoxShadows();
    expect(result).toHaveProperty('shadows');
    expect(Array.isArray(result.shadows)).toBe(true);
  });

  test('returns empty array when no elements have box-shadow', () => {
    addEl('none');
    expect(extractBoxShadows().shadows).toEqual([]);
  });

  test('captures a single box-shadow value', () => {
    addEl('0px 2px 4px rgba(0,0,0,0.2)');
    const { shadows } = extractBoxShadows();
    expect(shadows.length).toBe(1);
    expect(shadows[0].value).toBe('0px 2px 4px rgba(0,0,0,0.2)');
  });

  test('deduplicates identical shadow values', () => {
    addEl('0px 2px 4px rgba(0,0,0,0.2)');
    addEl('0px 2px 4px rgba(0,0,0,0.2)');
    expect(extractBoxShadows().shadows.length).toBe(1);
  });

  test('collects multiple distinct shadow values', () => {
    addEl('0px 1px 2px rgba(0,0,0,0.1)');
    addEl('0px 4px 8px rgba(0,0,0,0.2)');
    expect(extractBoxShadows().shadows.length).toBe(2);
  });

  test('skips elements with shadow value "none"', () => {
    addEl('none');
    expect(extractBoxShadows().shadows).toEqual([]);
  });

  test('skips elements with empty shadow value', () => {
    addEl('');
    expect(extractBoxShadows().shadows).toEqual([]);
  });

  test('each shadow entry has a value field', () => {
    addEl('0px 2px 4px rgba(0,0,0,0.2)');
    const { shadows } = extractBoxShadows();
    expect(shadows[0]).toHaveProperty('value');
  });

  test('returns empty array when document has no elements', () => {
    expect(extractBoxShadows().shadows).toEqual([]);
  });

  test('handles inset shadows', () => {
    addEl('inset 0px 2px 4px rgba(0,0,0,0.1)');
    const { shadows } = extractBoxShadows();
    expect(shadows[0].value).toBe('inset 0px 2px 4px rgba(0,0,0,0.1)');
  });
});
