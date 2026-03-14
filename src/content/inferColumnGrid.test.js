/**
 * Tests for inferColumnGrid — column grid system inference
 */

import { describe, test, expect } from 'bun:test';
import { inferColumnGridSystem, detectModularGrid } from './inferColumnGrid.js';

describe('inferColumnGridSystem — detect column grid system', () => {
  test('returns an object with detectedSystem, dominantColumnCount, and confidence', () => {
    const result = inferColumnGridSystem([]);
    expect(result).toHaveProperty('detectedSystem');
    expect(result).toHaveProperty('dominantColumnCount');
    expect(result).toHaveProperty('confidence');
  });

  test('returns "none" for empty input', () => {
    const result = inferColumnGridSystem([]);
    expect(result.detectedSystem).toBe('none');
    expect(result.dominantColumnCount).toBe(0);
    expect(result.confidence).toBe(0);
  });

  test('returns "none" when all column counts are zero', () => {
    const result = inferColumnGridSystem([{ columnCount: 0 }, { columnCount: 0 }]);
    expect(result.detectedSystem).toBe('none');
  });

  test('detects "12-column" when dominant column count is 12', () => {
    const descriptors = [
      { columnCount: 12 },
      { columnCount: 12 },
      { columnCount: 6 },
    ];
    const result = inferColumnGridSystem(descriptors);
    expect(result.detectedSystem).toBe('12-column');
    expect(result.dominantColumnCount).toBe(12);
  });

  test('detects "12-column" when most values are divisors of 12', () => {
    const descriptors = [
      { columnCount: 3 },
      { columnCount: 4 },
      { columnCount: 6 },
      { columnCount: 12 },
      { columnCount: 2 },
    ];
    const result = inferColumnGridSystem(descriptors);
    expect(result.detectedSystem).toBe('12-column');
  });

  test('confidence for 12-column reflects ratio of divisors', () => {
    const descriptors = [
      { columnCount: 3 },
      { columnCount: 4 },
      { columnCount: 6 },
      { columnCount: 12 },
    ];
    const result = inferColumnGridSystem(descriptors);
    expect(result.confidence).toBe(1);
  });

  test('detects "16-column" when dominant column count is 16', () => {
    const descriptors = [
      { columnCount: 16 },
      { columnCount: 8 },
      { columnCount: 4 },
    ];
    const result = inferColumnGridSystem(descriptors);
    expect(result.detectedSystem).toBe('16-column');
    expect(result.dominantColumnCount).toBe(16);
  });

  test('detects "16-column" when most values are divisors of 16', () => {
    const descriptors = [
      { columnCount: 8 },
      { columnCount: 8 },
      { columnCount: 16 },
      { columnCount: 4 },
      { columnCount: 2 },
    ];
    const result = inferColumnGridSystem(descriptors);
    expect(result.detectedSystem).toBe('16-column');
  });

  test('returns "custom" when column counts do not match 12 or 16 patterns', () => {
    const descriptors = [
      { columnCount: 5 },
      { columnCount: 7 },
      { columnCount: 9 },
    ];
    const result = inferColumnGridSystem(descriptors);
    expect(result.detectedSystem).toBe('custom');
  });

  test('custom system reports dominant column count', () => {
    const descriptors = [
      { columnCount: 5 },
      { columnCount: 5 },
      { columnCount: 7 },
    ];
    const result = inferColumnGridSystem(descriptors);
    expect(result.detectedSystem).toBe('custom');
    expect(result.dominantColumnCount).toBe(5);
  });

  test('custom system confidence reflects dominant frequency ratio', () => {
    const descriptors = [
      { columnCount: 5 },
      { columnCount: 5 },
      { columnCount: 7 },
      { columnCount: 9 },
    ];
    const result = inferColumnGridSystem(descriptors);
    expect(result.confidence).toBe(0.5); // 2/4
  });

  test('handles single descriptor', () => {
    const result = inferColumnGridSystem([{ columnCount: 12 }]);
    expect(result.detectedSystem).toBe('12-column');
    expect(result.dominantColumnCount).toBe(12);
    expect(result.confidence).toBe(1);
  });

  test('filters out zero column counts', () => {
    const descriptors = [
      { columnCount: 0 },
      { columnCount: 12 },
      { columnCount: 6 },
    ];
    const result = inferColumnGridSystem(descriptors);
    expect(result.detectedSystem).toBe('12-column');
  });

  test('confidence is a number between 0 and 1', () => {
    const descriptors = [
      { columnCount: 12 },
      { columnCount: 3 },
      { columnCount: 5 },
    ];
    const result = inferColumnGridSystem(descriptors);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});

describe('detectModularGrid — detect modular grid with rows and columns', () => {
  test('returns an object with isModular, rowCount, and columnCount', () => {
    const result = detectModularGrid([]);
    expect(result).toHaveProperty('isModular');
    expect(result).toHaveProperty('rowCount');
    expect(result).toHaveProperty('columnCount');
  });

  test('returns isModular false for empty input', () => {
    const result = detectModularGrid([]);
    expect(result.isModular).toBe(false);
    expect(result.rowCount).toBe(0);
    expect(result.columnCount).toBe(0);
  });

  test('detects a modular grid with explicit row and column tracks', () => {
    const descriptors = [
      { columnCount: 4, templateRows: '100px 200px 100px' },
    ];
    const result = detectModularGrid(descriptors);
    expect(result.isModular).toBe(true);
    expect(result.rowCount).toBe(3);
    expect(result.columnCount).toBe(4);
  });

  test('returns isModular false when templateRows is "none"', () => {
    const descriptors = [{ columnCount: 4, templateRows: 'none' }];
    const result = detectModularGrid(descriptors);
    expect(result.isModular).toBe(false);
  });

  test('returns isModular false when templateRows is empty string', () => {
    const descriptors = [{ columnCount: 4, templateRows: '' }];
    const result = detectModularGrid(descriptors);
    expect(result.isModular).toBe(false);
  });

  test('returns isModular false when templateRows is undefined', () => {
    const descriptors = [{ columnCount: 4 }];
    const result = detectModularGrid(descriptors);
    expect(result.isModular).toBe(false);
  });

  test('returns isModular false when only one row track', () => {
    const descriptors = [{ columnCount: 4, templateRows: '100px' }];
    const result = detectModularGrid(descriptors);
    expect(result.isModular).toBe(false);
  });

  test('returns isModular false when columnCount is 1', () => {
    const descriptors = [{ columnCount: 1, templateRows: '100px 200px' }];
    const result = detectModularGrid(descriptors);
    expect(result.isModular).toBe(false);
  });

  test('returns isModular false when columnCount is 0', () => {
    const descriptors = [{ columnCount: 0, templateRows: '100px 200px' }];
    const result = detectModularGrid(descriptors);
    expect(result.isModular).toBe(false);
  });

  test('detects modular grid from the first qualifying descriptor', () => {
    const descriptors = [
      { columnCount: 1, templateRows: '100px 200px' }, // not modular (1 column)
      { columnCount: 3, templateRows: '1fr 1fr 1fr 1fr' }, // modular
    ];
    const result = detectModularGrid(descriptors);
    expect(result.isModular).toBe(true);
    expect(result.rowCount).toBe(4);
    expect(result.columnCount).toBe(3);
  });

  test('handles templateRows with various units', () => {
    const descriptors = [
      { columnCount: 6, templateRows: '1fr auto 200px 100px' },
    ];
    const result = detectModularGrid(descriptors);
    expect(result.isModular).toBe(true);
    expect(result.rowCount).toBe(4);
    expect(result.columnCount).toBe(6);
  });

  test('trims whitespace from templateRows before splitting', () => {
    const descriptors = [
      { columnCount: 2, templateRows: '  100px  200px  ' },
    ];
    const result = detectModularGrid(descriptors);
    expect(result.isModular).toBe(true);
    expect(result.rowCount).toBe(2);
  });
});
