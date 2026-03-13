/**
 * Task: 25aa134d — Extract all unique border-radius values from computed styles
 * Spec: 7c17b9ef — Elevation and Border Radius Extraction
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractBorderRadius } from './extractBorderRadius.js';

describe('extractBorderRadius — extract unique border-radius values', () => {
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

  function addEl(radius) {
    const el = document.createElement('div');
    el.__fakeStyle__ = { 'border-radius': radius };
    document.body.appendChild(el);
    return el;
  }

  test('returns an object with a radii array', () => {
    const result = extractBorderRadius();
    expect(result).toHaveProperty('radii');
    expect(Array.isArray(result.radii)).toBe(true);
  });

  test('returns empty array when no elements have border-radius', () => {
    addEl('0px');
    expect(extractBorderRadius().radii).toEqual([]);
  });

  test('captures a single border-radius value', () => {
    addEl('4px');
    const { radii } = extractBorderRadius();
    expect(radii.length).toBe(1);
    expect(radii[0].value).toBe('4px');
  });

  test('deduplicates identical values', () => {
    addEl('4px');
    addEl('4px');
    expect(extractBorderRadius().radii.length).toBe(1);
  });

  test('collects multiple distinct values', () => {
    addEl('4px');
    addEl('8px');
    addEl('9999px');
    expect(extractBorderRadius().radii.length).toBe(3);
  });

  test('skips 0px values', () => {
    addEl('0px');
    expect(extractBorderRadius().radii).toEqual([]);
  });

  test('skips empty values', () => {
    addEl('');
    expect(extractBorderRadius().radii).toEqual([]);
  });

  test('each entry has a value field', () => {
    addEl('4px');
    expect(extractBorderRadius().radii[0]).toHaveProperty('value');
  });

  test('captures percentage values', () => {
    addEl('50%');
    const { radii } = extractBorderRadius();
    expect(radii[0].value).toBe('50%');
  });
});
