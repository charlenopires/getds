/**
 * Task: 44b27524 — Traverse open shadow DOM recursively via element.shadowRoot
 * Spec: 21d9e937 — Protected Page Resilience
 */

import { describe, test, expect } from 'bun:test';
import { collectAllElements } from './traverseShadowDom.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEl(tag, shadowChildren = null) {
  const el = { tagName: tag, shadowRoot: null, children: [] };
  if (shadowChildren !== null) {
    el.shadowRoot = { children: shadowChildren };
  }
  return el;
}

function makeTree(rootChildren) {
  return { children: rootChildren };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('collectAllElements — recursive shadow DOM traversal', () => {
  test('returns flat array', () => {
    const el = makeEl('DIV');
    el.children = [];
    const result = collectAllElements([el]);
    expect(Array.isArray(result)).toBe(true);
  });

  test('includes a simple element with no shadow root', () => {
    const el = makeEl('DIV');
    const result = collectAllElements([el]);
    expect(result).toContain(el);
  });

  test('includes nested children recursively', () => {
    const child = makeEl('SPAN');
    const parent = makeEl('DIV');
    parent.children = [child];
    const result = collectAllElements([parent]);
    expect(result).toContain(parent);
    expect(result).toContain(child);
  });

  test('includes elements inside open shadow root', () => {
    const shadowChild = makeEl('P');
    const host = makeEl('CUSTOM-EL', [shadowChild]);
    host.children = [];
    const result = collectAllElements([host]);
    expect(result).toContain(host);
    expect(result).toContain(shadowChild);
  });

  test('does not include null shadowRoot children (closed shadow DOM)', () => {
    const host = makeEl('CLOSED-EL'); // shadowRoot stays null
    host.children = [];
    const result = collectAllElements([host]);
    expect(result).toContain(host);
    // No extra elements added for null shadowRoot
    expect(result).toHaveLength(1);
  });

  test('handles nested shadow roots (shadow inside shadow)', () => {
    const deepShadowChild = makeEl('DEEP');
    const innerHost = makeEl('INNER-HOST', [deepShadowChild]);
    innerHost.children = [];
    const outerHost = makeEl('OUTER-HOST', [innerHost]);
    outerHost.children = [];
    const result = collectAllElements([outerHost]);
    expect(result).toContain(outerHost);
    expect(result).toContain(innerHost);
    expect(result).toContain(deepShadowChild);
  });

  test('handles empty input array', () => {
    expect(collectAllElements([])).toEqual([]);
  });

  test('handles multiple root elements', () => {
    const a = makeEl('A');
    const b = makeEl('B');
    const result = collectAllElements([a, b]);
    expect(result).toContain(a);
    expect(result).toContain(b);
  });

  test('traverses both light DOM children and shadow DOM children', () => {
    const lightChild = makeEl('LIGHT');
    const shadowChild = makeEl('SHADOW');
    const host = makeEl('HOST', [shadowChild]);
    host.children = [lightChild];
    const result = collectAllElements([host]);
    expect(result).toContain(host);
    expect(result).toContain(lightChild);
    expect(result).toContain(shadowChild);
  });

  test('returns each element exactly once (no duplicates)', () => {
    const child = makeEl('SPAN');
    const parent = makeEl('DIV');
    parent.children = [child];
    const result = collectAllElements([parent]);
    const unique = new Set(result);
    expect(result.length).toBe(unique.size);
  });
});
