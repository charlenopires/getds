/**
 * Task: 316f2058 — Generate Markdown tables for color, type scale, spacing, component, icon, and accessibility inventories
 * Spec: b0d5a227 — Markdown Report Generation
 */

import { describe, test, expect } from 'bun:test';
import {
  buildTable,
  renderColorTable,
  renderTypeScaleTable,
  renderSpacingTable,
  renderComponentTable,
  renderIconTable,
  renderAccessibilityTable,
} from './renderMarkdownTables.js';

// ── Shared helpers ────────────────────────────────────────────────────────────

function countRows(result) {
  // Rows = lines that start with | but are not the separator (contains ---)
  return result.split('\n').filter(l => l.startsWith('|') && !l.includes('---')).length - 1; // subtract header row
}

// ── buildTable ────────────────────────────────────────────────────────────────

describe('buildTable — generic Markdown GFM table builder', () => {
  test('returns a string', () => {
    expect(typeof buildTable(['A', 'B'], [['1', '2']])).toBe('string');
  });

  test('first line is the header row', () => {
    const result = buildTable(['Name', 'Value'], [['foo', 'bar']]);
    expect(result.split('\n')[0]).toContain('Name');
    expect(result.split('\n')[0]).toContain('Value');
  });

  test('second line is the separator', () => {
    const result = buildTable(['Name', 'Value'], [['foo', 'bar']]);
    expect(result.split('\n')[1]).toMatch(/^\|[-| ]+\|$/);
  });

  test('each row is a pipe-delimited line', () => {
    const result = buildTable(['A', 'B'], [['1', '2'], ['3', '4']]);
    const lines = result.split('\n');
    expect(lines[2]).toContain('1');
    expect(lines[3]).toContain('3');
  });

  test('escapes pipe characters in cell content', () => {
    const result = buildTable(['A'], [['has | pipe']]);
    expect(result).toContain('has \\| pipe');
  });

  test('handles zero data rows', () => {
    expect(() => buildTable(['A', 'B'], [])).not.toThrow();
  });
});

// ── renderColorTable ──────────────────────────────────────────────────────────

const topColors = [
  { raw: 'rgb(0,0,0)',   hex: '#000000', count: 42 },
  { raw: 'rgb(255,255,255)', hex: '#ffffff', count: 30 },
  { raw: '#0070f3',      hex: '#0070f3', count: 12 },
];

describe('renderColorTable — color inventory', () => {
  test('returns a string', () => {
    expect(typeof renderColorTable(topColors)).toBe('string');
  });

  test('has Color, Hex, and Count columns', () => {
    const result = renderColorTable(topColors);
    expect(result).toContain('Color');
    expect(result).toContain('Hex');
    expect(result).toContain('Count');
  });

  test('contains one data row per color', () => {
    expect(countRows(renderColorTable(topColors))).toBe(3);
  });

  test('includes hex values', () => {
    const result = renderColorTable(topColors);
    expect(result).toContain('#000000');
    expect(result).toContain('#ffffff');
  });

  test('includes counts', () => {
    const result = renderColorTable(topColors);
    expect(result).toContain('42');
    expect(result).toContain('30');
  });

  test('handles empty array', () => {
    expect(() => renderColorTable([])).not.toThrow();
  });
});

// ── renderTypeScaleTable ──────────────────────────────────────────────────────

const typeScale = [
  { step: 1, value: '12px', px: 12, remValue: 0.75 },
  { step: 2, value: '14px', px: 14, remValue: 0.875 },
  { step: 3, value: '16px', px: 16, remValue: 1 },
  { step: 4, value: '20px', px: 20, remValue: 1.25 },
];

describe('renderTypeScaleTable — type scale inventory', () => {
  test('returns a string', () => {
    expect(typeof renderTypeScaleTable(typeScale)).toBe('string');
  });

  test('has Step, Size, and px columns', () => {
    const result = renderTypeScaleTable(typeScale);
    expect(result).toContain('Step');
    expect(result.toLowerCase()).toContain('size');
    expect(result).toContain('px');
  });

  test('contains one data row per step', () => {
    expect(countRows(renderTypeScaleTable(typeScale))).toBe(4);
  });

  test('includes size values', () => {
    const result = renderTypeScaleTable(typeScale);
    expect(result).toContain('12px');
    expect(result).toContain('20px');
  });

  test('handles empty array', () => {
    expect(() => renderTypeScaleTable([])).not.toThrow();
  });
});

// ── renderSpacingTable ────────────────────────────────────────────────────────

const spacingScale = [
  { step: 1, px: 4,  value: '4px',  multiplier: 0.5 },
  { step: 2, px: 8,  value: '8px',  multiplier: 1 },
  { step: 3, px: 16, value: '16px', multiplier: 2 },
];

