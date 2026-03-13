/**
 * Task: 7535df65 — Inventory ARIA attributes and flag common misuses
 * Spec: 10ab6f26 — Accessibility Audit
 */

import { describe, test, expect } from 'bun:test';
import { collectAriaUsage, detectAriaMisuses } from './auditAriaUsage.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function el(tag, attrs = {}) {
  return {
    tagName: tag,
    getAttribute: (name) => attrs[name] ?? null,
    hasAttribute: (name) => name in attrs,
    attributes: Object.entries(attrs).map(([name, value]) => ({ name, value })),
  };
}

// ── collectAriaUsage ──────────────────────────────────────────────────────────

describe('collectAriaUsage — inventory ARIA attributes across elements', () => {
  test('returns array', () => {
    expect(Array.isArray(collectAriaUsage([]))).toBe(true);
  });

  test('returns empty for elements with no ARIA attrs', () => {
    expect(collectAriaUsage([el('DIV', {})])).toHaveLength(0);
  });

  test('captures role attribute', () => {
    const result = collectAriaUsage([el('DIV', { role: 'button' })]);
    expect(result[0].role).toBe('button');
  });

  test('captures aria-label', () => {
    const result = collectAriaUsage([el('BUTTON', { 'aria-label': 'Close' })]);
    expect(result[0].ariaAttrs).toContainEqual({ name: 'aria-label', value: 'Close' });
  });

  test('captures aria-hidden', () => {
    const result = collectAriaUsage([el('SPAN', { 'aria-hidden': 'true' })]);
    expect(result[0].ariaAttrs.some(a => a.name === 'aria-hidden')).toBe(true);
  });

  test('records tag name', () => {
    const result = collectAriaUsage([el('NAV', { role: 'navigation' })]);
    expect(result[0].tag).toBe('nav');
  });

  test('handles multiple elements', () => {
    const els = [
      el('BUTTON', { 'aria-expanded': 'false' }),
      el('DIV', { role: 'dialog', 'aria-modal': 'true' }),
    ];
    expect(collectAriaUsage(els)).toHaveLength(2);
  });
});

// ── detectAriaMisuses ─────────────────────────────────────────────────────────

describe('detectAriaMisuses — flag common ARIA misuse patterns', () => {
  test('returns array', () => {
    expect(Array.isArray(detectAriaMisuses([]))).toBe(true);
  });

  test('flags role=button on non-interactive element without tabindex', () => {
    const usage = [{ tag: 'div', role: 'button', ariaAttrs: [] }];
    const issues = detectAriaMisuses(usage);
    expect(issues.length).toBeGreaterThanOrEqual(1);
  });

  test('flags aria-hidden=true on focusable element', () => {
    const usage = [{
      tag: 'button',
      role: null,
      ariaAttrs: [{ name: 'aria-hidden', value: 'true' }],
    }];
    const issues = detectAriaMisuses(usage);
    expect(issues.some(i => i.type === 'aria-hidden-focusable')).toBe(true);
  });

  test('issue entry has type, message, and severity fields', () => {
    const usage = [{
      tag: 'button',
      role: null,
      ariaAttrs: [{ name: 'aria-hidden', value: 'true' }],
    }];
    const [issue] = detectAriaMisuses(usage);
    expect(issue).toHaveProperty('type');
    expect(issue).toHaveProperty('message');
    expect(issue).toHaveProperty('severity');
  });

  test('returns empty for clean ARIA usage', () => {
    const usage = [{
      tag: 'nav',
      role: 'navigation',
      ariaAttrs: [{ name: 'aria-label', value: 'Main' }],
    }];
    expect(detectAriaMisuses(usage)).toHaveLength(0);
  });

  test('severity is one of critical, major, minor', () => {
    const usage = [{
      tag: 'button',
      role: null,
      ariaAttrs: [{ name: 'aria-hidden', value: 'true' }],
    }];
    const [issue] = detectAriaMisuses(usage);
    expect(['critical', 'major', 'minor']).toContain(issue.severity);
  });
});
