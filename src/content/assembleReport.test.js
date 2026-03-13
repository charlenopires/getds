/**
 * Task: 876d878b — Generate valid Markdown that renders correctly in GitHub, VS Code, and common Markdown viewers
 * Spec: b0d5a227 — Markdown Report Generation
 * Part 2: full report assembly
 */

import { describe, test, expect } from 'bun:test';
import { assembleReport } from './assembleReport.js';
import { validateMarkdown } from './validateMarkdown.js';

const meta = {
  url: 'https://example.com',
  title: 'Example Page',
  extractedAt: '2026-03-13T10:00:00.000Z',
  dsx_version: '0.1.0',
  duration: 1234,
};

const payload = {
  'visual-foundations': {
    colors: [{ raw: '#ff0000', hex: '#ff0000' }],
    fonts:  [{ stack: 'Inter, sans-serif', primary: 'Inter', generic: 'sans-serif' }],
  },
  tokens: {
    'color-ff0000': { $value: '#ff0000', $type: 'color' },
  },
  components: {
    buttons: [{ tag: 'button', classes: [] }],
  },
  'layout-patterns': {
    typeScale:   { steps: [12, 16, 20] },
    spacingGrid: { baseUnit: 8, scale: [4, 8, 16] },
  },
  animations: {
    cssAnimations: [],
    keyframes: [],
  },
  iconography: {},
  accessibility: {
    issues: [],
  },
};

describe('assembleReport — complete Markdown document assembly', () => {
  test('returns a string', () => {
    expect(typeof assembleReport(payload, meta)).toBe('string');
  });

  test('output starts with YAML frontmatter (---)', () => {
    const result = assembleReport(payload, meta);
    expect(result.startsWith('---\n')).toBe(true);
  });

  test('output includes the page URL in frontmatter', () => {
    const result = assembleReport(payload, meta);
    expect(result).toContain('url: https://example.com');
  });

  test('output includes Executive Summary section', () => {
    const result = assembleReport(payload, meta);
    expect(result).toContain('Executive Summary');
  });

  test('output includes all 7 layer H2 sections', () => {
    const result = assembleReport(payload, meta);
    const h2s = result.match(/^## .+/gm);
    // At minimum: executive summary + 7 layers + limitations = 9
    // But executive summary may be ## too
    expect(h2s.length).toBeGreaterThanOrEqual(7);
  });

  test('output includes Limitations section', () => {
    const result = assembleReport(payload, meta);
    expect(result).toContain('⚠️');
    expect(result.toLowerCase()).toContain('limitation');
  });

  test('output passes structural validation', () => {
    const result = assembleReport(payload, meta);
    const { valid, errors } = validateMarkdown(result);
    expect(errors).toEqual([]);
    expect(valid).toBe(true);
  });

  test('output is within 5 MB', () => {
    const result = assembleReport(payload, meta);
    const bytes = new TextEncoder().encode(result).length;
    expect(bytes).toBeLessThanOrEqual(5 * 1024 * 1024);
  });

  test('accepts an optional limitations array', () => {
    const limitations = ['[cross-origin] Cannot read https://cdn.example.com/styles.css'];
    const result = assembleReport(payload, meta, { limitations });
    expect(result).toContain('cross-origin');
  });

  test('handles empty payload gracefully', () => {
    expect(() => assembleReport({}, meta)).not.toThrow();
    const { valid } = validateMarkdown(assembleReport({}, meta));
    expect(valid).toBe(true);
  });

  test('sections appear in document order: frontmatter → summary → layers → limitations', () => {
    const result = assembleReport(payload, meta);
    const summaryPos     = result.indexOf('Executive Summary');
    const visualPos      = result.indexOf('Visual Foundations');
    const limitationsPos = result.indexOf('Limitations');
    expect(summaryPos).toBeGreaterThan(0);
    expect(visualPos).toBeGreaterThan(summaryPos);
    expect(limitationsPos).toBeGreaterThan(visualPos);
  });
});
