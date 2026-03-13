/**
 * Task: 9ebaca6f — Catalogue each icon by its usage context
 * Spec: 4e6f0589 — Iconography and Asset Detection
 */

import { describe, test, expect } from 'bun:test';
import { classifyIconContext, ICON_CONTEXTS } from './classifyIconContext.js';

// ── ICON_CONTEXTS ─────────────────────────────────────────────────────────────

describe('ICON_CONTEXTS — exported context constants', () => {
  test('has navigation', () => expect(ICON_CONTEXTS.navigation).toBe('navigation'));
  test('has action', () => expect(ICON_CONTEXTS.action).toBe('action'));
  test('has status', () => expect(ICON_CONTEXTS.status).toBe('status'));
  test('has decorative', () => expect(ICON_CONTEXTS.decorative).toBe('decorative'));
});

// ── classifyIconContext ───────────────────────────────────────────────────────

describe('classifyIconContext — classify icon context from ancestor chain', () => {
  function el(tags = [], { ariaHidden = false, role = null, ariaLabel = null } = {}) {
    const ancestors = tags.map(t => ({ tagName: t.toUpperCase() }));
    return {
      getAttribute: (a) => {
        if (a === 'aria-hidden') return ariaHidden ? 'true' : null;
        if (a === 'role') return role;
        if (a === 'aria-label') return ariaLabel;
        return null;
      },
      closest: (sel) => {
        const tag = sel.toUpperCase();
        const found = ancestors.find(a => a.tagName === tag);
        return found ?? null;
      },
      parentElement: ancestors[0] ?? null,
    };
  }

  test('returns "navigation" when ancestor is nav', () => {
    expect(classifyIconContext(el(['nav']))).toBe('navigation');
  });

  test('returns "action" when ancestor is button', () => {
    expect(classifyIconContext(el(['button']))).toBe('action');
  });

  test('returns "action" when ancestor is a', () => {
    expect(classifyIconContext(el(['a']))).toBe('action');
  });

  test('returns "status" when role is alert', () => {
    expect(classifyIconContext(el([], { role: 'alert' }))).toBe('status');
  });

  test('returns "status" when role is status', () => {
    expect(classifyIconContext(el([], { role: 'status' }))).toBe('status');
  });

  test('returns "decorative" when aria-hidden=true', () => {
    expect(classifyIconContext(el(['button'], { ariaHidden: true }))).toBe('decorative');
  });

  test('returns "action" when aria-label present and ancestor is button', () => {
    expect(classifyIconContext(el(['button'], { ariaLabel: 'Close' }))).toBe('action');
  });

  test('returns "decorative" when no semantic context', () => {
    expect(classifyIconContext(el(['div']))).toBe('decorative');
  });

  test('navigation takes precedence over action (nav > button)', () => {
    expect(classifyIconContext(el(['nav', 'button']))).toBe('navigation');
  });

  test('decorative takes precedence when aria-hidden=true regardless of parent', () => {
    expect(classifyIconContext(el(['nav'], { ariaHidden: true }))).toBe('decorative');
  });
});
