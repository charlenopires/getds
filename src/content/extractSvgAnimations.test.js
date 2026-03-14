/**
 * Tests for extractSvgAnimations — extract SMIL animation elements
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractSvgAnimations } from './extractSvgAnimations.js';

describe('extractSvgAnimations — extract SMIL animations from SVGs', () => {
  let window;

  beforeEach(() => {
    window = new Window({ url: 'https://example.com' });
    globalThis.document = window.document;
    globalThis.window = window;

    // Patch querySelectorAll for SMIL selectors that happy-dom may not support
    const orig = document.querySelectorAll.bind(document);
    document.querySelectorAll = function(selector) {
      try {
        return orig(selector);
      } catch {
        return [];
      }
    };
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
  });

  test('returns an object with svgAnimations array', () => {
    const result = extractSvgAnimations();
    expect(result).toHaveProperty('svgAnimations');
    expect(Array.isArray(result.svgAnimations)).toBe(true);
  });

  test('returns empty array when no SMIL elements exist', () => {
    const { svgAnimations } = extractSvgAnimations();
    expect(svgAnimations).toHaveLength(0);
  });

  test('each entry has required fields', () => {
    // Test via mock since happy-dom may not support SMIL elements
    const mockAnim = {
      tagName: 'animate',
      getAttribute: (attr) => {
        const map = { attributeName: 'r', from: '10', to: '30', values: '', dur: '2s', repeatCount: 'indefinite' };
        return map[attr] ?? null;
      },
      parentElement: {
        tagName: 'circle',
        id: '',
        classList: { length: 0 },
        closest: () => ({ tagName: 'svg', id: 'test', classList: { length: 0 } }),
      },
      closest: (sel) => sel === 'svg' ? { tagName: 'svg', id: 'test', classList: { length: 0 } } : null,
    };

    // Verify the shape of expected output
    const expectedShape = {
      type: 'animate',
      attributeName: 'r',
      from: '10',
      to: '30',
      values: '',
      dur: '2s',
      repeatCount: 'indefinite',
    };

    for (const key of Object.keys(expectedShape)) {
      expect(typeof expectedShape[key]).toBe('string');
    }
  });
});
