/**
 * Task: 551d3d89 — Check img elements for alt attribute presence
 * Spec: 10ab6f26 — Accessibility Audit
 */

import { describe, test, expect } from 'bun:test';
import { auditAltText } from './auditAltText.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function img(attrs = {}) {
  return {
    tagName: 'IMG',
    hasAttribute: (name) => name in attrs,
    getAttribute: (name) => attrs[name] ?? null,
    src: attrs.src ?? 'image.png',
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('auditAltText — img alt attribute audit', () => {
  test('returns array', () => {
    expect(Array.isArray(auditAltText([]))).toBe(true);
  });

  test('returns empty for img with descriptive alt text', () => {
    expect(auditAltText([img({ alt: 'A red apple' })])).toHaveLength(0);
  });

  test('returns empty for img with alt="" (decorative — intentional)', () => {
    expect(auditAltText([img({ alt: '' })])).toHaveLength(0);
  });

  test('flags img missing alt attribute entirely', () => {
    const issues = auditAltText([img({})]);
    expect(issues).toHaveLength(1);
  });

  test('issue type is "missing-alt" for absent attribute', () => {
    const [issue] = auditAltText([img({})]);
    expect(issue.type).toBe('missing-alt');
  });

  test('issue has severity, message, and src fields', () => {
    const [issue] = auditAltText([img({ src: 'logo.png' })]);
    expect(issue).toHaveProperty('severity');
    expect(issue).toHaveProperty('message');
    expect(issue).toHaveProperty('src');
  });

  test('severity is critical for missing alt', () => {
    const [issue] = auditAltText([img({})]);
    expect(issue.severity).toBe('critical');
  });

  test('src is included in issue', () => {
    const [issue] = auditAltText([img({ src: 'hero.jpg' })]);
    expect(issue.src).toBe('hero.jpg');
  });

  test('handles multiple images — flags only those missing alt', () => {
    const images = [
      img({ alt: 'Description', src: 'a.png' }),
      img({ src: 'b.png' }),  // missing alt
      img({ alt: '', src: 'c.png' }),
    ];
    const issues = auditAltText(images);
    expect(issues).toHaveLength(1);
    expect(issues[0].src).toBe('b.png');
  });

  test('returns empty for no images', () => {
    expect(auditAltText([])).toHaveLength(0);
  });
});
