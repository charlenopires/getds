import { describe, test, expect } from 'bun:test';
import { extractAuthoredValues } from './extractAuthoredValues.js';

describe('extractAuthoredValues', () => {
  test('returns empty for no stylesheets', () => {
    const { authoredValues } = extractAuthoredValues([]);
    expect(authoredValues).toEqual([]);
  });

  test('detects var() in padding', () => {
    const css = ['.card { padding: var(--spacing-lg); }'];
    const { authoredValues } = extractAuthoredValues(css);
    expect(authoredValues).toHaveLength(1);
    expect(authoredValues[0].selector).toBe('.card');
    expect(authoredValues[0].property).toBe('padding');
    expect(authoredValues[0].authoredValue).toBe('var(--spacing-lg)');
    expect(authoredValues[0].expressionType).toBe('var');
  });

  test('detects clamp() in font-size', () => {
    const css = ['h1 { font-size: clamp(2rem, 5vw, 4rem); }'];
    const { authoredValues } = extractAuthoredValues(css);
    expect(authoredValues).toHaveLength(1);
    expect(authoredValues[0].expressionType).toBe('clamp');
  });

  test('detects calc() in width', () => {
    const css = ['.container { width: calc(100% - 2rem); }'];
    const { authoredValues } = extractAuthoredValues(css);
    expect(authoredValues).toHaveLength(1);
    expect(authoredValues[0].expressionType).toBe('calc');
  });

  test('detects min() and max()', () => {
    const css = ['.box { max-width: min(90vw, 1200px); height: max(300px, 50vh); }'];
    const { authoredValues } = extractAuthoredValues(css);
    expect(authoredValues).toHaveLength(2);
    const minEntry = authoredValues.find(v => v.expressionType === 'min');
    const maxEntry = authoredValues.find(v => v.expressionType === 'max');
    expect(minEntry).toBeDefined();
    expect(maxEntry).toBeDefined();
  });

  test('ignores plain values without expressions', () => {
    const css = ['.card { padding: 16px; margin: 8px; width: 100%; }'];
    const { authoredValues } = extractAuthoredValues(css);
    expect(authoredValues).toHaveLength(0);
  });

  test('deduplicates identical entries', () => {
    const css = [
      '.card { padding: var(--spacing-md); }',
      '.card { padding: var(--spacing-md); }',
    ];
    const { authoredValues } = extractAuthoredValues(css);
    expect(authoredValues).toHaveLength(1);
  });

  test('handles multiple properties in one rule', () => {
    const css = ['.section { padding: var(--p); margin: var(--m); gap: var(--g); }'];
    const { authoredValues } = extractAuthoredValues(css);
    expect(authoredValues).toHaveLength(3);
  });

  test('ignores properties not in target list', () => {
    const css = ['.box { color: var(--text-color); background: var(--bg); }'];
    const { authoredValues } = extractAuthoredValues(css);
    expect(authoredValues).toHaveLength(0);
  });

  test('detects grid-template-columns with var()', () => {
    const css = ['.grid { grid-template-columns: var(--grid-cols); }'];
    const { authoredValues } = extractAuthoredValues(css);
    expect(authoredValues).toHaveLength(1);
    expect(authoredValues[0].property).toBe('grid-template-columns');
  });
});
