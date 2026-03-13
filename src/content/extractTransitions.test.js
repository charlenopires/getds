/**
 * Task: 9f2dc03e — Extract CSS transition properties from computed styles
 * Spec: 1bd1426a — Motion and Animation Extraction
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractTransitions } from './extractTransitions.js';

function fakeStyle(props = {}) {
  return {
    display: props.display ?? 'block',
    visibility: props.visibility ?? 'visible',
    opacity: props.opacity ?? '1',
    getPropertyValue(name) { return props[name] ?? ''; },
  };
}

describe('extractTransitions — extract CSS transition properties from computed styles', () => {
  let window;

  beforeEach(() => {
    window = new Window({ url: 'https://example.com' });
    globalThis.document = window.document;
    globalThis.window = window;
    globalThis.getComputedStyle = (el) => el.__fakeStyle__ ?? fakeStyle();
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
    delete globalThis.getComputedStyle;
  });

  function addEl(tag, styleProps = {}) {
    const el = document.createElement(tag);
    el.__fakeStyle__ = fakeStyle(styleProps);
    document.body.appendChild(el);
    return el;
  }

  test('returns an object with a transitions array', () => {
    const result = extractTransitions();
    expect(result).toHaveProperty('transitions');
    expect(Array.isArray(result.transitions)).toBe(true);
  });

  test('detects an element with a transition', () => {
    addEl('button', {
      'transition-property': 'background-color',
      'transition-duration': '200ms',
      'transition-timing-function': 'ease',
      'transition-delay': '0s',
    });
    const { transitions } = extractTransitions();
    expect(transitions.length).toBeGreaterThanOrEqual(1);
  });

  test('each entry has property field', () => {
    addEl('button', {
      'transition-property': 'opacity',
      'transition-duration': '300ms',
      'transition-timing-function': 'ease-in',
      'transition-delay': '0s',
    });
    const { transitions } = extractTransitions();
    expect(transitions[0]).toHaveProperty('property');
    expect(transitions[0].property).toBe('opacity');
  });

  test('each entry has duration field', () => {
    addEl('button', {
      'transition-property': 'opacity',
      'transition-duration': '300ms',
      'transition-timing-function': 'ease',
      'transition-delay': '0s',
    });
    const { transitions } = extractTransitions();
    expect(transitions[0]).toHaveProperty('duration');
    expect(transitions[0].duration).toBe('300ms');
  });

  test('each entry has timingFunction field', () => {
    addEl('button', {
      'transition-property': 'color',
      'transition-duration': '150ms',
      'transition-timing-function': 'ease-out',
      'transition-delay': '0s',
    });
    const { transitions } = extractTransitions();
    expect(transitions[0]).toHaveProperty('timingFunction');
    expect(transitions[0].timingFunction).toBe('ease-out');
  });

  test('each entry has delay field', () => {
    addEl('button', {
      'transition-property': 'color',
      'transition-duration': '150ms',
      'transition-timing-function': 'ease',
      'transition-delay': '50ms',
    });
    const { transitions } = extractTransitions();
    expect(transitions[0]).toHaveProperty('delay');
    expect(transitions[0].delay).toBe('50ms');
  });

  test('captures cubic-bezier timing function', () => {
    addEl('div', {
      'transition-property': 'transform',
      'transition-duration': '400ms',
      'transition-timing-function': 'cubic-bezier(0.4, 0, 0.2, 1)',
      'transition-delay': '0s',
    });
    const { transitions } = extractTransitions();
    expect(transitions[0].timingFunction).toBe('cubic-bezier(0.4, 0, 0.2, 1)');
  });

  test('skips elements with no transition-property', () => {
    addEl('div', { 'transition-property': '' });
    const { transitions } = extractTransitions();
    expect(transitions).toHaveLength(0);
  });

  test('skips elements with transition-property "none"', () => {
    addEl('div', {
      'transition-property': 'none',
      'transition-duration': '0s',
      'transition-timing-function': 'ease',
      'transition-delay': '0s',
    });
    const { transitions } = extractTransitions();
    expect(transitions).toHaveLength(0);
  });

  test('skips invisible elements', () => {
    addEl('button', {
      display: 'none',
      'transition-property': 'opacity',
      'transition-duration': '200ms',
      'transition-timing-function': 'ease',
      'transition-delay': '0s',
    });
    const { transitions } = extractTransitions();
    expect(transitions).toHaveLength(0);
  });

  test('deduplicates identical transition signatures', () => {
    const props = {
      'transition-property': 'background-color',
      'transition-duration': '200ms',
      'transition-timing-function': 'ease',
      'transition-delay': '0s',
    };
    addEl('button', props);
    addEl('a', props);
    const { transitions } = extractTransitions();
    expect(transitions).toHaveLength(1);
  });

  test('returns empty array for empty document', () => {
    document.body.innerHTML = '';
    const { transitions } = extractTransitions();
    expect(transitions).toHaveLength(0);
  });
});
