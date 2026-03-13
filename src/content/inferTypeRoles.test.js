/**
 * Task: dc0e3935 — Map type styles to semantic roles by HTML tag and relative size
 * Spec: f7625baf — Typography System Extraction
 */

import { describe, test, expect } from 'bun:test';
import { inferTypeRoles } from './inferTypeRoles.js';

/** Build a type style entry as extractTypeStyles() produces */
function style(tag, fontSize, fontWeight = '400') {
  return { tag, fontSize, fontWeight, lineHeight: '1.5', letterSpacing: '0px', textTransform: 'none' };
}

/** Build a scale step as extractTypeScale() produces */
function scaleStep(value, px, step) {
  return { value, px, step, remValue: null };
}

describe('inferTypeRoles — assign semantic role to each type style', () => {
  test('returns an array of role assignments', () => {
    const result = inferTypeRoles([], []);
    expect(Array.isArray(result)).toBe(true);
  });

  test('each entry has style and role fields', () => {
    const styles = [style('p', '16px')];
    const scale  = [scaleStep('16px', 16, 1)];
    const result = inferTypeRoles(styles, scale);
    expect(result[0]).toHaveProperty('style');
    expect(result[0]).toHaveProperty('role');
  });

  test('h1 element gets role "heading-1"', () => {
    const styles = [style('h1', '32px', '700')];
    const scale  = [scaleStep('32px', 32, 1)];
    const result = inferTypeRoles(styles, scale);
    expect(result[0].role).toBe('heading-1');
  });

  test('h2 gets "heading-2"', () => {
    const result = inferTypeRoles([style('h2', '28px')], [scaleStep('28px', 28, 1)]);
    expect(result[0].role).toBe('heading-2');
  });

  test('h3 gets "heading-3"', () => {
    const result = inferTypeRoles([style('h3', '24px')], [scaleStep('24px', 24, 1)]);
    expect(result[0].role).toBe('heading-3');
  });

  test('h4 gets "heading-4"', () => {
    const result = inferTypeRoles([style('h4', '20px')], [scaleStep('20px', 20, 1)]);
    expect(result[0].role).toBe('heading-4');
  });

  test('h5 gets "heading-5"', () => {
    const result = inferTypeRoles([style('h5', '18px')], [scaleStep('18px', 18, 1)]);
    expect(result[0].role).toBe('heading-5');
  });

  test('h6 gets "heading-6"', () => {
    const result = inferTypeRoles([style('h6', '16px')], [scaleStep('16px', 16, 1)]);
    expect(result[0].role).toBe('heading-6');
  });

  test('p element at mid-scale size gets role "body"', () => {
    const styles = [style('p', '16px')];
    const scale  = [
      scaleStep('12px', 12, 1),
      scaleStep('16px', 16, 2),
      scaleStep('24px', 24, 3),
    ];
    const result = inferTypeRoles(styles, scale);
    expect(result[0].role).toBe('body');
  });

  test('largest non-heading style gets role "display" when larger than h1', () => {
    const styles = [
      style('div', '64px', '900'), // display hero
      style('h1',  '32px', '700'),
    ];
    const scale = [
      scaleStep('32px', 32, 1),
      scaleStep('64px', 64, 2),
    ];
    const result = inferTypeRoles(styles, scale);
    const display = result.find(r => r.style.fontSize === '64px');
    expect(display.role).toBe('display');
  });

  test('smallest size gets role "caption" when well below body', () => {
    const styles = [
      style('p',    '16px'),
      style('span', '11px'), // very small
    ];
    const scale = [
      scaleStep('11px', 11, 1),
      scaleStep('16px', 16, 2),
    ];
    const result = inferTypeRoles(styles, scale);
    const caption = result.find(r => r.style.fontSize === '11px');
    expect(caption.role).toBe('caption');
  });

  test('uppercase small text gets role "overline"', () => {
    const styles = [{
      tag: 'span', fontSize: '11px', fontWeight: '600',
      lineHeight: '1.5', letterSpacing: '2px', textTransform: 'uppercase',
    }];
    const scale = [scaleStep('11px', 11, 1)];
    const result = inferTypeRoles(styles, scale);
    expect(result[0].role).toBe('overline');
  });

  test('returns one role entry per input style', () => {
    const styles = [style('p', '16px'), style('h1', '32px')];
    const scale  = [scaleStep('16px', 16, 1), scaleStep('32px', 32, 2)];
    const result = inferTypeRoles(styles, scale);
    expect(result).toHaveLength(2);
  });

  test('returns empty array for empty input', () => {
    expect(inferTypeRoles([], [])).toHaveLength(0);
  });

  test('body-large role for size just above body baseline', () => {
    const styles = [
      style('p',    '16px'),
      style('span', '18px'),
    ];
    const scale = [
      scaleStep('16px', 16, 1),
      scaleStep('18px', 18, 2),
    ];
    const result = inferTypeRoles(styles, scale);
    const bodyLarge = result.find(r => r.style.fontSize === '18px');
    expect(bodyLarge.role).toBe('body-large');
  });

  test('body-small role for size just below body baseline', () => {
    const styles = [
      style('p',    '16px'),
      style('small', '14px'),
    ];
    const scale = [
      scaleStep('14px', 14, 1),
      scaleStep('16px', 16, 2),
    ];
    const result = inferTypeRoles(styles, scale);
    const bodySmall = result.find(r => r.style.fontSize === '14px');
    expect(bodySmall.role).toBe('body-small');
  });
});
