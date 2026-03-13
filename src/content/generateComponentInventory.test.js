/**
 * Task: 852dd06a — Generate component inventory table
 * Spec: 86aa4a39 — UI Component Detection
 */

import { describe, test, expect } from 'bun:test';
import { generateComponentInventory } from './generateComponentInventory.js';

describe('generateComponentInventory — aggregate component detection results into inventory', () => {
  test('returns an array', () => {
    const result = generateComponentInventory({});
    expect(Array.isArray(result)).toBe(true);
  });

  test('returns empty array when no components detected', () => {
    const result = generateComponentInventory({
      buttons: [],
      formInputs: [],
      navComponents: [],
      cards: [],
      modals: [],
      tables: [],
    });
    expect(result).toHaveLength(0);
  });

  test('each inventory entry has componentName field', () => {
    const result = generateComponentInventory({
      buttons: [{ tag: 'button', classes: ['btn'], role: null }],
    });
    expect(result[0]).toHaveProperty('componentName');
  });

  test('each inventory entry has instanceCount field', () => {
    const result = generateComponentInventory({
      buttons: [
        { tag: 'button', classes: ['btn'], role: null },
        { tag: 'button', classes: ['btn'], role: null },
      ],
    });
    const entry = result.find(e => e.componentName === 'button');
    expect(entry).toBeDefined();
    expect(entry.instanceCount).toBe(2);
  });

  test('each inventory entry has variantCount field', () => {
    const result = generateComponentInventory({
      buttons: [{ tag: 'button', classes: ['btn'], styles: { 'background-color': 'blue' } }],
    });
    expect(result[0]).toHaveProperty('variantCount');
  });

  test('each inventory entry has cssClasses array', () => {
    const result = generateComponentInventory({
      buttons: [{ tag: 'button', classes: ['btn', 'btn-primary'], role: null }],
    });
    const entry = result.find(e => e.componentName === 'button');
    expect(Array.isArray(entry.cssClasses)).toBe(true);
  });

  test('cssClasses is a union of all class names seen across instances', () => {
    const result = generateComponentInventory({
      buttons: [
        { tag: 'button', classes: ['btn', 'btn-primary'], role: null },
        { tag: 'button', classes: ['btn', 'btn-secondary'], role: null },
      ],
    });
    const entry = result.find(e => e.componentName === 'button');
    expect(entry.cssClasses).toContain('btn');
    expect(entry.cssClasses).toContain('btn-primary');
    expect(entry.cssClasses).toContain('btn-secondary');
  });

  test('each detected component type appears as a separate inventory entry', () => {
    const result = generateComponentInventory({
      buttons:      [{ tag: 'button', classes: [] }],
      formInputs:   [{ tag: 'input',  classes: [] }],
      navComponents:[{ tag: 'nav',    classes: [], navType: 'nav' }],
    });
    const names = result.map(e => e.componentName);
    expect(names).toContain('button');
    expect(names).toContain('input');
    expect(names).toContain('nav');
  });

  test('variantCount is 1 when all instances have the same styles', () => {
    const result = generateComponentInventory({
      buttons: [
        { tag: 'button', classes: [], styles: { 'background-color': 'blue' } },
        { tag: 'button', classes: [], styles: { 'background-color': 'blue' } },
      ],
    });
    const entry = result.find(e => e.componentName === 'button');
    expect(entry.variantCount).toBe(1);
  });

  test('variantCount is 2 when instances have different styles', () => {
    const result = generateComponentInventory({
      buttons: [
        { tag: 'button', classes: [], styles: { 'background-color': 'blue' } },
        { tag: 'button', classes: [], styles: { 'background-color': 'red'  } },
      ],
    });
    const entry = result.find(e => e.componentName === 'button');
    expect(entry.variantCount).toBe(2);
  });

  test('handles missing component categories gracefully', () => {
    expect(() => generateComponentInventory({ buttons: [{ tag: 'button', classes: [] }] })).not.toThrow();
  });

  test('cards use componentName "card"', () => {
    const result = generateComponentInventory({
      cards: [{ tag: 'div', parentTag: 'ul', instanceCount: 3, hasImage: true, hasAction: true, classes: ['card'] }],
    });
    expect(result.some(e => e.componentName === 'card')).toBe(true);
  });

  test('card instanceCount reflects the card group instanceCount', () => {
    const result = generateComponentInventory({
      cards: [{ tag: 'div', parentTag: 'ul', instanceCount: 4, hasImage: true, hasAction: false, classes: [] }],
    });
    const entry = result.find(e => e.componentName === 'card');
    expect(entry.instanceCount).toBe(4);
  });
});
