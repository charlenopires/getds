import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractArtDirectionTypography } from './extractArtDirectionTypography.js';

describe('extractArtDirectionTypography — typography art direction detection', () => {
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

  function addTextElement(tag, styles = {}, text = 'Sample text') {
    const el = document.createElement(tag);
    el.__fakeStyle__ = {
      'font-size': '16px',
      'font-weight': '400',
      'line-height': '24px',
      'letter-spacing': 'normal',
      'text-transform': 'none',
      'font-family': 'Arial, sans-serif',
      '-webkit-text-stroke': '0px',
      'text-shadow': 'none',
      '-webkit-background-clip': 'border-box',
      'background-clip': 'border-box',
      '-webkit-text-fill-color': 'rgb(0, 0, 0)',
      ...styles,
    };
    el.textContent = text;
    document.body.appendChild(el);
    return el;
  }

  test('returns expected shape', () => {
    const result = extractArtDirectionTypography();
    expect(result).toHaveProperty('artDirectedElements');
    expect(result).toHaveProperty('fluidExpressions');
    expect(result).toHaveProperty('summary');
    expect(Array.isArray(result.artDirectedElements)).toBe(true);
  });

  test('detects display typography with high score', () => {
    addTextElement('h1', {
      'font-size': '80px',
      'font-weight': '900',
      'line-height': '72px',
      'letter-spacing': '-2px',
      'text-transform': 'none',
      'font-family': 'Display Condensed, sans-serif',
    }, 'Big Hero Text');

    const { artDirectedElements, summary } = extractArtDirectionTypography();
    expect(artDirectedElements.length).toBeGreaterThan(0);
    const h1 = artDirectedElements[0];
    expect(h1.displayScore).toBeGreaterThanOrEqual(50);
    expect(h1.leadingCategory).not.toBe('normal');
  });

  test('detects tight leading', () => {
    addTextElement('h2', {
      'font-size': '48px',
      'line-height': '42px',
      'font-weight': '700',
    }, 'Tight Leading');

    const { artDirectedElements, summary } = extractArtDirectionTypography();
    const tight = artDirectedElements.find(e => e.leadingCategory === 'tight-poster' || e.leadingCategory === 'extreme-display');
    expect(tight).toBeDefined();
    expect(summary.hasTightLeading).toBe(true);
  });

  test('detects negative tracking', () => {
    addTextElement('h3', {
      'font-size': '36px',
      'letter-spacing': '-1.5px',
      'font-weight': '700',
    }, 'Tight Tracking');

    const { artDirectedElements, summary } = extractArtDirectionTypography();
    const tight = artDirectedElements.find(e => e.trackingCategory === 'tight');
    expect(tight).toBeDefined();
    expect(summary.hasNegativeTracking).toBe(true);
  });

  test('detects text effects (text-shadow)', () => {
    addTextElement('h1', {
      'font-size': '60px',
      'font-weight': '700',
      'text-shadow': '2px 2px 4px rgba(0,0,0,0.3)',
    }, 'Shadow Text');

    const { artDirectedElements, summary } = extractArtDirectionTypography();
    const withShadow = artDirectedElements.find(e => e.textEffects.textShadow);
    expect(withShadow).toBeDefined();
    expect(summary.textEffectsCount).toBeGreaterThan(0);
  });

  test('skips normal body text', () => {
    addTextElement('p', {
      'font-size': '16px',
      'font-weight': '400',
      'line-height': '24px',
      'letter-spacing': 'normal',
    }, 'Just normal text');

    const { artDirectedElements } = extractArtDirectionTypography();
    expect(artDirectedElements.length).toBe(0);
  });

  test('extracts fluid expressions from stylesheet text', () => {
    const cssText = '.hero-title { font-size: clamp(2rem, 5vw, 4rem); }';
    const { fluidExpressions } = extractArtDirectionTypography([cssText]);
    expect(fluidExpressions.length).toBeGreaterThan(0);
    expect(fluidExpressions[0].expression).toContain('clamp');
  });

  test('returns empty results with no text elements', () => {
    const result = extractArtDirectionTypography();
    expect(result.artDirectedElements).toEqual([]);
    expect(result.fluidExpressions).toEqual([]);
  });
});
