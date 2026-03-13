/**
 * Task: 6a232a42 — Detect navigation patterns
 * Spec: 446634bf — Layout Pattern Detection
 */

import { describe, test, expect } from 'bun:test';
import { classifyNavPattern, NAV_PATTERNS } from './detectNavPatterns.js';

const VP = { width: 1440, height: 900 };

// ── Descriptor builder ────────────────────────────────────────────────────────

function nav(overrides) {
  return {
    tag: 'nav',
    role: null,
    ariaLabel: null,
    classes: [],
    rect: { top: 0, left: 0, width: 1440, height: 60, bottom: 60, right: 1440 },
    linkCount: 5,
    isFixed: false,
    viewport: VP,
    ...overrides,
  };
}

// ── Typical nav descriptors ───────────────────────────────────────────────────

const topBar = nav({
  rect: { top: 0, left: 0, width: 1440, height: 64, bottom: 64, right: 1440 },
  linkCount: 6,
});

const sideDrawer = nav({
  rect: { top: 0, left: 0, width: 260, height: 900, bottom: 900, right: 260 },
  linkCount: 8,
});

const rightSideDrawer = nav({
  rect: { top: 0, left: 1180, width: 260, height: 900, bottom: 900, right: 1440 },
  linkCount: 8,
});

const tabBar = nav({
  tag: 'div',
  role: 'tablist',
  rect: { top: 200, left: 0, width: 800, height: 48, bottom: 248, right: 800 },
  linkCount: 4,
});

const breadcrumb = nav({
  ariaLabel: 'Breadcrumb',
  rect: { top: 80, left: 0, width: 400, height: 24, bottom: 104, right: 400 },
  linkCount: 3,
});

const breadcrumbByClass = nav({
  classes: ['breadcrumb-nav'],
  rect: { top: 80, left: 0, width: 400, height: 24, bottom: 104, right: 400 },
  linkCount: 3,
});

const pagination = nav({
  ariaLabel: 'Pagination',
  rect: { top: 800, left: 400, width: 400, height: 40, bottom: 840, right: 800 },
  linkCount: 7,
});

const paginationByClass = nav({
  classes: ['pagination'],
  linkCount: 7,
});

describe('NAV_PATTERNS — exported pattern name constants', () => {
  test('exports TOP_BAR',          () => expect(NAV_PATTERNS.TOP_BAR).toBe('top-bar'));
  test('exports SIDE_DRAWER',      () => expect(NAV_PATTERNS.SIDE_DRAWER).toBe('side-drawer'));
  test('exports TAB_BAR',          () => expect(NAV_PATTERNS.TAB_BAR).toBe('tab-bar'));
  test('exports BREADCRUMB_TRAIL', () => expect(NAV_PATTERNS.BREADCRUMB_TRAIL).toBe('breadcrumb-trail'));
  test('exports PAGINATION',       () => expect(NAV_PATTERNS.PAGINATION).toBe('pagination'));
  test('exports UNKNOWN',          () => expect(NAV_PATTERNS.UNKNOWN).toBe('unknown'));
});

describe('classifyNavPattern — pure nav pattern classification', () => {
  test('returns { pattern, confidence }', () => {
    const result = classifyNavPattern(topBar);
    expect(result).toHaveProperty('pattern');
    expect(result).toHaveProperty('confidence');
  });

  test('confidence is between 0 and 1', () => {
    const { confidence } = classifyNavPattern(topBar);
    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(1);
  });

  test('classifies full-width top-positioned nav as top-bar', () => {
    expect(classifyNavPattern(topBar).pattern).toBe(NAV_PATTERNS.TOP_BAR);
  });

  test('classifies narrow tall left-side nav as side-drawer', () => {
    expect(classifyNavPattern(sideDrawer).pattern).toBe(NAV_PATTERNS.SIDE_DRAWER);
  });

  test('classifies narrow tall right-side nav as side-drawer', () => {
    expect(classifyNavPattern(rightSideDrawer).pattern).toBe(NAV_PATTERNS.SIDE_DRAWER);
  });

  test('classifies role=tablist as tab-bar', () => {
    expect(classifyNavPattern(tabBar).pattern).toBe(NAV_PATTERNS.TAB_BAR);
  });

  test('classifies aria-label breadcrumb as breadcrumb-trail', () => {
    expect(classifyNavPattern(breadcrumb).pattern).toBe(NAV_PATTERNS.BREADCRUMB_TRAIL);
  });

  test('classifies breadcrumb class as breadcrumb-trail', () => {
    expect(classifyNavPattern(breadcrumbByClass).pattern).toBe(NAV_PATTERNS.BREADCRUMB_TRAIL);
  });

  test('classifies aria-label pagination as pagination', () => {
    expect(classifyNavPattern(pagination).pattern).toBe(NAV_PATTERNS.PAGINATION);
  });

  test('classifies pagination class as pagination', () => {
    expect(classifyNavPattern(paginationByClass).pattern).toBe(NAV_PATTERNS.PAGINATION);
  });

  test('breadcrumb/pagination take priority over geometric rules', () => {
    // Even if it looks like a top-bar geometrically, label wins
    const labelledBreadcrumb = nav({ ariaLabel: 'breadcrumb navigation', rect: topBar.rect });
    expect(classifyNavPattern(labelledBreadcrumb).pattern).toBe(NAV_PATTERNS.BREADCRUMB_TRAIL);
  });

  test('handles missing rect gracefully', () => {
    expect(() => classifyNavPattern({ ...topBar, rect: null })).not.toThrow();
  });

  test('top-bar has confidence ≥ 0.8 for a clear top-spanning nav', () => {
    expect(classifyNavPattern(topBar).confidence).toBeGreaterThanOrEqual(0.8);
  });

  test('side-drawer has confidence ≥ 0.8 for a clear left-side tall nav', () => {
    expect(classifyNavPattern(sideDrawer).confidence).toBeGreaterThanOrEqual(0.8);
  });
});
