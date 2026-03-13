/**
 * Task: bb37c1a7 — Detect card grid patterns and responsive column behavior
 * Spec: 446634bf — Layout Pattern Detection
 */

import { describe, test, expect } from 'bun:test';
import { analyseCardGrid } from './detectCardGrids.js';

// ── Card rect builder ─────────────────────────────────────────────────────────

function card(top, left, width = 300, height = 200) {
  return { rect: { top, left, width, height, bottom: top + height, right: left + width } };
}

// ── Grid arrangements ─────────────────────────────────────────────────────────

/** 3-column × 2-row uniform grid */
const grid3x2 = [
  card(0,    0,   300), card(0,   310, 300), card(0,   620, 300),
  card(210,  0,   300), card(210, 310, 300), card(210, 620, 300),
];

/** 2-column × 3-row uniform grid */
const grid2x3 = [
  card(0,   0,   460), card(0,   470, 460),
  card(210, 0,   460), card(210, 470, 460),
  card(420, 0,   460), card(420, 470, 460),
];

/** 4-column single row */
const grid4x1 = [
  card(0, 0, 200), card(0, 210, 200), card(0, 420, 200), card(0, 630, 200),
];

/** Single card (degenerate) */
const singleCard = [card(0, 0, 400, 300)];

/** Cards with slight positional noise (real DOM has sub-pixel rects) */
const noisyGrid = [
  card(0.4,   0.1,   300), card(0.2,   310.3, 300), card(0.5,   620.8, 300),
  card(210.1, 0.2,   300), card(209.8, 310.1, 300), card(210.3, 620.4, 300),
];

describe('analyseCardGrid — pure grid structure analysis', () => {
  test('returns an object with columnCount, rowCount, cardCount, isUniform', () => {
    const result = analyseCardGrid(grid3x2);
    expect(result).toHaveProperty('columnCount');
    expect(result).toHaveProperty('rowCount');
    expect(result).toHaveProperty('cardCount');
    expect(result).toHaveProperty('isUniform');
  });

  test('detects 3 columns in a 3×2 grid', () => {
    expect(analyseCardGrid(grid3x2).columnCount).toBe(3);
  });

  test('detects 2 rows in a 3×2 grid', () => {
    expect(analyseCardGrid(grid3x2).rowCount).toBe(2);
  });

  test('reports total card count', () => {
    expect(analyseCardGrid(grid3x2).cardCount).toBe(6);
  });

  test('marks uniform grid as isUniform true', () => {
    expect(analyseCardGrid(grid3x2).isUniform).toBe(true);
  });

  test('detects 2 columns in a 2×3 grid', () => {
    expect(analyseCardGrid(grid2x3).columnCount).toBe(2);
  });

  test('detects 3 rows in a 2×3 grid', () => {
    expect(analyseCardGrid(grid2x3).rowCount).toBe(3);
  });

  test('detects 4 columns in a single-row 4×1 grid', () => {
    expect(analyseCardGrid(grid4x1).columnCount).toBe(4);
  });

  test('detects 1 row in a 4×1 grid', () => {
    expect(analyseCardGrid(grid4x1).rowCount).toBe(1);
  });

  test('handles a single card gracefully', () => {
    const result = analyseCardGrid(singleCard);
    expect(result.columnCount).toBe(1);
    expect(result.rowCount).toBe(1);
    expect(result.cardCount).toBe(1);
  });

  test('handles empty array without throwing', () => {
    expect(() => analyseCardGrid([])).not.toThrow();
  });

  test('empty array returns columnCount 0', () => {
    expect(analyseCardGrid([]).columnCount).toBe(0);
  });

  test('tolerates sub-pixel positional noise in real DOM rects', () => {
    expect(analyseCardGrid(noisyGrid).columnCount).toBe(3);
    expect(analyseCardGrid(noisyGrid).rowCount).toBe(2);
  });

  test('cardWidth is reported as the modal card width', () => {
    const result = analyseCardGrid(grid3x2);
    expect(result).toHaveProperty('cardWidth');
    expect(result.cardWidth).toBe(300);
  });

  test('cardHeight is reported as the modal card height', () => {
    const result = analyseCardGrid(grid3x2);
    expect(result).toHaveProperty('cardHeight');
    expect(result.cardHeight).toBe(200);
  });
});
