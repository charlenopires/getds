/**
 * Task: 9c262bf9 — Extract max-width and width from container elements
 * Spec: f87063a1 — Grid and Layout Extraction
 */

import { describe, test, expect } from 'bun:test';
import { extractContainerWidths } from './extractContainerWidths.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function style(props = {}) {
  return {
    getPropertyValue(name) { return props[name] ?? ''; },
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('extractContainerWidths — detect content width constraints', () => {
  test('returns array', () => {
    expect(Array.isArray(extractContainerWidths([]))).toBe(true);
  });

  test('returns empty array when no width constraints', () => {
    const result = extractContainerWidths([style({})]);
    expect(result).toHaveLength(0);
  });

  test('captures max-width constraint', () => {
    const result = extractContainerWidths([style({ 'max-width': '1200px' })]);
    expect(result).toHaveLength(1);
    expect(result[0].maxWidth).toBe('1200px');
  });

  test('captures width when set explicitly (non-auto, non-100%)', () => {
    const result = extractContainerWidths([style({ width: '960px' })]);
    expect(result).toHaveLength(1);
    expect(result[0].width).toBe('960px');
  });

  test('ignores auto width', () => {
    const result = extractContainerWidths([style({ width: 'auto' })]);
    expect(result).toHaveLength(0);
  });

  test('ignores 100% width (full-bleed, not a container constraint)', () => {
    const result = extractContainerWidths([style({ width: '100%' })]);
    expect(result).toHaveLength(0);
  });

  test('ignores none max-width', () => {
    const result = extractContainerWidths([style({ 'max-width': 'none' })]);
    expect(result).toHaveLength(0);
  });

  test('deduplicates identical max-width values', () => {
    const styles = [
      style({ 'max-width': '1200px' }),
      style({ 'max-width': '1200px' }),
      style({ 'max-width': '960px' }),
    ];
    const result = extractContainerWidths(styles);
    const maxWidths = result.map(r => r.maxWidth);
    expect(maxWidths.filter(v => v === '1200px')).toHaveLength(1);
  });

  test('entry has maxWidth and width fields', () => {
    const result = extractContainerWidths([style({ 'max-width': '1440px' })]);
    const [entry] = result;
    expect(entry).toHaveProperty('maxWidth');
    expect(entry).toHaveProperty('width');
  });

  test('handles multiple distinct constraints', () => {
    const styles = [
      style({ 'max-width': '1200px' }),
      style({ 'max-width': '768px' }),
      style({ width: '320px' }),
    ];
    expect(extractContainerWidths(styles).length).toBeGreaterThanOrEqual(2);
  });
});