describe('renderSpacingTable — spacing scale inventory', () => {
  test('returns a string', () => {
    expect(typeof renderSpacingTable(spacingScale)).toBe('string');
  });

  test('has Step, Value, and px columns', () => {
    const result = renderSpacingTable(spacingScale);
    expect(result).toContain('Step');
    expect(result).toContain('Value');
    expect(result).toContain('px');
  });

  test('contains one data row per step', () => {
    expect(countRows(renderSpacingTable(spacingScale))).toBe(3);
  });

  test('includes spacing values', () => {
    const result = renderSpacingTable(spacingScale);
    expect(result).toContain('8px');
    expect(result).toContain('16px');
  });

  test('handles empty array', () => {
    expect(() => renderSpacingTable([])).not.toThrow();
  });
});

// ── renderComponentTable ──────────────────────────────────────────────────────

const components = [
  { componentName: 'button',  instanceCount: 12, variantCount: 3, cssClasses: ['btn', 'btn-primary'] },
  { componentName: 'input',   instanceCount: 8,  variantCount: 2, cssClasses: ['form-control'] },
  { componentName: 'card',    instanceCount: 5,  variantCount: 1, cssClasses: [] },
];

describe('renderComponentTable — component inventory', () => {
  test('returns a string', () => {
    expect(typeof renderComponentTable(components)).toBe('string');
  });

  test('has Component, Instances, and Variants columns', () => {
    const result = renderComponentTable(components);
    expect(result.toLowerCase()).toContain('component');
    expect(result.toLowerCase()).toContain('instance');
    expect(result.toLowerCase()).toContain('variant');
  });

  test('contains one data row per component type', () => {
    expect(countRows(renderComponentTable(components))).toBe(3);
  });

  test('includes component names', () => {
    const result = renderComponentTable(components);
    expect(result).toContain('button');
    expect(result).toContain('card');
  });

  test('includes instance counts', () => {
    const result = renderComponentTable(components);
    expect(result).toContain('12');
    expect(result).toContain('8');
  });

  test('handles empty array', () => {
    expect(() => renderComponentTable([])).not.toThrow();
  });
});

// ── renderIconTable ───────────────────────────────────────────────────────────

const iconFonts = [
  { primary: 'FontAwesome', stack: '"Font Awesome 6", sans-serif', isIconFont: true },
  { primary: 'Material Icons', stack: '"Material Icons", sans-serif', isIconFont: true },
];

describe('renderIconTable — icon inventory', () => {
  test('returns a string', () => {
    expect(typeof renderIconTable(iconFonts)).toBe('string');
  });

  test('has Icon Font and Stack columns', () => {
    const result = renderIconTable(iconFonts);
    expect(result.toLowerCase()).toContain('icon');
    expect(result.toLowerCase()).toContain('stack');
  });

  test('contains one data row per icon font', () => {
    expect(countRows(renderIconTable(iconFonts))).toBe(2);
  });

  test('includes font names', () => {
    const result = renderIconTable(iconFonts);
    expect(result).toContain('FontAwesome');
    expect(result).toContain('Material Icons');
  });

  test('handles empty array', () => {
    expect(() => renderIconTable([])).not.toThrow();
  });
});

// ── renderAccessibilityTable ──────────────────────────────────────────────────

const a11yIssues = [
  { type: 'missing-alt',   severity: 'critical', element: 'img.hero',   message: 'Image missing alt text',     suggestion: 'Add alt attribute' },
  { type: 'missing-label', severity: 'warning',  element: 'input#email', message: 'Input has no label',        suggestion: 'Associate a <label>' },
  { type: 'contrast',      severity: 'warning',  element: 'p.subtitle',  message: 'Low contrast ratio (2.5:1)', suggestion: 'Increase contrast to 4.5:1' },
];

describe('renderAccessibilityTable — accessibility findings', () => {
  test('returns a string', () => {
    expect(typeof renderAccessibilityTable(a11yIssues)).toBe('string');
  });

  test('has Severity, Type, Element, and Issue columns', () => {
    const result = renderAccessibilityTable(a11yIssues);
    expect(result.toLowerCase()).toContain('severity');
    expect(result.toLowerCase()).toContain('type');
    expect(result.toLowerCase()).toContain('element');
    expect(result.toLowerCase()).toContain('issue');
  });

  test('contains one data row per issue', () => {
    expect(countRows(renderAccessibilityTable(a11yIssues))).toBe(3);
  });

  test('includes severity values', () => {
    const result = renderAccessibilityTable(a11yIssues);
    expect(result).toContain('critical');
    expect(result).toContain('warning');
  });

  test('includes issue types', () => {
    const result = renderAccessibilityTable(a11yIssues);
    expect(result).toContain('missing-alt');
    expect(result).toContain('contrast');
  });

  test('handles empty array', () => {
    expect(() => renderAccessibilityTable([])).not.toThrow();
  });
});
