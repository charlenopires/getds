/**
 * Task: 09cb935b — Generate Limitations section documenting extraction constraints encountered
 * Spec: b0d5a227 — Markdown Report Generation
 */

import { describe, test, expect } from 'bun:test';
import { generateLimitationsSection } from './generateLimitationsSection.js';

const crossOriginLimitation =
  '[cross-origin] Cannot read CSS rules from cross-origin stylesheet: https://cdn.example.com/styles.css';

const shadowDomLimitation =
  '[shadow-dom] Cannot access styles inside closed shadow root on custom-element';

const inaccessibleLimitation =
  '[inaccessible] Computed styles unavailable for 3 elements inside iframes';

describe('generateLimitationsSection — ⚠️ Limitations Markdown section', () => {
  test('returns a string', () => {
    expect(typeof generateLimitationsSection([])).toBe('string');
  });

  test('starts with an H2 section header', () => {
    const result = generateLimitationsSection([]);
    expect(result).toMatch(/^## /);
  });

  test('header contains warning emoji', () => {
    const result = generateLimitationsSection([]);
    expect(result).toContain('⚠️');
  });

  test('header contains "Limitations"', () => {
    const result = generateLimitationsSection([]);
    expect(result.toLowerCase()).toContain('limitation');
  });

  test('with no limitations outputs a "none encountered" message', () => {
    const result = generateLimitationsSection([]);
    expect(result.toLowerCase()).toMatch(/no.*constraint|no.*limitation|none/i);
  });

  test('with limitations outputs one list item per entry', () => {
    const limitations = [crossOriginLimitation, shadowDomLimitation];
    const result = generateLimitationsSection(limitations);
    const items = result.split('\n').filter(l => l.startsWith('- '));
    expect(items).toHaveLength(2);
  });

  test('cross-origin limitation text appears in output', () => {
    const result = generateLimitationsSection([crossOriginLimitation]);
    expect(result).toContain('cross-origin');
    expect(result).toContain('cdn.example.com');
  });

  test('shadow DOM limitation text appears in output', () => {
    const result = generateLimitationsSection([shadowDomLimitation]);
    expect(result).toContain('shadow');
  });

  test('inaccessible styles limitation text appears in output', () => {
    const result = generateLimitationsSection([inaccessibleLimitation]);
    expect(result).toContain('inaccessible');
  });

  test('each limitation is on its own line as a list item', () => {
    const limitations = [crossOriginLimitation, shadowDomLimitation, inaccessibleLimitation];
    const result = generateLimitationsSection(limitations);
    const listItems = result.split('\n').filter(l => l.startsWith('- '));
    expect(listItems).toHaveLength(3);
  });

  test('handles undefined input gracefully', () => {
    expect(() => generateLimitationsSection(undefined)).not.toThrow();
  });

  test('includes count of limitations in header or body when > 0', () => {
    const limitations = [crossOriginLimitation, shadowDomLimitation];
    const result = generateLimitationsSection(limitations);
    expect(result).toContain('2');
  });
});
