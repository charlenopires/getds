/**
 * Tests for detectAnimationLibraries — detect third-party animation libraries
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { detectAnimationLibraries } from './detectAnimationLibraries.js';

describe('detectAnimationLibraries — detect animation libraries on the page', () => {
  let window;
  let originalQuerySelectorAll;

  beforeEach(() => {
    window = new Window({ url: 'https://example.com' });
    globalThis.document = window.document;
    globalThis.window = window;

    // Patch querySelectorAll to handle selectors happy-dom doesn't support
    originalQuerySelectorAll = document.querySelectorAll.bind(document);
    document.querySelectorAll = function(selector) {
      try {
        return originalQuerySelectorAll(selector);
      } catch {
        // For unsupported selectors, return empty NodeList-like array
        return [];
      }
    };
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
  });

  test('returns an object with a libraries array', () => {
    const result = detectAnimationLibraries();
    expect(result).toHaveProperty('libraries');
    expect(Array.isArray(result.libraries)).toBe(true);
  });

  test('returns empty array when no libraries are present', () => {
    const { libraries } = detectAnimationLibraries();
    expect(libraries).toHaveLength(0);
  });

  test('detects AOS via [data-aos] attribute', () => {
    const el = document.createElement('div');
    el.setAttribute('data-aos', 'fade-up');
    document.body.appendChild(el);

    const { libraries } = detectAnimationLibraries();
    const aos = libraries.find(l => l.name === 'AOS');
    expect(aos).toBeDefined();
    expect(aos.detected).toBe(true);
    expect(aos.details.elementCount).toBe(1);
    expect(aos.details.animationTypes).toContain('fade-up');
  });

  test('detects Framer Motion via data-framer attributes', () => {
    const el = document.createElement('div');
    el.setAttribute('data-framer-appear-id', 'abc');
    document.body.appendChild(el);

    const { libraries } = detectAnimationLibraries();
    const fm = libraries.find(l => l.name === 'Framer Motion');
    expect(fm).toBeDefined();
    expect(fm.detected).toBe(true);
  });

  test('detects Locomotive Scroll via [data-scroll] attribute', () => {
    const el = document.createElement('div');
    el.setAttribute('data-scroll', '');
    document.body.appendChild(el);

    const { libraries } = detectAnimationLibraries();
    const loco = libraries.find(l => l.name === 'Locomotive Scroll');
    expect(loco).toBeDefined();
  });

  test('each library entry has name, version, detected, details', () => {
    const el = document.createElement('div');
    el.setAttribute('data-aos', 'fade-in');
    document.body.appendChild(el);

    const { libraries } = detectAnimationLibraries();
    const lib = libraries[0];
    expect(lib).toHaveProperty('name');
    expect(lib).toHaveProperty('version');
    expect(lib).toHaveProperty('detected');
    expect(lib).toHaveProperty('details');
  });

  test('detects multiple libraries simultaneously', () => {
    const el1 = document.createElement('div');
    el1.setAttribute('data-aos', 'fade');
    document.body.appendChild(el1);

    const el2 = document.createElement('div');
    el2.setAttribute('data-framer-appear-id', 'x');
    document.body.appendChild(el2);

    const { libraries } = detectAnimationLibraries();
    expect(libraries.length).toBeGreaterThanOrEqual(2);
  });

  test('collects distinct AOS animation types', () => {
    for (const type of ['fade-up', 'fade-down', 'fade-up']) {
      const el = document.createElement('div');
      el.setAttribute('data-aos', type);
      document.body.appendChild(el);
    }

    const { libraries } = detectAnimationLibraries();
    const aos = libraries.find(l => l.name === 'AOS');
    expect(aos.details.animationTypes).toContain('fade-up');
    expect(aos.details.animationTypes).toContain('fade-down');
    // Deduplication: should have exactly 2 unique types
    expect(aos.details.animationTypes).toHaveLength(2);
  });
});
