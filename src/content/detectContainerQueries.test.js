/**
 * Task: c8cede90 — Detect container queries (@container) in addition to media queries
 * Spec: f87063a1 — Grid and Layout Extraction
 */

import { describe, test, expect } from 'bun:test';
import { extractContainerQueriesFromSheets } from './detectContainerQueries.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const CONTAINER_RULE_TYPE = 12; // CSSContainerRule type

function makeSheet(rules = []) {
  return { cssRules: rules };
}

function containerRule(conditionText, name = '') {
  return { type: CONTAINER_RULE_TYPE, conditionText, containerName: name, cssRules: [] };
}

function mediaRule(conditionText) {
  return { type: 4, conditionText, cssRules: [] };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('extractContainerQueriesFromSheets — detect @container rules', () => {
  test('returns array', () => {
    expect(Array.isArray(extractContainerQueriesFromSheets([]))).toBe(true);
  });

  test('returns empty for no rules', () => {
    expect(extractContainerQueriesFromSheets([makeSheet([])])).toHaveLength(0);
  });

  test('returns empty when only media rules present', () => {
    const sheet = makeSheet([mediaRule('(min-width: 768px)')]);
    expect(extractContainerQueriesFromSheets([sheet])).toHaveLength(0);
  });

  test('detects a @container rule', () => {
    const sheet = makeSheet([containerRule('(min-width: 400px)')]);
    expect(extractContainerQueriesFromSheets([sheet])).toHaveLength(1);
  });

  test('entry has condition field', () => {
    const sheet = makeSheet([containerRule('(min-width: 400px)')]);
    const [entry] = extractContainerQueriesFromSheets([sheet]);
    expect(entry).toHaveProperty('condition');
  });

  test('entry has name field', () => {
    const sheet = makeSheet([containerRule('(min-width: 400px)', 'sidebar')]);
    const [entry] = extractContainerQueriesFromSheets([sheet]);
    expect(entry).toHaveProperty('name');
    expect(entry.name).toBe('sidebar');
  });

  test('condition value matches conditionText', () => {
    const sheet = makeSheet([containerRule('(min-width: 400px)')]);
    const [entry] = extractContainerQueriesFromSheets([sheet]);
    expect(entry.condition).toBe('(min-width: 400px)');
  });

  test('deduplicates identical container conditions', () => {
    const sheet = makeSheet([
      containerRule('(min-width: 400px)'),
      containerRule('(min-width: 400px)'),
    ]);
    expect(extractContainerQueriesFromSheets([sheet])).toHaveLength(1);
  });

  test('handles multiple distinct container queries', () => {
    const sheet = makeSheet([
      containerRule('(min-width: 300px)', 'card'),
      containerRule('(min-width: 600px)', 'main'),
    ]);
    expect(extractContainerQueriesFromSheets([sheet])).toHaveLength(2);
  });

  test('handles cross-origin sheets silently', () => {
    const blocked = {
      get cssRules() { throw new DOMException('Blocked', 'SecurityError'); },
    };
    expect(() => extractContainerQueriesFromSheets([blocked])).not.toThrow();
    expect(extractContainerQueriesFromSheets([blocked])).toHaveLength(0);
  });
});
