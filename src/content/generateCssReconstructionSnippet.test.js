import { describe, test, expect } from 'bun:test';
import { generateCssReconstructionSnippet } from './generateCssReconstructionSnippet.js';

describe('generateCssReconstructionSnippet', () => {
  test('generates :root block with color tokens', () => {
    const payload = {
      tokens: {
        primitive: {
          'color-ff0000': { $value: '#ff0000', $type: 'color' },
        },
      },
    };
    const css = generateCssReconstructionSnippet(payload);
    expect(css).toContain(':root {');
    expect(css).toContain('--color-ff0000: #ff0000;');
    expect(css).toContain('}');
  });

  test('includes spacing tokens', () => {
    const payload = {
      tokens: {
        spacing: {
          'spacing-1': { $value: '4px', $type: 'dimension' },
          'spacing-2': { $value: '8px', $type: 'dimension' },
        },
      },
    };
    const css = generateCssReconstructionSnippet(payload);
    expect(css).toContain('--spacing-1: 4px;');
    expect(css).toContain('--spacing-2: 8px;');
  });

  test('includes radius tokens', () => {
    const payload = {
      tokens: {
        radius: {
          'radius-sm': { $value: '4px', $type: 'dimension' },
        },
      },
    };
    const css = generateCssReconstructionSnippet(payload);
    expect(css).toContain('--radius-sm: 4px;');
  });

  test('includes border tokens', () => {
    const payload = {
      tokens: {
        border: {
          'border-1': { $value: { color: '#e5e7eb', width: '1px', style: 'solid' }, $type: 'border' },
        },
      },
    };
    const css = generateCssReconstructionSnippet(payload);
    expect(css).toContain('--border-1: 1px solid #e5e7eb;');
  });

  test('includes typography roles', () => {
    const payload = {
      'visual-foundations': {
        typographyRoles: {
          h1: { fontFamily: '"Inter", sans-serif', fontSize: '2.25rem', fontWeight: '700', lineHeight: '1.2' },
          body: { fontFamily: '"Inter", sans-serif', fontSize: '1rem', fontWeight: '400', lineHeight: '1.5' },
        },
      },
    };
    const css = generateCssReconstructionSnippet(payload);
    expect(css).toContain('h1 {');
    expect(css).toContain('font-size: 2.25rem;');
    expect(css).toContain('body {');
  });

  test('handles empty payload', () => {
    const css = generateCssReconstructionSnippet({});
    expect(css).toContain(':root {');
    expect(css).toContain('}');
  });

  test('includes site name in comment', () => {
    const css = generateCssReconstructionSnippet({ _siteName: 'Example.com' });
    expect(css).toContain('Design System: Example.com');
  });
});
