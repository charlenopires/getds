/**
 * Report assembly — Spec: b0d5a227 — Markdown Report Generation
 *
 * Top-level integration function that assembles a complete, valid Markdown
 * design system report from the 7-layer extraction payload and metadata.
 *
 * Document order:
 *   1. YAML frontmatter
 *   2. H1 title
 *   3. 📊 Executive Summary
 *   4. 🎨 Visual Foundations … ♿ Accessibility (7 H2 sections)
 *   5. ⚠️ Limitations
 */

import { generateFrontmatter }      from './generateFrontmatter.js';
import { generateExecutiveSummary } from './generateExecutiveSummary.js';
import { generateLayerSections }    from './generateLayerSections.js';
import { generateLimitationsSection } from './generateLimitationsSection.js';
import { enforceOutputLimit }       from './enforceOutputLimit.js';

/**
 * Assemble the complete Markdown report.
 *
 * @param {Record<string, object>} payload   - Assembled 7-layer extraction payload
 * @param {{ url: string, title: string, extractedAt: string, dsx_version: string, duration: number }} meta
 * @param {{ limitations?: string[], renderers?: Record<string, (data: object) => string> }} [options={}]
 * @returns {string} Valid Markdown document, enforced to ≤ 5 MiB
 */
export function assembleReport(payload = {}, meta, options = {}) {
  const { limitations = [], renderers = {} } = options;

  const frontmatter = generateFrontmatter(meta);
  const h1          = `# Design System Extract — ${meta?.title ?? 'Untitled'}`;
  const summary     = generateExecutiveSummary(payload);
  const sections    = generateLayerSections(payload, renderers);
  const limitsSection = generateLimitationsSection(limitations);

  const document = [frontmatter, h1, summary, sections, limitsSection].join('\n\n');

  return enforceOutputLimit(document);
}
