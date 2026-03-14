import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractSpatialComposition } from './extractSpatialComposition.js';

describe('extractSpatialComposition — Z-axis & composition analysis', () => {
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

  function addElement(tag, styles = {}) {
    const el = document.createElement(tag);
    el.__fakeStyle__ = {
      position: 'static',
      'z-index': 'auto',
      'mix-blend-mode': 'normal',
      cursor: 'auto',
      'pointer-events': 'auto',
      opacity: '1',
      filter: 'none',
      ...styles,
    };
    document.body.appendChild(el);
    return el;
  }

  test('returns expected shape', () => {
    const result = extractSpatialComposition();
    expect(result).toHaveProperty('elementClassifications');
    expect(result).toHaveProperty('zAxisLayerMap');
    expect(result).toHaveProperty('blendModeIntentMap');
    expect(result).toHaveProperty('customCursors');
    expect(result.zAxisLayerMap).toHaveProperty('backgroundAtmosphere');
    expect(result.zAxisLayerMap).toHaveProperty('content');
    expect(result.zAxisLayerMap).toHaveProperty('overlay');
    expect(result.zAxisLayerMap).toHaveProperty('navigation');
    expect(result.zAxisLayerMap).toHaveProperty('decorativeScatter');
  });

  test('classifies decorative element', () => {
    addElement('div', {
      position: 'absolute',
      'z-index': '-1',
      'pointer-events': 'none',
      opacity: '0.3',
    });

    const { elementClassifications } = extractSpatialComposition();
    expect(elementClassifications.length).toBeGreaterThan(0);
    expect(elementClassifications[0].role).toBe('decorative');
  });

  test('classifies structural nav element', () => {
    const nav = addElement('nav', {
      position: 'fixed',
      'z-index': '100',
    });
    // Add interactive child
    const link = document.createElement('a');
    link.__fakeStyle__ = {};
    nav.appendChild(link);

    const { zAxisLayerMap } = extractSpatialComposition();
    expect(zAxisLayerMap.navigation.length).toBeGreaterThan(0);
  });

  test('detects blend mode intent', () => {
    addElement('div', {
      position: 'static',
      'mix-blend-mode': 'difference',
    });

    const { blendModeIntentMap } = extractSpatialComposition();
    expect(blendModeIntentMap.length).toBeGreaterThan(0);
    expect(blendModeIntentMap[0].intent).toBe('adaptive-contrast');
  });

  test('detects multiply blend mode as shadow-overlay', () => {
    addElement('div', {
      position: 'static',
      'mix-blend-mode': 'multiply',
    });

    const { blendModeIntentMap } = extractSpatialComposition();
    const multiply = blendModeIntentMap.find(b => b.blendMode === 'multiply');
    expect(multiply).toBeDefined();
    expect(multiply.intent).toBe('shadow-overlay');
  });

  test('ignores non-positioned elements for classification', () => {
    addElement('div', { position: 'static' });
    addElement('div', { position: 'relative' });

    const { elementClassifications } = extractSpatialComposition();
    expect(elementClassifications.length).toBe(0);
  });

  test('returns empty results when page has no positioned or blended elements', () => {
    const result = extractSpatialComposition();
    expect(result.elementClassifications).toEqual([]);
    expect(result.blendModeIntentMap).toEqual([]);
    expect(result.customCursors).toEqual([]);
  });
});
