import { describe, test, expect } from 'bun:test';
import { classifyLayoutType } from './classifyLayoutType.js';

describe('classifyLayoutType', () => {
  test('classifies dashboard layout', () => {
    const result = classifyLayoutType({
      landmarks: ['aside', 'nav', 'main'],
      hasGrid: true,
    });
    expect(result.layoutType).toBe('Dashboard');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  test('classifies settings layout', () => {
    const result = classifyLayoutType({
      landmarks: ['nav', 'aside'],
      hasForm: true,
    });
    expect(result.layoutType).toBe('Settings');
  });

  test('classifies content layout', () => {
    const result = classifyLayoutType({
      landmarks: ['article', 'main', 'header', 'footer'],
    });
    expect(result.layoutType).toBe('Content');
  });

  test('classifies resource listing', () => {
    const result = classifyLayoutType({
      landmarks: ['main'],
      hasTable: true,
      hasGrid: true,
    });
    expect(result.layoutType).toBe('Resource');
  });

  test('returns generic content for no signals', () => {
    const result = classifyLayoutType({ landmarks: [] });
    expect(result.layoutType).toBe('Content');
    expect(result.confidence).toBe(0.3);
    expect(result.description).toBe('Generic content page');
  });

  test('handles missing signal properties', () => {
    const result = classifyLayoutType({});
    expect(result.layoutType).toBe('Content');
    expect(result.confidence).toBe(0.3);
  });
});
