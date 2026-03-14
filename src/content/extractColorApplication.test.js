import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractColorApplication } from './extractColorApplication.js';

describe('extractColorApplication — semantic color roles & accent detection', () => {
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

  function addElement(tag, styles = {}, parent = document.body) {
    const el = document.createElement(tag);
    el.__fakeStyle__ = styles;
    parent.appendChild(el);
    return el;
  }

  test('returns expected shape', () => {
    const result = extractColorApplication();
    expect(result).toHaveProperty('accentColors');
    expect(result).toHaveProperty('colorFunctionMap');
    expect(Array.isArray(result.accentColors)).toBe(true);
  });

  test('detects accent color on inline element differing from parent', () => {
    const p = addElement('p', { color: 'rgb(0, 0, 0)' });
    const span = addElement('span', { color: 'rgb(255, 0, 0)' }, p);
    span.textContent = 'highlighted text';

    const { accentColors } = extractColorApplication();
    expect(accentColors.length).toBeGreaterThan(0);
    expect(accentColors[0].color).toBe('rgb(255, 0, 0)');
    expect(accentColors[0].parentColor).toBe('rgb(0, 0, 0)');
  });

  test('does not flag same-color inline elements as accents', () => {
    const p = addElement('p', { color: 'rgb(0, 0, 0)' });
    addElement('span', { color: 'rgb(0, 0, 0)' }, p);

    const { accentColors } = extractColorApplication();
    expect(accentColors.length).toBe(0);
  });

  test('builds color function map with contexts', () => {
    addElement('div', {
      color: 'rgb(51, 51, 51)',
      'background-color': 'rgb(255, 255, 255)',
      'border-color': 'rgba(0, 0, 0, 0)',
      'box-shadow': 'none',
    });

    const { colorFunctionMap } = extractColorApplication();
    const textColor = colorFunctionMap['rgb(51, 51, 51)'];
    expect(textColor).toBeDefined();
    expect(textColor.contexts).toContain('text');
  });

  test('tracks background color context', () => {
    addElement('div', {
      color: 'rgb(0, 0, 0)',
      'background-color': 'rgb(245, 245, 245)',
      'border-color': 'rgba(0, 0, 0, 0)',
      'box-shadow': 'none',
    });

    const { colorFunctionMap } = extractColorApplication();
    const bgColor = colorFunctionMap['rgb(245, 245, 245)'];
    expect(bgColor).toBeDefined();
    expect(bgColor.contexts).toContain('background');
  });

  test('returns empty results when no elements exist', () => {
    const result = extractColorApplication();
    expect(result.accentColors).toEqual([]);
    expect(Object.keys(result.colorFunctionMap).length).toBe(0);
  });

  test('deduplicates accent colors', () => {
    const p = addElement('p', { color: 'rgb(0, 0, 0)' });
    addElement('span', { color: 'rgb(255, 0, 0)' }, p);
    addElement('em', { color: 'rgb(255, 0, 0)' }, p);

    const { accentColors } = extractColorApplication();
    // Same color+parentColor combo should be deduped
    expect(accentColors.length).toBe(1);
  });
});
