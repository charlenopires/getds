import { describe, it, expect } from 'bun:test';
import { extractGradients } from './extractGradients.js';

function mockCs(props) {
  return { getPropertyValue: (key) => props[key] ?? '' };
}

describe('extractGradients', () => {
  it('returns empty array for no gradients', () => {
    const styles = [mockCs({ 'background-image': 'none' })];
    const { gradients } = extractGradients(styles);
    expect(gradients).toEqual([]);
  });

  it('extracts linear-gradient', () => {
    const styles = [mockCs({ 'background-image': 'linear-gradient(to right, red, blue)' })];
    const { gradients } = extractGradients(styles);
    expect(gradients.length).toBe(1);
    expect(gradients[0].type).toBe('linear');
    expect(gradients[0].stops.length).toBeGreaterThan(0);
  });

  it('extracts radial-gradient', () => {
    const styles = [mockCs({ 'background-image': 'radial-gradient(circle, #fff, #000)' })];
    const { gradients } = extractGradients(styles);
    expect(gradients.length).toBe(1);
    expect(gradients[0].type).toBe('radial');
  });

  it('deduplicates identical gradients', () => {
    const val = 'linear-gradient(to right, red, blue)';
    const styles = [mockCs({ 'background-image': val }), mockCs({ 'background-image': val })];
    const { gradients } = extractGradients(styles);
    expect(gradients.length).toBe(1);
  });

  it('handles empty input', () => {
    const { gradients } = extractGradients([]);
    expect(gradients).toEqual([]);
  });

  it('skips non-gradient background-image', () => {
    const styles = [mockCs({ 'background-image': 'url(foo.png)' })];
    const { gradients } = extractGradients(styles);
    expect(gradients).toEqual([]);
  });
});
