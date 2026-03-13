/**
 * Task: 51d6d54c — Generate optional Mermaid diagram of the page component hierarchy
 * Spec: 446634bf — Layout Pattern Detection
 */

import { describe, test, expect } from 'bun:test';
import { treeToMermaid } from './generateMermaidDiagram.js';

// ── Tree fixture (matches extractLandmarkTree TreeNode shape) ─────────────────

const simpleTree = [
  {
    tag: 'body',
    role: null,
    label: null,
    children: [
      {
        tag: 'header',
        role: null,
        label: null,
        children: [
          { tag: 'nav', role: null, label: 'Main nav', children: [] },
        ],
      },
      {
        tag: 'main',
        role: null,
        label: null,
        children: [
          { tag: 'section', role: null, label: 'Hero', children: [] },
          { tag: 'aside',   role: null, label: null,   children: [] },
        ],
      },
      {
        tag: 'footer',
        role: null,
        label: null,
        children: [],
      },
    ],
  },
];

const singleNodeTree = [
  { tag: 'main', role: null, label: null, children: [] },
];

describe('treeToMermaid — Mermaid diagram generation from landmark tree', () => {
  test('returns a string', () => {
    expect(typeof treeToMermaid(simpleTree)).toBe('string');
  });

  test('returns empty string for empty tree (optional diagram)', () => {
    expect(treeToMermaid([])).toBe('');
  });

  test('returns empty string for null/undefined input', () => {
    expect(treeToMermaid(null)).toBe('');
    expect(treeToMermaid(undefined)).toBe('');
  });

  test('output starts with fenced mermaid code block', () => {
    const result = treeToMermaid(simpleTree);
    expect(result.startsWith('```mermaid')).toBe(true);
  });

  test('output ends with closing fence', () => {
    const result = treeToMermaid(simpleTree);
    expect(result.trimEnd().endsWith('```')).toBe(true);
  });

  test('contains graph TD declaration', () => {
    expect(treeToMermaid(simpleTree)).toContain('graph TD');
  });

  test('all landmark tags appear as node labels', () => {
    const result = treeToMermaid(simpleTree);
    expect(result).toContain('body');
    expect(result).toContain('header');
    expect(result).toContain('nav');
    expect(result).toContain('main');
    expect(result).toContain('section');
    expect(result).toContain('aside');
    expect(result).toContain('footer');
  });

  test('node labels include aria-label/title when present', () => {
    const result = treeToMermaid(simpleTree);
    expect(result).toContain('Main nav');
    expect(result).toContain('Hero');
  });

  test('parent-child edges are represented with -->', () => {
    const result = treeToMermaid(simpleTree);
    expect(result).toMatch(/\w+ --> \w+/);
  });

  test('contains correct number of edges (6 for the fixture)', () => {
    const result = treeToMermaid(simpleTree);
    const edges = result.match(/ --> /g);
    // body→header, header→nav, body→main, main→section, main→aside, body→footer = 6
    expect(edges).not.toBeNull();
    expect(edges.length).toBe(6);
  });

  test('works for a single node tree with no children', () => {
    const result = treeToMermaid(singleNodeTree);
    expect(result).toContain('graph TD');
    expect(result).toContain('main');
    // No edges expected
    expect(result).not.toMatch(/ --> /);
  });

  test('node IDs are unique across the diagram', () => {
    const result = treeToMermaid(simpleTree);
    // Extract all node ID definitions (e.g. n0["body"])
    const ids = [...result.matchAll(/\b(n\d+)\[/g)].map(m => m[1]);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  });

  test('node labels with special characters are safely quoted', () => {
    const treeWithSpecial = [
      { tag: 'section', role: null, label: 'FAQ & Help "center"', children: [] },
    ];
    expect(() => treeToMermaid(treeWithSpecial)).not.toThrow();
    const result = treeToMermaid(treeWithSpecial);
    expect(result).toContain('section');
  });
});
