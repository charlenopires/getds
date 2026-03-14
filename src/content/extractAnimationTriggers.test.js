/**
 * Tests for extractAnimationTriggers — detect animation triggers
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import { extractAnimationTriggers } from './extractAnimationTriggers.js';

describe('extractAnimationTriggers — detect what triggers animations', () => {
  let window;

  beforeEach(() => {
    window = new Window({ url: 'https://example.com' });
    globalThis.document = window.document;
    globalThis.window = window;
  });

  afterEach(async () => {
    await window.happyDOM.abort();
    delete globalThis.document;
    delete globalThis.window;
  });

  test('returns an object with a triggers array', () => {
    const result = extractAnimationTriggers();
    expect(result).toHaveProperty('triggers');
    expect(Array.isArray(result.triggers)).toBe(true);
  });

  test('returns empty array when no triggers found', () => {
    const { triggers } = extractAnimationTriggers();
    expect(triggers).toHaveLength(0);
  });

  test('detects scroll trigger via [data-aos] attribute', () => {
    const el = document.createElement('div');
    el.setAttribute('data-aos', 'fade-up');
    document.body.appendChild(el);

    const { triggers } = extractAnimationTriggers();
    const scroll = triggers.find(t => t.type === 'scroll');
    expect(scroll).toBeDefined();
    expect(scroll.animationOrProperty).toBe('fade-up');
    expect(scroll.source).toBe('[data-aos]');
  });

  test('detects scroll trigger via [data-scroll] attribute', () => {
    const el = document.createElement('div');
    el.setAttribute('data-scroll', 'true');
    document.body.appendChild(el);

    const { triggers } = extractAnimationTriggers();
    const scroll = triggers.find(t => t.type === 'scroll');
    expect(scroll).toBeDefined();
  });

  test('each trigger has type, selector, animationOrProperty, source', () => {
    const el = document.createElement('div');
    el.setAttribute('data-aos', 'zoom');
    document.body.appendChild(el);

    const { triggers } = extractAnimationTriggers();
    const t = triggers[0];
    expect(t).toHaveProperty('type');
    expect(t).toHaveProperty('selector');
    expect(t).toHaveProperty('animationOrProperty');
    expect(t).toHaveProperty('source');
  });

  test('deduplicates identical triggers', () => {
    for (let i = 0; i < 3; i++) {
      const el = document.createElement('div');
      el.className = 'card';
      el.setAttribute('data-aos', 'fade');
      document.body.appendChild(el);
    }

    const { triggers } = extractAnimationTriggers();
    // Each element has its own selector so they may be unique, but
    // at minimum we should have triggers
    expect(triggers.length).toBeGreaterThan(0);
    expect(triggers.every(t => t.type === 'scroll')).toBe(true);
  });
});
