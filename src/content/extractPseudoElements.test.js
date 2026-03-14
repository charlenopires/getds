import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractPseudoElements } from './extractPseudoElements.js';

describe('extractPseudoElements — pseudo-element visual properties', () => {
  let window;

  beforeEach(() => {
    window = new Window({ url: 'https://example.com' });
    globalThis.document = window.document;
    globalThis.window = window;
    globalThis.getComputedStyle = (el, pseudo) => {
      if (pseudo && el.__fakePseudo__?.[pseudo]) {
        return {
          getPropertyValue: (prop) => el.__fakePseudo__[pseudo][prop] ?? '',
        };
      }
      return {
        getPropertyValue: (prop) => el.__fakeStyle__?.[prop] ?? '',
      };
    };
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
    delete globalThis.getComputedStyle;
  });

  function addButton(pseudoStyles = {}) {
    const el = document.createElement('button');
    el.__fakePseudo__ = pseudoStyles;
    el.__fakeStyle__ = {};
    document.body.appendChild(el);
    return el;
  }

  test('returns expected shape', () => {
    const result = extractPseudoElements();
    expect(result).toHaveProperty('pseudoElements');
    expect(result).toHaveProperty('selectionStyles');
    expect(result).toHaveProperty('placeholderStyles');
    expect(result).toHaveProperty('markerStyles');
    expect(result).toHaveProperty('pseudoRadii');
    expect(Array.isArray(result.pseudoElements)).toBe(true);
    expect(Array.isArray(result.pseudoRadii)).toBe(true);
  });

  test('captures ::before with content', () => {
    addButton({
      '::before': {
        content: '""',
        'background-color': 'rgb(255, 0, 0)',
        'border-radius': '50%',
      },
    });
    const { pseudoElements } = extractPseudoElements();
    expect(pseudoElements.length).toBe(1);
    expect(pseudoElements[0].pseudo).toBe('::before');
    expect(pseudoElements[0].styles['background-color']).toBe('rgb(255, 0, 0)');
  });

  test('captures ::after with content', () => {
    addButton({
      '::after': {
        content: '"→"',
        'background-color': 'rgb(0, 255, 0)',
      },
    });
    const { pseudoElements } = extractPseudoElements();
    expect(pseudoElements.length).toBe(1);
    expect(pseudoElements[0].pseudo).toBe('::after');
    expect(pseudoElements[0].content).toBe('"→"');
  });

  test('skips pseudo-elements with content: none', () => {
    addButton({
      '::before': { content: 'none' },
    });
    const { pseudoElements } = extractPseudoElements();
    expect(pseudoElements.length).toBe(0);
  });

  test('skips pseudo-elements with empty content', () => {
    addButton({
      '::before': { content: '' },
    });
    const { pseudoElements } = extractPseudoElements();
    expect(pseudoElements.length).toBe(0);
  });

  test('collects pseudoRadii from pseudo-elements', () => {
    addButton({
      '::before': {
        content: '""',
        'border-radius': '50%',
        'background-color': 'red',
      },
    });
    const { pseudoRadii } = extractPseudoElements();
    expect(pseudoRadii.length).toBe(1);
    expect(pseudoRadii[0].value).toBe('50%');
  });

  test('deduplicates pseudoRadii values', () => {
    const btn1 = addButton({
      '::before': { content: '""', 'border-radius': '8px', 'background-color': 'red' },
    });
    const btn2 = addButton({
      '::after': { content: '""', 'border-radius': '8px', 'background-color': 'blue' },
    });
    const { pseudoRadii } = extractPseudoElements();
    expect(pseudoRadii.length).toBe(1);
  });

  test('returns empty arrays when no pseudo-elements exist', () => {
    document.createElement('div'); // don't add to DOM
    const result = extractPseudoElements();
    expect(result.pseudoElements).toEqual([]);
    expect(result.pseudoRadii).toEqual([]);
  });
});
