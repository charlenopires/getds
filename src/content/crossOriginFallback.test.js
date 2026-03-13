/**
 * Task: 6242e18d — Handle cross-origin stylesheet restrictions with getComputedStyle fallback
 * Spec: fff645a0 — Color System Extraction
 */

import { describe, test, expect, mock, beforeEach } from 'bun:test';
import {
  getStylesheetText,
  collectStylesheetTexts,
  CROSS_ORIGIN_MARKER,
} from './crossOriginFallback.js';

describe('getStylesheetText — safely read a stylesheet text content', () => {
  test('returns cssText when stylesheet is same-origin', () => {
    const sheet = {
      get cssRules() { return [{ cssText: 'body { color: red; }' }]; },
      ownerNode: { textContent: 'body { color: red; }' },
    };
    const result = getStylesheetText(sheet);
    expect(typeof result.text).toBe('string');
    expect(result.crossOrigin).toBe(false);
  });

  test('returns crossOrigin=true when cssRules access throws SecurityError', () => {
    const sheet = {
      get cssRules() {
        const err = new Error('SecurityError: cross-origin');
        err.name = 'SecurityError';
        throw err;
      },
      href: 'https://external.cdn.com/styles.css',
      ownerNode: null,
    };
    const result = getStylesheetText(sheet);
    expect(result.crossOrigin).toBe(true);
  });

  test('returns empty text for cross-origin sheets', () => {
    const sheet = {
      get cssRules() { throw Object.assign(new Error(), { name: 'SecurityError' }); },
      href: 'https://cdn.example.com/a.css',
      ownerNode: null,
    };
    const result = getStylesheetText(sheet);
    expect(result.text).toBe('');
  });

  test('includes the sheet href in the result', () => {
    const sheet = {
      get cssRules() { throw Object.assign(new Error(), { name: 'SecurityError' }); },
      href: 'https://cdn.example.com/styles.css',
      ownerNode: null,
    };
    const result = getStylesheetText(sheet);
    expect(result.href).toBe('https://cdn.example.com/styles.css');
  });

  test('reads inline style text from ownerNode.textContent when cssRules present', () => {
    const sheet = {
      get cssRules() { return []; },
      ownerNode: { textContent: ':root { --color: #fff; }' },
      href: null,
    };
    const result = getStylesheetText(sheet);
    expect(result.text).toContain('--color');
    expect(result.crossOrigin).toBe(false);
  });

  test('handles non-SecurityError exceptions by returning empty text', () => {
    const sheet = {
      get cssRules() { throw new Error('unexpected error'); },
      href: null,
      ownerNode: null,
    };
    const result = getStylesheetText(sheet);
    expect(result.text).toBe('');
    expect(result.crossOrigin).toBe(false);
  });
});

describe('collectStylesheetTexts — gather text from all sheets, logging cross-origin ones', () => {
  test('returns texts array and limitations array', () => {
    const result = collectStylesheetTexts([], () => {});
    expect(result).toHaveProperty('texts');
    expect(result).toHaveProperty('limitations');
    expect(Array.isArray(result.texts)).toBe(true);
    expect(Array.isArray(result.limitations)).toBe(true);
  });

  test('collects text from accessible sheets', () => {
    const sheets = [
      {
        get cssRules() { return []; },
        ownerNode: { textContent: 'body { color: red; }' },
        href: null,
      },
    ];
    const result = collectStylesheetTexts(sheets, () => {});
    expect(result.texts).toContain('body { color: red; }');
  });

  test('records a limitation entry for each cross-origin sheet', () => {
    const sheets = [
      {
        get cssRules() { throw Object.assign(new Error(), { name: 'SecurityError' }); },
        href: 'https://cdn.example.com/a.css',
        ownerNode: null,
      },
    ];
    const result = collectStylesheetTexts(sheets, () => {});
    expect(result.limitations).toHaveLength(1);
    expect(result.limitations[0]).toContain('https://cdn.example.com/a.css');
  });

  test('calls the logger for each cross-origin sheet', () => {
    const logged = [];
    const sheets = [
      {
        get cssRules() { throw Object.assign(new Error(), { name: 'SecurityError' }); },
        href: 'https://cdn.example.com/b.css',
        ownerNode: null,
      },
    ];
    collectStylesheetTexts(sheets, (msg) => logged.push(msg));
    expect(logged.length).toBe(1);
    expect(logged[0]).toMatch(/cross.origin/i);
  });

  test('does not log for same-origin sheets', () => {
    const logged = [];
    const sheets = [
      {
        get cssRules() { return []; },
        ownerNode: { textContent: 'a { color: blue; }' },
        href: null,
      },
    ];
    collectStylesheetTexts(sheets, (msg) => logged.push(msg));
    expect(logged).toHaveLength(0);
  });

  test('handles mixed same-origin and cross-origin sheets', () => {
    const sheets = [
      {
        get cssRules() { return []; },
        ownerNode: { textContent: 'body { color: black; }' },
        href: null,
      },
      {
        get cssRules() { throw Object.assign(new Error(), { name: 'SecurityError' }); },
        href: 'https://external.com/styles.css',
        ownerNode: null,
      },
    ];
    const result = collectStylesheetTexts(sheets, () => {});
    expect(result.texts).toHaveLength(1);
    expect(result.limitations).toHaveLength(1);
  });

  test('CROSS_ORIGIN_MARKER is exported as a string constant', () => {
    expect(typeof CROSS_ORIGIN_MARKER).toBe('string');
    expect(CROSS_ORIGIN_MARKER.length).toBeGreaterThan(0);
  });
});
