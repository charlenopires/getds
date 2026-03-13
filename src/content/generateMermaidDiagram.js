/**
 * Mermaid diagram generation — Spec: 446634bf — Layout Pattern Detection
 *
 * Serialises a hierarchical landmark tree (from extractLandmarkTree) as a
 * valid Mermaid `graph TD` flowchart wrapped in a fenced code block.
 *
 * The diagram is optional — an empty tree returns an empty string.
 */

/**
 * Sanitise a label string for safe use inside Mermaid double-quoted node labels.
 * Replaces characters that break Mermaid parsing.
 *
 * @param {string} text
 * @returns {string}
 */
function sanitiseLabel(text) {
  return text
    .replace(/"/g,  '#quot;')
    .replace(/</g,  '#lt;')
    .replace(/>/g,  '#gt;')
    .replace(/&/g,  '&amp;');
}

/**
 * Walk the tree depth-first, collecting node definitions and edges.
 *
 * @param {{ tag: string, role: string|null, label: string|null, children: object[] }} node
 * @param {string|null} parentId
 * @param {{ counter: number }} state
 * @param {string[]} nodeDefs  - accumulates node definition lines
 * @param {string[]} edges     - accumulates edge lines
 */
function walkNode(node, parentId, state, nodeDefs, edges) {
  const id    = `n${state.counter++}`;
  const parts = [node.tag];
  if (node.role)  parts.push(`role=${node.role}`);
  if (node.label) parts.push(node.label);
  const labelText = sanitiseLabel(parts.join(' · '));

  nodeDefs.push(`  ${id}["${labelText}"]`);

  if (parentId !== null) {
    edges.push(`  ${parentId} --> ${id}`);
  }

  for (const child of (node.children ?? [])) {
    walkNode(child, id, state, nodeDefs, edges);
  }
}

/**
 * Convert a `TreeNode[]` landmark tree into a fenced Mermaid `graph TD` block.
 *
 * Returns an empty string when the tree is empty (diagram is optional).
 *
 * @param {Array<{ tag: string, role: string|null, label: string|null, children: object[] }>|null|undefined} tree
 * @returns {string}
 */
export function treeToMermaid(tree) {
  if (!tree || tree.length === 0) return '';

  const nodeDefs = [];
  const edges    = [];
  const state    = { counter: 0 };

  for (const root of tree) {
    walkNode(root, null, state, nodeDefs, edges);
  }

  const body = ['graph TD', ...nodeDefs, ...edges].join('\n');
  return `\`\`\`mermaid\n${body}\n\`\`\``;
}
