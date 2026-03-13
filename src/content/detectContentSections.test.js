/**
 * Task: b2deb2e4 — Detect content section patterns
 * Spec: 446634bf — Layout Pattern Detection
 */

import { describe, test, expect } from 'bun:test';
import { classifyContentSection, CONTENT_PATTERNS } from './detectContentSections.js';

// ── Signal builder ────────────────────────────────────────────────────────────

function signals(overrides = {}) {
  return {
    tag: 'section',
    classes: [],
    ariaLabel: null,
    hasHeading: false,
    hasLargeImage: false,
    hasVideo: false,
    hasCta: false,
    repeatingItemCount: 0,
    hasBlockquotes: false,
    hasDetails: false,
    hasExpandable: false,
    hasPricingSignals: false,
    hasIcons: false,
    isAtPageTop: false,
    viewportCoverage: 0.3,
    ...overrides,
  };
}

// ── Typical section signal sets ───────────────────────────────────────────────

const hero = signals({
  hasHeading: true, hasLargeImage: true, hasCta: true,
  isAtPageTop: true, viewportCoverage: 0.85,
});

const heroByVideo = signals({
  hasHeading: true, hasVideo: true, hasCta: true,
  isAtPageTop: true, viewportCoverage: 0.9,
});

const featureGrid = signals({
  hasHeading: true, hasIcons: true,
  repeatingItemCount: 4,
});

const testimonials = signals({
  hasBlockquotes: true,
  repeatingItemCount: 3,
});

const testimonialsNoBlockquotes = signals({
  classes: ['testimonials'],
  repeatingItemCount: 4,
});

const pricingTable = signals({
  hasPricingSignals: true, hasCta: true,
  repeatingItemCount: 3, hasHeading: true,
});

const faqAccordion = signals({
  hasDetails: true,
  repeatingItemCount: 8,
});

const faqByAriaExpanded = signals({
  hasExpandable: true,
  repeatingItemCount: 6,
});

describe('CONTENT_PATTERNS — exported pattern name constants', () => {
  test('exports HERO',          () => expect(CONTENT_PATTERNS.HERO).toBe('hero'));
  test('exports FEATURE_GRID',  () => expect(CONTENT_PATTERNS.FEATURE_GRID).toBe('feature-grid'));
  test('exports TESTIMONIALS',  () => expect(CONTENT_PATTERNS.TESTIMONIALS).toBe('testimonials'));
  test('exports PRICING_TABLE', () => expect(CONTENT_PATTERNS.PRICING_TABLE).toBe('pricing-table'));
  test('exports FAQ_ACCORDION', () => expect(CONTENT_PATTERNS.FAQ_ACCORDION).toBe('faq-accordion'));
  test('exports UNKNOWN',       () => expect(CONTENT_PATTERNS.UNKNOWN).toBe('unknown'));
});

describe('classifyContentSection — pure content pattern classification', () => {
  test('returns { pattern, confidence }', () => {
    const result = classifyContentSection(hero);
    expect(result).toHaveProperty('pattern');
    expect(result).toHaveProperty('confidence');
  });

  test('confidence is between 0 and 1', () => {
    const { confidence } = classifyContentSection(hero);
    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(1);
  });

  test('classifies top section with large image + CTA as hero', () => {
    expect(classifyContentSection(hero).pattern).toBe(CONTENT_PATTERNS.HERO);
  });

  test('classifies top section with video + CTA as hero', () => {
    expect(classifyContentSection(heroByVideo).pattern).toBe(CONTENT_PATTERNS.HERO);
  });

  test('classifies icon + repeating items as feature-grid', () => {
    expect(classifyContentSection(featureGrid).pattern).toBe(CONTENT_PATTERNS.FEATURE_GRID);
  });

  test('classifies blockquotes + repeating items as testimonials', () => {
    expect(classifyContentSection(testimonials).pattern).toBe(CONTENT_PATTERNS.TESTIMONIALS);
  });

  test('classifies testimonials class as testimonials', () => {
    expect(classifyContentSection(testimonialsNoBlockquotes).pattern).toBe(CONTENT_PATTERNS.TESTIMONIALS);
  });

  test('classifies pricing signals + CTA + repeating as pricing-table', () => {
    expect(classifyContentSection(pricingTable).pattern).toBe(CONTENT_PATTERNS.PRICING_TABLE);
  });

  test('classifies details elements + many items as faq-accordion', () => {
    expect(classifyContentSection(faqAccordion).pattern).toBe(CONTENT_PATTERNS.FAQ_ACCORDION);
  });

  test('classifies aria-expanded items as faq-accordion', () => {
    expect(classifyContentSection(faqByAriaExpanded).pattern).toBe(CONTENT_PATTERNS.FAQ_ACCORDION);
  });

  test('returns unknown for a bare section with no signals', () => {
    expect(classifyContentSection(signals()).pattern).toBe(CONTENT_PATTERNS.UNKNOWN);
  });

  test('hero takes priority over feature-grid when isAtPageTop', () => {
    const ambiguous = signals({
      isAtPageTop: true, hasLargeImage: true, hasCta: true, hasHeading: true,
      hasIcons: true, repeatingItemCount: 3,
    });
    expect(classifyContentSection(ambiguous).pattern).toBe(CONTENT_PATTERNS.HERO);
  });

  test('handles missing/undefined signals gracefully', () => {
    expect(() => classifyContentSection({})).not.toThrow();
    expect(() => classifyContentSection(null)).not.toThrow();
  });

  test('hero has confidence ≥ 0.85 for strong signals', () => {
    expect(classifyContentSection(hero).confidence).toBeGreaterThanOrEqual(0.85);
  });

  test('class name matching works for known pattern names', () => {
    const pricingByClass = signals({ classes: ['pricing-table'] });
    expect(classifyContentSection(pricingByClass).pattern).toBe(CONTENT_PATTERNS.PRICING_TABLE);
  });
});
