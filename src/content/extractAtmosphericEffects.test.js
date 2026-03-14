import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractAtmosphericEffects } from './extractAtmosphericEffects.js';

describe('extractAtmosphericEffects — atmospheric lighting detection', () => {
  let window;

  beforeEach(() => {
    window = new Window({ url: 'https://example.com' });
    globalThis.document = window.document;
    globalThis.window = window;
    globalThis.window.innerWidth = 1920;
    globalThis.window.innerHeight = 1080;
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

  function addElement(styles = {}, rect = { width: 100, height: 100 }) {
    const el = document.createElement('div');
    el.__fakeStyle__ = styles;
    el.getBoundingClientRect = () => ({ ...rect, x: 0, y: 0, top: 0, left: 0, right: rect.width, bottom: rect.height });
    document.body.appendChild(el);
    return el;
  }

  test('returns expected shape', () => {
    const result = extractAtmosphericEffects();
    expect(result).toHaveProperty('atmosphericEffects');
    expect(Array.isArray(result.atmosphericEffects)).toBe(true);
  });

  test('detects ambient-glow element', () => {
    addElement({
      'filter': 'blur(60px)',
      'pointer-events': 'none',
      'opacity': '0.6',
      'background-color': 'rgba(255, 100, 50, 0.8)',
      'background-image': 'none',
      'backdrop-filter': 'none',
    }, { width: 800, height: 600 });

    const { atmosphericEffects } = extractAtmosphericEffects();
    expect(atmosphericEffects.length).toBeGreaterThan(0);
    expect(atmosphericEffects[0].classification).toBe('ambient-glow');
  });

  test('detects frosted-glass element', () => {
    addElement({
      'filter': 'none',
      'backdrop-filter': 'blur(20px)',
      'pointer-events': 'none',
      'opacity': '0.7',
      'background-color': 'rgba(255, 255, 255, 0.1)',
      'background-image': 'none',
    }, { width: 400, height: 400 });

    const { atmosphericEffects } = extractAtmosphericEffects();
    const frosted = atmosphericEffects.find(e => e.classification === 'frosted-glass');
    expect(frosted).toBeDefined();
  });

  test('ignores normal elements without atmospheric properties', () => {
    addElement({
      'filter': 'none',
      'backdrop-filter': 'none',
      'opacity': '1',
      'pointer-events': 'auto',
      'background-color': 'rgb(255, 255, 255)',
      'background-image': 'none',
    });

    const { atmosphericEffects } = extractAtmosphericEffects();
    expect(atmosphericEffects.length).toBe(0);
  });

  test('returns empty array when no elements exist', () => {
    const result = extractAtmosphericEffects();
    expect(result.atmosphericEffects).toEqual([]);
  });

  test('detects nebula-aurora with gradient + blur', () => {
    addElement({
      'filter': 'blur(50px)',
      'pointer-events': 'none',
      'opacity': '0.5',
      'background-color': 'rgba(0, 0, 0, 0)',
      'background-image': 'linear-gradient(45deg, rgb(255, 0, 100), rgb(0, 100, 255))',
      'backdrop-filter': 'none',
    }, { width: 1000, height: 800 });

    const { atmosphericEffects } = extractAtmosphericEffects();
    const nebula = atmosphericEffects.find(e => e.classification === 'nebula-aurora');
    expect(nebula).toBeDefined();
  });
});
