/**
 * Task: 39653794 — Extract @keyframes rules from stylesheets
 * Spec: 1bd1426a — Motion and Animation Extraction
 */

import { describe, test, expect } from 'bun:test';
import { parseKeyframes } from './extractKeyframes.js';

describe('parseKeyframes — extract @keyframes rules from CSS text', () => {
  test('returns an array', () => {
    expect(Array.isArray(parseKeyframes(''))).toBe(true);
  });

  test('returns empty array for CSS with no @keyframes', () => {
    expect(parseKeyframes('.btn { color: red; }')).toHaveLength(0);
  });

  test('detects a simple @keyframes rule', () => {
    const css = `@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`;
    const result = parseKeyframes(css);
    expect(result).toHaveLength(1);
  });

  test('each entry has a name field', () => {
    const css = `@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`;
    const [entry] = parseKeyframes(css);
    expect(entry).toHaveProperty('name');
    expect(entry.name).toBe('fadeIn');
  });

  test('each entry has a stops array', () => {
    const css = `@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`;
    const [entry] = parseKeyframes(css);
    expect(entry).toHaveProperty('stops');
    expect(Array.isArray(entry.stops)).toBe(true);
  });

  test('"from" stop is recorded', () => {
    const css = `@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`;
    const [entry] = parseKeyframes(css);
    expect(entry.stops.some(s => s.key === 'from')).toBe(true);
  });

  test('"to" stop is recorded', () => {
    const css = `@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`;
    const [entry] = parseKeyframes(css);
    expect(entry.stops.some(s => s.key === 'to')).toBe(true);
  });

  test('percentage stop is recorded', () => {
    const css = `@keyframes slide { 0% { transform: translateX(0); } 50% { transform: translateX(50px); } 100% { transform: translateX(100px); } }`;
    const [entry] = parseKeyframes(css);
    const keys = entry.stops.map(s => s.key);
    expect(keys).toContain('0%');
    expect(keys).toContain('50%');
    expect(keys).toContain('100%');
  });

  test('each stop has a styles object with animated properties', () => {
    const css = `@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`;
    const [entry] = parseKeyframes(css);
    const fromStop = entry.stops.find(s => s.key === 'from');
    expect(fromStop).toHaveProperty('styles');
    expect(fromStop.styles['opacity']).toBe('0');
  });

  test('stop styles capture multiple properties', () => {
    const css = `@keyframes pop { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }`;
    const [entry] = parseKeyframes(css);
    const stop0 = entry.stops.find(s => s.key === '0%');
    expect(stop0.styles['opacity']).toBe('0');
    expect(stop0.styles['transform']).toBe('scale(0.8)');
  });

  test('detects multiple @keyframes rules', () => {
    const css = `
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUp { from { transform: translateY(20px); } to { transform: translateY(0); } }
    `;
    const result = parseKeyframes(css);
    expect(result).toHaveLength(2);
    const names = result.map(r => r.name);
    expect(names).toContain('fadeIn');
    expect(names).toContain('slideUp');
  });

  test('handles kebab-case animation names', () => {
    const css = `@keyframes fade-in-up { from { opacity: 0; } to { opacity: 1; } }`;
    const [entry] = parseKeyframes(css);
    expect(entry.name).toBe('fade-in-up');
  });

  test('handles camelCase animation names', () => {
    const css = `@keyframes bounceOut { 0% { opacity: 1; } 100% { opacity: 0; } }`;
    const [entry] = parseKeyframes(css);
    expect(entry.name).toBe('bounceOut');
  });
});
