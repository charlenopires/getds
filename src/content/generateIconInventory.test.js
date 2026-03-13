/**
 * Task: d7b0883a — Generate icon inventory table
 * Spec: 4e6f0589 — Iconography and Asset Detection
 */

import { describe, test, expect } from 'bun:test';
import { generateIconInventory } from './generateIconInventory.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const icons = [
  { identifier: 'arrow.svg',      sourceType: 'inline-svg',  context: 'action',     },
  { identifier: 'arrow.svg',      sourceType: 'inline-svg',  context: 'action',     },
  { identifier: 'logo.svg',       sourceType: 'img-src',     context: 'decorative', },
  { identifier: 'fa-home',        sourceType: 'icon-font',   context: 'navigation', },
  { identifier: 'sprite.svg#star',sourceType: 'use-href',    context: 'action',     },
  { identifier: 'arrow.svg',      sourceType: 'inline-svg',  context: 'navigation', },
];

// ── generateIconInventory ─────────────────────────────────────────────────────

describe('generateIconInventory — build icon inventory with instance counts', () => {
  test('returns array', () => {
    expect(Array.isArray(generateIconInventory([]))).toBe(true);
  });

  test('empty input returns empty array', () => {
    expect(generateIconInventory([])).toEqual([]);
  });

  test('each entry has identifier field', () => {
    const result = generateIconInventory(icons);
    expect(result[0]).toHaveProperty('identifier');
  });

  test('each entry has sourceType field', () => {
    const result = generateIconInventory(icons);
    expect(result[0]).toHaveProperty('sourceType');
  });

  test('each entry has context field', () => {
    const result = generateIconInventory(icons);
    expect(result[0]).toHaveProperty('context');
  });

  test('each entry has count field', () => {
    const result = generateIconInventory(icons);
    expect(result[0]).toHaveProperty('count');
  });

  test('groups by identifier+sourceType+context key', () => {
    // arrow.svg/inline-svg/action appears twice → count 2
    const result = generateIconInventory(icons);
    const entry = result.find(e => e.identifier === 'arrow.svg' && e.context === 'action');
    expect(entry.count).toBe(2);
  });

  test('distinct context treated as separate row', () => {
    // arrow.svg/inline-svg/navigation appears once
    const result = generateIconInventory(icons);
    const navEntry = result.find(e => e.identifier === 'arrow.svg' && e.context === 'navigation');
    expect(navEntry).toBeDefined();
    expect(navEntry.count).toBe(1);
  });

  test('total entries = unique identifier+sourceType+context combinations', () => {
    // arrow.svg/action, logo.svg/decorative, fa-home/navigation, sprite.svg#star/action, arrow.svg/navigation = 5
    expect(generateIconInventory(icons)).toHaveLength(5);
  });

  test('sorted by count descending', () => {
    const result = generateIconInventory(icons);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].count).toBeGreaterThanOrEqual(result[i].count);
    }
  });

  test('single icon has count 1', () => {
    const single = [{ identifier: 'check.svg', sourceType: 'inline-svg', context: 'action' }];
    expect(generateIconInventory(single)[0].count).toBe(1);
  });
});
