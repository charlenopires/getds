/**
 * Task: 03140040 — Detect top-level page template
 * Spec: 446634bf — Layout Pattern Detection
 */

import { describe, test, expect } from 'bun:test';
import { classifyPageTemplate, PAGE_TEMPLATES } from './detectPageTemplate.js';

// Viewport: 1440 × 900
const VP = { w: 1440, h: 900 };

// ── Landmark builders ─────────────────────────────────────────────────────────

/** Full-width landmark spanning the viewport horizontally */
function fullWidthLandmark(tag, top, height, role = null) {
  return { tag, role, rect: { top, left: 0, width: VP.w, height, bottom: top + height, right: VP.w } };
}

/** Partial-width landmark (for sidebars, content panels) */
function partialLandmark(tag, top, left, width, height, role = null) {
  return { tag, role, rect: { top, left, width, height, bottom: top + height, right: left + width } };
}

// ── Typical landmark sets ─────────────────────────────────────────────────────

/** header (80px) + main (740px) + footer (80px) */
const headerContentFooter = [
  fullWidthLandmark('header', 0,   80),
  fullWidthLandmark('main',   80,  740),
  fullWidthLandmark('footer', 820, 80),
];

/** aside (240px wide) + main (1200px wide), side by side */
const sidebarContent = [
  fullWidthLandmark('header', 0,   60),
  partialLandmark('aside', 60, 0,    240, 780),
  partialLandmark('main',  60, 240, 1200, 780),
  fullWidthLandmark('footer', 840, 60),
];

/** 4 equal panels side-by-side below a narrow nav (dashboard) */
const dashboardGrid = [
  fullWidthLandmark('header', 0,  56),
  partialLandmark('nav',    56,  0,   240, 844),
  partialLandmark('main',   56, 240, 1200, 844),  // main contains multiple sub-panels
];

/** main alone, full-width, no header/footer */
const fullWidth = [
  fullWidthLandmark('main', 0, 900),
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PAGE_TEMPLATES — exported template name constants', () => {
  test('exports HEADER_CONTENT_FOOTER', () => {
    expect(PAGE_TEMPLATES.HEADER_CONTENT_FOOTER).toBe('header-content-footer');
  });
  test('exports SIDEBAR_CONTENT', () => {
    expect(PAGE_TEMPLATES.SIDEBAR_CONTENT).toBe('sidebar-content');
  });
  test('exports FULL_WIDTH', () => {
    expect(PAGE_TEMPLATES.FULL_WIDTH).toBe('full-width');
  });
  test('exports DASHBOARD_GRID', () => {
    expect(PAGE_TEMPLATES.DASHBOARD_GRID).toBe('dashboard-grid');
  });
  test('exports UNKNOWN', () => {
    expect(PAGE_TEMPLATES.UNKNOWN).toBe('unknown');
  });
});

describe('classifyPageTemplate — pure classification function', () => {
  test('returns { template, confidence } object', () => {
    const result = classifyPageTemplate(headerContentFooter);
    expect(result).toHaveProperty('template');
    expect(result).toHaveProperty('confidence');
  });

  test('confidence is a number between 0 and 1', () => {
    const { confidence } = classifyPageTemplate(headerContentFooter);
    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(1);
  });

  test('classifies header + main + footer as header-content-footer', () => {
    const { template } = classifyPageTemplate(headerContentFooter);
    expect(template).toBe(PAGE_TEMPLATES.HEADER_CONTENT_FOOTER);
  });

  test('classifies aside + main side-by-side as sidebar-content', () => {
    const { template } = classifyPageTemplate(sidebarContent);
    expect(template).toBe(PAGE_TEMPLATES.SIDEBAR_CONTENT);
  });

  test('classifies full-width main alone as full-width', () => {
    const { template } = classifyPageTemplate(fullWidth);
    expect(template).toBe(PAGE_TEMPLATES.FULL_WIDTH);
  });

  test('classifies nav + wide main as dashboard-grid', () => {
    const { template } = classifyPageTemplate(dashboardGrid);
    expect(template).toBe(PAGE_TEMPLATES.DASHBOARD_GRID);
  });

  test('returns unknown for empty landmark list', () => {
    const { template } = classifyPageTemplate([]);
    expect(template).toBe(PAGE_TEMPLATES.UNKNOWN);
  });

  test('sidebar-content wins over header-content-footer when aside is present', () => {
    const { template } = classifyPageTemplate(sidebarContent);
    expect(template).toBe(PAGE_TEMPLATES.SIDEBAR_CONTENT);
  });

  test('handles landmarks with ARIA role overriding tag', () => {
    // div with role=main should count as main
    const withAriaRole = [
      { tag: 'div', role: 'banner',      rect: { top: 0,   left: 0, width: 1440, height: 80,  bottom: 80,  right: 1440 } },
      { tag: 'div', role: 'main',        rect: { top: 80,  left: 0, width: 1440, height: 740, bottom: 820, right: 1440 } },
      { tag: 'div', role: 'contentinfo', rect: { top: 820, left: 0, width: 1440, height: 80,  bottom: 900, right: 1440 } },
    ];
    const { template } = classifyPageTemplate(withAriaRole);
    expect(template).toBe(PAGE_TEMPLATES.HEADER_CONTENT_FOOTER);
  });

  test('header-content-footer has high confidence (≥ 0.8)', () => {
    const { confidence } = classifyPageTemplate(headerContentFooter);
    expect(confidence).toBeGreaterThanOrEqual(0.8);
  });

  test('handles null/missing rect values gracefully', () => {
    const noRect = [{ tag: 'header', role: null, rect: null }];
    expect(() => classifyPageTemplate(noRect)).not.toThrow();
  });
});
