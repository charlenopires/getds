/**
 * DTCG token section rendering — Spec: b0d5a227 — Markdown Report Generation
 *
 * Renders W3C DTCG design tokens as fenced JSON code blocks within a Markdown section.
 * Tokens are grouped by their $type so each type gets its own labelled block.
 */

/**
 * Human-readable labels for W3C DTCG $type values.
 */
const TYPE_LABELS = {
  color:       'Color',
  dimension:   'Dimension',
  typography:  'Typography',
  shadow:      'Shadow',
  gradient:    'Gradient',
  transition:  'Transition',
  animation:   'Animation',
  border:      'Border',
  duration:    'Duration',
  cubicBezier: 'Cubic Bézier',
  number:      'Number',
  fontFamily:  'Font Family',
  fontWeight:  'Font Weight',
  strokeStyle: 'Stroke Style',
  string:      'String',
};

/**
 * Render a single W3C DTCG token group as a labelled H3 + fenced JSON code block.
 *
 * @param {string} label - Section label (e.g. 'Color', 'Dimension')
 * @param {Record<string, { $value: unknown, $type: string }>} tokens
 * @returns {string}
 */
export function renderDtcgTokenBlock(label, tokens) {
  const json = JSON.stringify(tokens, null, 2);
  return `### ${label}\n\n\`\`\`json\n${json}\n\`\`\``;
}

/**
 * Render the tokens layer data as a Markdown section with one fenced JSON block per $type.
 *
 * If token entries lack a $type field they are grouped under 'Other'.
 * Non-token (non-object) entries are silently skipped.
 *
 * @param {Record<string, unknown>} data - Tokens layer payload (flat DTCG token map)
 * @returns {string}
 */
export function renderTokensSection(data = {}) {
  // Group token entries by $type
  const groups = {};

  for (const [name, token] of Object.entries(data)) {
    if (!token || typeof token !== 'object') continue;

    const type   = token.$type ?? 'other';
    const label  = TYPE_LABELS[type] ?? (type.charAt(0).toUpperCase() + type.slice(1));

    if (!groups[label]) groups[label] = {};
    groups[label][name] = token;
  }

  if (Object.keys(groups).length === 0) {
    return renderDtcgTokenBlock('Tokens', {});
  }

  return Object.entries(groups)
    .map(([label, tokens]) => renderDtcgTokenBlock(label, tokens))
    .join('\n\n');
}
