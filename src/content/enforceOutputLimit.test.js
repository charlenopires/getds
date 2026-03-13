/**
 * Task: 35866216 — Enforce 5MB maximum output size for generated Markdown
 * Spec: b0d5a227 — Markdown Report Generation
 */

import { describe, test, expect } from 'bun:test';
import { enforceOutputLimit, MAX_BYTES } from './enforceOutputLimit.js';

const MB = 1024 * 1024;

describe('enforceOutputLimit — keep Markdown output under 5 MB', () => {
  test('MAX_BYTES is 5 242 880 (5 MiB)', () => {
    expect(MAX_BYTES).toBe(5 * MB);
  });

  test('returns the original string when under the limit', () => {
    const input = 'Hello, world!';
    expect(enforceOutputLimit(input)).toBe(input);
  });

  test('returns a string', () => {
    expect(typeof enforceOutputLimit('small')).toBe('string');
  });

  test('output byte length does not exceed MAX_BYTES when input is oversized', () => {
    // Generate a string slightly over 5 MB
    const oversize = 'A'.repeat(5 * MB + 100);
    const result = enforceOutputLimit(oversize);
    const bytes = new TextEncoder().encode(result).length;
    expect(bytes).toBeLessThanOrEqual(MAX_BYTES);
  });

  test('truncated output includes a truncation notice', () => {
    const oversize = 'A'.repeat(5 * MB + 1000);
    const result = enforceOutputLimit(oversize);
    expect(result.toLowerCase()).toContain('truncat');
  });

  test('truncation notice appears at the end of the output', () => {
    const oversize = 'A'.repeat(5 * MB + 1000);
    const result = enforceOutputLimit(oversize);
    const lastLine = result.trimEnd().split('\n').at(-1);
    expect(lastLine?.toLowerCase()).toMatch(/truncat|limit|exceed/);
  });

  test('handles empty string without throwing', () => {
    expect(() => enforceOutputLimit('')).not.toThrow();
    expect(enforceOutputLimit('')).toBe('');
  });

  test('accepts a custom maxBytes override', () => {
    const customMax = 50;
    const input = 'A'.repeat(100);
    const result = enforceOutputLimit(input, customMax);
    const bytes = new TextEncoder().encode(result).length;
    expect(bytes).toBeLessThanOrEqual(customMax);
  });

  test('does not mutilate multibyte UTF-8 characters (no partial sequences)', () => {
    // Each emoji is 4 bytes; build a string just over a small limit
    const emoji = '🎨'; // U+1F3A8 → 4 bytes in UTF-8
    const repeated = emoji.repeat(200); // 800 bytes
    const result = enforceOutputLimit(repeated, 100);
    // The result must decode cleanly — no replacement characters
    expect(result).not.toContain('\uFFFD');
  });
});
