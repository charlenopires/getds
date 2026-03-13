/**
 * Task: 876d878b — Generate valid Markdown that renders correctly in GitHub, VS Code, and common Markdown viewers
 * Spec: b0d5a227 — Markdown Report Generation
 * Part 1: structural validator
 */

import { describe, test, expect } from 'bun:test';
import { validateMarkdown } from './validateMarkdown.js';

describe('validateMarkdown — structural correctness checks', () => {
  test('returns { valid: true } for well-formed Markdown', () => {
    const md = '# Title\n\nSome content.\n\n## Section\n\nMore content.';
    expect(validateMarkdown(md)).toEqual({ valid: true, errors: [] });
  });

  test('returns { valid: true } for Markdown with balanced fenced code blocks', () => {
    const md = '# Title\n\n```json\n{"a":1}\n```\n\nEnd.';
    expect(validateMarkdown(md)).toEqual({ valid: true, errors: [] });
  });

  test('detects unclosed fenced code block', () => {
    const md = '# Title\n\n```json\n{"a":1}\n\nEnd.';
    const result = validateMarkdown(md);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].toLowerCase()).toContain('fenced');
  });

  test('detects YAML frontmatter not at the start', () => {
    const md = '# Title\n\n---\nurl: https://example.com\n---\n\nContent.';
    const result = validateMarkdown(md);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.toLowerCase().includes('frontmatter'))).toBe(true);
  });

  test('accepts valid YAML frontmatter at the start', () => {
    const md = '---\nurl: https://example.com\ntitle: Test\n---\n\n# Title\n\nContent.';
    const result = validateMarkdown(md);
    expect(result.valid).toBe(true);
  });

  test('detects GFM table with inconsistent column counts', () => {
    // Header has 3 cols, separator has 3, but data row has 2
    const md = '| A | B | C |\n|---|---|---|\n| 1 | 2 |\n';
    const result = validateMarkdown(md);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.toLowerCase().includes('table'))).toBe(true);
  });

  test('accepts a well-formed GFM table', () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |\n';
    expect(validateMarkdown(md).valid).toBe(true);
  });

  test('returns errors as an array of strings', () => {
    const result = validateMarkdown('```\nunclosed');
    expect(Array.isArray(result.errors)).toBe(true);
    result.errors.forEach(e => expect(typeof e).toBe('string'));
  });

  test('handles empty string', () => {
    expect(validateMarkdown('')).toEqual({ valid: true, errors: [] });
  });

  test('multiple errors are all reported', () => {
    // Orphaned frontmatter (not at start) + unclosed fence
    const md = '# Title\n\n---\nurl: x\n---\n\n```\nunclosed';
    const result = validateMarkdown(md);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});
