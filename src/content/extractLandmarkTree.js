/**
 * Landmark tree extraction — Spec: 446634bf — Layout Pattern Detection
 *
 * Builds a hierarchical tree of ARIA landmark elements showing their DOM nesting.
 * The tree is useful for Mermaid diagram generation and structural analysis.
 */

/** Landmark tags to include in the tree */
const LANDMARK_TAGS = new Set(['header', 'nav', 'main', 'aside', 'footer', 'section', 'article', 'body']);

/** ARIA roles that map to landmark semantics */
const LANDMARK_ROLES = new Set(['banner', 'main', 'contentinfo', 'complementary', 'navigation', 'region']);

/**
 * A tree node representing one landmark element.
 *
 * @typedef {{ tag: string, role: string|null, label: string|null, children: TreeNode[] }} TreeNode
 */

/**
 * Build a nested tree structure from a flat list of nodes with parent references.
 *
 * Input nodes: `{ id, tag, role, label, parentId }`
 * Output: array of root TreeNodes with `children` arrays populated recursively.
 *
 * @param {Array<{ id: number, tag: string, role: string|null, label: string|null, parentId: number|null }>} nodes
 * @returns {TreeNode[]}
 */
export function buildLandmarkTree(nodes) {
  if (!nodes || nodes.length === 0) return [];

  // Build lookup map
  const nodeMap = new Map();
  for (const n of nodes) {
    nodeMap.set(n.id, { tag: n.tag, role: n.role ?? null, label: n.label ?? null, children: [] });
  }

  const roots = [];

  for (const n of nodes) {
    const treeNode = nodeMap.get(n.id);
    if (n.parentId == null || !nodeMap.has(n.parentId)) {
      roots.push(treeNode);
    } else {
      nodeMap.get(n.parentId).children.push(treeNode);
    }
  }

  return roots;
}

/**
 * Collect landmark elements from the DOM and build a flat node list with parent IDs.
 *
 * @param {Document} [doc=document]
 * @returns {Array<{ id: number, tag: string, role: string|null, label: string|null, parentId: number|null }>}
 */
function collectFlatNodes(doc = document) {
  const nodes = [];
  const elementToId = new Map();
  let nextId = 0;

  // Walk the entire DOM, recording landmark elements in source order
  const walker = doc.createTreeWalker(doc.body ?? doc.documentElement, NodeFilter.SHOW_ELEMENT);

  let el = walker.nextNode();
  while (el) {
    const tag  = el.tagName.toLowerCase();
    const role = el.getAttribute('role');
    const isLandmarkTag  = LANDMARK_TAGS.has(tag);
    const isLandmarkRole = role && LANDMARK_ROLES.has(role);

    if (isLandmarkTag || isLandmarkRole) {
      const id    = nextId++;
      const label = el.getAttribute('aria-label') ?? el.getAttribute('title') ?? null;
      elementToId.set(el, id);

      // Walk up to find closest landmark ancestor
      let parentId = null;
      let ancestor = el.parentElement;
      while (ancestor) {
        if (elementToId.has(ancestor)) {
          parentId = elementToId.get(ancestor);
          break;
        }
        ancestor = ancestor.parentElement;
      }

      nodes.push({ id, tag, role: role ?? null, label, parentId });
    }

    el = walker.nextNode();
  }

  return nodes;
}

/**
 * Extract the hierarchical landmark tree from the live DOM.
 *
 * @param {Document} [doc=document]
 * @returns {TreeNode[]}
 */
export function extractLandmarkTree(doc = document) {
  const flat = collectFlatNodes(doc);
  return buildLandmarkTree(flat);
}
