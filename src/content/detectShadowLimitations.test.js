/**
 * Task: 17286671 — Detect closed shadow DOM and log each instance as a limitation
 * Spec: 21d9e937 — Protected Page Resilience
 */

import { describe, test, expect } from 'bun:test';
import { detectClosedShadowRoots } from './detectShadowLimitations.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function el(tag, { isShadowHost = false, hasShadowRoot = true } = {}) {
  const node = {
    tagName: tag,
    shadowRoot: null,
    getAttribute: () => null,
    children: [],
  };
  if (isShadowHost && hasShadowRoot) {
    node.shadowRoot = { children: [] }; // open shadow root
  }
  // closed: isShadowHost=true but hasShadowRoot=false → shadowRoot remains null
  return node;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('detectClosedShadowRoots — closed shadow DOM limitation detection', () => {
  test('returns array', () => {
    expect(Array.isArray(detectClosedShadowRoots([]))).toBe(true);
  });

  test('returns empty array when no shadow hosts present', () => {
    const elements = [el('DIV'), el('SPAN'), el('P')];
    expect(detectClosedShadowRoots(elements)).toHaveLength(0);
  });

  test('returns empty array when all shadow hosts have open shadow roots', () => {
    const elements = [el('MY-EL', { isShadowHost: true, hasShadowRoot: true })];
    expect(detectClosedShadowRoots(elements)).toHaveLength(0);
  });

  test('detects a known shadow host element (custom element) with null shadowRoot as closed', () => {
    const host = el('MY-ELEMENT', { isShadowHost: true, hasShadowRoot: false });
    // simulate custom element: tag contains hyphen
    const result = detectClosedShadowRoots([host]);
    expect(result).toHaveLength(1);
  });

  test('limitation entry has layer, message, and element fields', () => {
    const host = el('X-BUTTON', { isShadowHost: true, hasShadowRoot: false });
    const [limitation] = detectClosedShadowRoots([host]);
    expect(limitation).toHaveProperty('layer');
    expect(limitation).toHaveProperty('message');
    expect(limitation).toHaveProperty('element');
  });

  test('limitation message mentions closed shadow DOM', () => {
    const host = el('X-CARD', { isShadowHost: true, hasShadowRoot: false });
    const [limitation] = detectClosedShadowRoots([host]);
    expect(limitation.message.toLowerCase()).toContain('closed shadow');
  });

  test('limitation element contains the tag name', () => {
    const host = el('X-NAV', { isShadowHost: true, hasShadowRoot: false });
    const [limitation] = detectClosedShadowRoots([host]);
    expect(limitation.element.toLowerCase()).toContain('x-nav');
  });

  test('detects multiple closed shadow hosts', () => {
    const elements = [
      el('X-HEADER', { isShadowHost: true, hasShadowRoot: false }),
      el('DIV'),
      el('X-FOOTER', { isShadowHost: true, hasShadowRoot: false }),
    ];
    expect(detectClosedShadowRoots(elements)).toHaveLength(2);
  });

  test('non-custom elements (no hyphen) with null shadowRoot are not flagged', () => {
    const plain = el('DIV');
    expect(detectClosedShadowRoots([plain])).toHaveLength(0);
  });

  test('layer is one of the known extraction layers', () => {
    const host = el('X-WIDGET', { isShadowHost: true, hasShadowRoot: false });
    const [limitation] = detectClosedShadowRoots([host]);
    const knownLayers = [
      'visual-foundations', 'tokens', 'components',
      'layout-patterns', 'animations', 'iconography', 'accessibility',
    ];
    expect(knownLayers).toContain(limitation.layer);
  });
});
