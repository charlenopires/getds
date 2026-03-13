/**
 * Task: 367a0e7f — Generate hierarchical page structure tree showing landmark elements and their nesting
 * Spec: 446634bf — Layout Pattern Detection
 */

import { describe, test, expect } from 'bun:test';
import { buildLandmarkTree } from './extractLandmarkTree.js';

// ── Flat node input format ────────────────────────────────────────────────────
// Each node: { id, tag, role, label, parentId }

const flatNodes = [
  { id: 0, tag: 'body',   role: null,          label: null,       parentId: null },
  { id: 1, tag: 'header', role: null,          label: null,       parentId: 0 },
  { id: 2, tag: 'nav',    role: null,          label: 'Main nav', parentId: 1 },
  { id: 3, tag: 'main',   role: null,          label: null,       parentId: 0 },
  { id: 4, tag: 'section',role: null,          label: 'Hero',     parentId: 3 },
  { id: 5, tag: 'aside',  role: null,          label: null,       parentId: 3 },
  { id: 6, tag: 'footer', role: null,          label: null,       parentId: 0 },
  { id: 7, tag: 'nav',    role: 'navigation',  label: 'Footer nav', parentId: 6 },
];

describe('buildLandmarkTree — build nested tree from flat node list', () => {
  test('returns an array', () => {
    expect(Array.isArray(buildLandmarkTree(flatNodes))).toBe(true);
  });

  test('roots are nodes with no parent', () => {
    const tree = buildLandmarkTree(flatNodes);
    // body is the only root (parentId: null)
    expect(tree).toHaveLength(1);
    expect(tree[0].tag).toBe('body');
  });

  test('each node has tag, role, label, and children fields', () => {
    const tree = buildLandmarkTree(flatNodes);
    const node = tree[0];
    expect(node).toHaveProperty('tag');
    expect(node).toHaveProperty('role');
    expect(node).toHaveProperty('label');
    expect(node).toHaveProperty('children');
  });

  test('children are properly nested', () => {
    const tree = buildLandmarkTree(flatNodes);
    const body = tree[0];
    // body → header, main, footer
    expect(body.children).toHaveLength(3);
    const tags = body.children.map(c => c.tag);
    expect(tags).toContain('header');
    expect(tags).toContain('main');
    expect(tags).toContain('footer');
  });

  test('header contains nav as a child', () => {
    const tree = buildLandmarkTree(flatNodes);
    const header = tree[0].children.find(c => c.tag === 'header');
    expect(header).toBeDefined();
    expect(header.children).toHaveLength(1);
    expect(header.children[0].tag).toBe('nav');
    expect(header.children[0].label).toBe('Main nav');
  });

  test('main contains section and aside as children', () => {
    const tree = buildLandmarkTree(flatNodes);
    const main = tree[0].children.find(c => c.tag === 'main');
    expect(main.children).toHaveLength(2);
    const childTags = main.children.map(c => c.tag);
    expect(childTags).toContain('section');
    expect(childTags).toContain('aside');
  });

  test('footer nav has correct label', () => {
    const tree = buildLandmarkTree(flatNodes);
    const footer = tree[0].children.find(c => c.tag === 'footer');
    const footerNav = footer.children.find(c => c.tag === 'nav');
    expect(footerNav?.label).toBe('Footer nav');
  });

  test('role is preserved on nodes', () => {
    const tree = buildLandmarkTree(flatNodes);
    const footer = tree[0].children.find(c => c.tag === 'footer');
    const footerNav = footer.children.find(c => c.tag === 'nav');
    expect(footerNav?.role).toBe('navigation');
  });

  test('handles empty input', () => {
    expect(buildLandmarkTree([])).toEqual([]);
  });

  test('handles single root node with no children', () => {
    const nodes = [{ id: 0, tag: 'main', role: null, label: null, parentId: null }];
    const tree = buildLandmarkTree(nodes);
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toEqual([]);
  });

  test('handles multiple roots (no common ancestor)', () => {
    const nodes = [
      { id: 0, tag: 'header', role: null, label: null, parentId: null },
      { id: 1, tag: 'main',   role: null, label: null, parentId: null },
      { id: 2, tag: 'footer', role: null, label: null, parentId: null },
    ];
    const tree = buildLandmarkTree(nodes);
    expect(tree).toHaveLength(3);
  });

  test('children arrays are empty arrays, not undefined', () => {
    const nodes = [{ id: 0, tag: 'main', role: null, label: null, parentId: null }];
    const tree = buildLandmarkTree(nodes);
    expect(tree[0].children).toEqual([]);
  });
});
