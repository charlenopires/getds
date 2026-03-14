/**
 * Layer section generation — Spec: b0d5a227 — Markdown Report Generation
 *
 * Produces 7 H2 Markdown sections, one per extraction layer, in canonical order.
 * Each section uses a rich, human-readable renderer that produces tables,
 * structured content, and collapsible JSON blocks.
 *
 * Custom renderers can still be passed via the `renderers` map to override
 * the defaults for specific layers.
 */

import { renderVisualFoundationsSection } from './renderVisualFoundationsSection.js';
import { renderTokensSectionEnhanced }    from './renderTokensSectionEnhanced.js';
import { renderComponentsSection }        from './renderComponentsSection.js';
import { renderLayoutSection }            from './renderLayoutSection.js';
import { renderAnimationsSection }        from './renderAnimationsSection.js';
import { renderIconographySection }       from './renderIconographySection.js';
import { renderAccessibilitySection }     from './renderAccessibilitySection.js';

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

/** Human-readable section titles with emoji indicators */
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
 * Default rich renderers — one per layer.
 * Each renderer accepts the layer data object and returns a Markdown string.
 */
const DEFAULT_RENDERERS = {
  'visual-foundations': renderVisualFoundationsSection,
  'tokens':             renderTokensSectionEnhanced,
  'components':         renderComponentsSection,
  'layout-patterns':    renderLayoutSection,
  'animations':         renderAnimationsSection,
  'iconography':        renderIconographySection,
  'accessibility':      renderAccessibilitySection,
};

/**
 * Fallback renderer for unknown layers — serializes data as a fenced JSON block.
 *
 * @param {object} data
 * @returns {string}
 */
function fallbackRenderer(data) {
  return `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
}

/**
 * Generate the 7 H2 layer sections of the design system Markdown report.
 *
 * @param {Record<string, object>} payload - Assembled 7-layer extraction payload
 * @param {Record<string, (data: object) => string>} [renderers={}] - Optional per-layer overrides
 * @returns {string}
 */
export function generateLayerSections(payload = {}, renderers = {}) {
  return LAYER_ORDER.map(layer => {
    const header = SECTION_HEADERS[layer];
    const data   = payload[layer] ?? {};
    const render = renderers[layer] ?? DEFAULT_RENDERERS[layer] ?? fallbackRenderer;

    let content;
    try {
      content = render(data);
    } catch (err) {
      // Graceful degradation: fall back to JSON if renderer throws
      console.error(`[getds] renderer failed for layer "${layer}":`, err);
      content = fallbackRenderer(data);
    }

    // Include layer ID as an HTML comment so tooling and tests can locate sections
    return `## ${header}\n\n<!-- layer: ${layer} -->\n\n${content}`;
  }).join('\n\n');
}
