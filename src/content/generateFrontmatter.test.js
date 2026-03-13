/**
 * Task: b34142d8 — Generate YAML frontmatter for Markdown report
 * Spec: b0d5a227 — Markdown Report Generation
 */

import { describe, test, expect } from 'bun:test';
import { generateFrontmatter } from './generateFrontmatter.js';

describe('generateFrontmatter — produce YAML frontmatter block', () => {
  const meta = {
    url: 'https://example.com',
    title: 'Example Page',
    extractedAt: '2026-03-13T10:00:00.000Z',
    dsx_version: '0.1.0',
    duration: 1234,
  };

  test('returns a string', () => {
    expect(typeof generateFrontmatter(meta)).toBe('string');
  });

  test('starts with ---', () => {
    expect(generateFrontmatter(meta).startsWith('---\n')).toBe(true);
  });

  test('ends with ---', () => {
    const result = generateFrontmatter(meta);
    expect(result.trimEnd().endsWith('\n---')).toBe(true);
  });

  test('includes url field', () => {
    expect(generateFrontmatter(meta)).toContain('url: https://example.com');
  });

  test('includes title field', () => {
    expect(generateFrontmatter(meta)).toContain('title: Example Page');
  });

  test('includes extractedAt field', () => {
    expect(generateFrontmatter(meta)).toContain('extractedAt: 2026-03-13T10:00:00.000Z');
  });

  test('includes dsx_version field', () => {
    expect(generateFrontmatter(meta)).toContain('dsx_version: 0.1.0');
  });

  test('includes duration field in ms', () => {
    expect(generateFrontmatter(meta)).toContain('duration: 1234ms');
  });

  test('title with special characters is quoted', () => {
    const result = generateFrontmatter({ ...meta, title: 'Hello: World' });
    expect(result).toContain("title: 'Hello: World'");
  });

  test('generates valid 3-section YAML fence (--- content ---)', () => {
    const result = generateFrontmatter(meta);
    const lines = result.split('\n');
    expect(lines[0]).toBe('---');
    expect(lines[lines.length - 1]).toBe('---');
  });

  test('handles empty title gracefully', () => {
    const result = generateFrontmatter({ ...meta, title: '' });
    expect(result).toContain('title:');
  });
});
