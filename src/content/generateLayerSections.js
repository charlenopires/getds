/**
 * Layer section generation — Spec: b0d5a227 — Markdown Report Generation
 *
 * Produces 7 H2 Markdown sections, one per extraction layer, in canonical order.
 * Each section header carries an emoji indicator per the spec.
 * An optional renderers map allows callers to supply layer-specific content generators.
  * 
 * @example
 * // Usage of generateLayerSections
*/

/** Canonical extraction layer order — matches content.js and background.js */
export const LAYER_ORDER = [
  'visual-foundations',
  'tokens',
  'components',
  'layout-patterns',
  'animations',
  'iconography',
  'accessibility',
];

/** Human-readable section titles with emoji indicators (spec: palette, typography, ruler, grid, layers, film, accessibility) */
const SECTION_HEADERS = {
  'visual-foundations': '🎨 Visual Foundations',
  'tokens':             '🔤 Design Tokens',
  'components':         '🧩 Components',
  'layout-patterns':    '📐 Layout Patterns',
  'animations':         '🎬 Animations',
  'iconography':        '🗂️ Iconography',
  'accessibility':      '♿ Accessibility',
};

/**
 * Default content renderer — serialises layer data as a fenced JSON block.
 *
 * @param {object} data
 * @returns {string}
 */
function defaultRenderer(data) {
  return `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
}

/**
 * Generate the 7 H2 layer sections of the design system Markdown report.
 *
 * @param {Record<string, object>} payload - Assembled 7-layer extraction payload
 * @param {Record<string, (data: object) => string>} [renderers={}] - Optional per-layer content generators
 * @returns {string}
 */
export function generateLayerSections(payload = {}, renderers = {}) {
  return LAYER_ORDER.map(layer => {
    const header  = SECTION_HEADERS[layer];
    const data    = payload[layer] ?? {};
    const render  = renderers[layer] ?? defaultRenderer;
    const content = render(data);
    return `## ${header}\n\n${content}`;
  }).join('\n\n');
}
