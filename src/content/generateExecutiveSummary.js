/**
 * Executive summary generation — Spec: b0d5a227 — Markdown Report Generation
 *
 * Produces a rich Markdown executive summary section with extraction counts,
 * quality indicators, and a design system health overview.
 */

/**
 * Count animations from the animations layer.
 * Prefers explicit cssAnimations + keyframes arrays; falls back to object key count.
 *
 * @param {object} anim
 * @returns {number}
 */
function countAnimations(anim) {
  if (!anim || typeof anim !== 'object') return 0;
  // Support both 'animations' (new) and 'cssAnimations' (legacy key)
  const css = Array.isArray(anim.animations)    ? anim.animations.length    :
              Array.isArray(anim.cssAnimations)  ? anim.cssAnimations.length : 0;
  const kf  = Array.isArray(anim.keyframes)     ? anim.keyframes.length     : 0;
  const tr  = Array.isArray(anim.transitions)   ? anim.transitions.length   : 0;
  return css + kf + tr;
}

/**
 * Count design tokens from the tokens layer.
 *
 * @param {object} tokens
 * @returns {{ primitive: number, typography: number, spacing: number, radius: number, total: number }}
 */
function countTokens(tokens) {
  if (!tokens || typeof tokens !== 'object') {
    return { primitive: 0, typography: 0, spacing: 0, radius: 0, fontFamily: 0, lineHeight: 0, border: 0, total: 0 };
  }
  const primitive  = typeof tokens.primitive   === 'object' ? Object.keys(tokens.primitive   ?? {}).length : 0;
  const typography = typeof tokens.typography  === 'object' ? Object.keys(tokens.typography  ?? {}).length : 0;
  const spacing    = typeof tokens.spacing     === 'object' ? Object.keys(tokens.spacing     ?? {}).length : 0;
  const radius     = typeof tokens.radius      === 'object' ? Object.keys(tokens.radius      ?? {}).length : 0;
  const fontFamily = typeof tokens.fontFamily  === 'object' ? Object.keys(tokens.fontFamily  ?? {}).length : 0;
  const lineHeight = typeof tokens.lineHeight  === 'object' ? Object.keys(tokens.lineHeight  ?? {}).length : 0;
  const border     = typeof tokens.border      === 'object' ? Object.keys(tokens.border      ?? {}).length : 0;
  return { primitive, typography, spacing, radius, fontFamily, lineHeight, border, total: primitive + typography + spacing + radius + fontFamily + lineHeight + border };
}

/**
 * Assess accessibility grade from score.
 *
 * @param {number} score
 * @returns {string}
 */
function a11yGrade(score) {
  if (score >= 95) return 'A+ 🟢';
  if (score >= 85) return 'A 🟢';
  if (score >= 70) return 'B 🟡';
  if (score >= 50) return 'C 🟠';
  return 'D 🔴';
}

/**
 * Generate a rich Markdown executive summary section from the extraction payload.
 *
 * @param {Record<string, object>} payload - Assembled 7-layer extraction payload
 * @returns {string} Markdown string starting with an H2 section header
 */
export function generateExecutiveSummary(payload = {}) {
  const vf    = payload['visual-foundations'] ?? {};
  const tok   = payload['tokens']             ?? {};
  const comp  = payload['components']         ?? {};
  const lp    = payload['layout-patterns']    ?? {};
  const anim  = payload['animations']         ?? {};
  const icons = payload['iconography']        ?? {};
  const a11y  = payload['accessibility']      ?? {};

  // Visual Foundations
  const colours    = Array.isArray(vf.colors)      ? vf.colors.length      : 0;
  const fonts      = Array.isArray(vf.fonts)        ? vf.fonts.length       : 0;
  // Type scale: check visual-foundations.typeScale (new) and layout-patterns.typeScale.steps (legacy)
  const typeSteps  = Array.isArray(vf.typeScale)    ? vf.typeScale.length   :
                     Array.isArray(lp.typeScale?.steps) ? lp.typeScale.steps.length : 0;
  // Spacing: check visual-foundations.spacing (new) and layout-patterns.spacingGrid.scale (legacy)
  const spacSteps  = Array.isArray(vf.spacing)      ? vf.spacing.length     :
                     Array.isArray(lp.spacingGrid?.scale) ? lp.spacingGrid.scale.length : 0;
  const shadows    = Array.isArray(vf.boxShadows)   ? vf.boxShadows.length  : 0;
  const radii      = Array.isArray(vf.borderRadii)  ? vf.borderRadii.length : 0;
  const cssVars    = vf.cssVariables ? Object.keys(vf.cssVariables).length : 0;

  // Tokens
  const tokenCounts = countTokens(tok);

  // Components
  const btnCount  = Array.isArray(comp.buttons)    ? comp.buttons.length    : 0;
  const inpCount  = Array.isArray(comp.inputs)     ? comp.inputs.length     : 0;
  const navCount  = Array.isArray(comp.navigation) ? comp.navigation.length : 0;
  const cardCount = Array.isArray(comp.cards)       ? comp.cards.length      : 0;
  const modCount  = Array.isArray(comp.modals)      ? comp.modals.length     : 0;

  // Layout
  const breakpoints = Array.isArray(lp.breakpoints) ? lp.breakpoints.length : 0;
  const grids       = Array.isArray(lp.grid)         ? lp.grid.length        : 0;

  // Animations
  const animTotal = countAnimations(anim);

  // Iconography
  const svgCount  = Array.isArray(icons.inlineSvgs) ? icons.inlineSvgs.length : 0;

  // Accessibility
  const a11yScore  = typeof a11y.score === 'number' ? a11y.score : 0;
  const a11yIssues = Array.isArray(a11y.issues)     ? a11y.issues.length : 0;

  // New metrics
  const tableCount = Array.isArray(comp.tables) ? comp.tables.length : 0;
  const interactionStateCount = Array.isArray(comp.interactionStates) ? comp.interactionStates.length : 0;
  const contentSectionCount = Array.isArray(lp.contentSections) ? lp.contentSections.length : 0;
  const containerQueryCount = Array.isArray(lp.containerQueries) ? lp.containerQueries.length : 0;
  const hasDarkMode = (vf.colorSchemes?.dark?.length ?? 0) > 0 ? 'Yes' : 'No';
  const gradientCount = Array.isArray(vf.gradients) ? vf.gradients.length : 0;
  const contrastViolationCount = Array.isArray(a11y.contrastViolations) ? a11y.contrastViolations.length : 0;

  // Deep design system metrics
  const fluidTypoCount = Array.isArray(vf.fluidTypography) ? vf.fluidTypography.length : 0;
  const fluidSpacingCount = Array.isArray(vf.fluidSpacing) ? vf.fluidSpacing.length : 0;
  const fluidExprCount = fluidTypoCount + fluidSpacingCount;
  const customEasingCount = anim.easingClassifications?.summary?.custom ?? 0;
  const fontPairingType = vf.fontPairings?.pairingType ?? 'unknown';
  const gridSystemType = lp.gridClassifications?.dominantPattern ?? lp.columnSystem?.detectedSystem ?? 'none';
  const spacingFormula = lp.spacingScaleAnalysis?.formula ?? 'none detected';

  // --- Build table rows ---
  const foundationsRows = [
    ['🎨 Unique colours',          colours],
    ['📝 CSS custom properties',   cssVars],
    ['🔤 Font families',           fonts],
    ['📏 Type scale steps',        typeSteps],
    ['📐 Spacing values',          spacSteps],
    ['🌑 Shadow levels',           shadows],
    ['🔘 Border-radius values',    radii],
  ];

  const tokenRows = [
    ['🔵 Primitive tokens',        tokenCounts.primitive],
    ['🟢 Typography tokens',       tokenCounts.typography],
    ['🟡 Spacing tokens',          tokenCounts.spacing],
    ['🔴 Border-radius tokens',    tokenCounts.radius],
    ['🔵 Font family tokens',      tokenCounts.fontFamily],
    ['📏 Line height tokens',      tokenCounts.lineHeight],
    ['🔲 Border tokens',           tokenCounts.border],
    ['📦 Total tokens',            tokenCounts.total],
  ];

  const componentRows = [
    ['🔘 Buttons',                 btnCount],
    ['📝 Form inputs',             inpCount],
    ['🗺️ Navigation landmarks',   navCount],
    ['🃏 Card groups',             cardCount],
    ['🪟 Modal patterns',          modCount],
    ['📊 Tables',                  tableCount],
    ['🔄 Interaction state rules', interactionStateCount],
  ];

  // Framework detection
  const detectedFramework = tok.framework?.frameworks?.[0]?.name ?? 'None detected';
  // Color dedup stats
  const rawColorCount = tok._meta?.rawColorCount ?? '?';
  const dedupedColorCount = tok._meta?.dedupedColorCount ?? '?';

  const systemRows = [
    ['📱 Breakpoints',             breakpoints],
    ['🔲 Grid containers',         grids],
    ['🎬 Animations & transitions',animTotal],
    ['🗂️ Inline SVGs',            svgCount],
    ['🏗️ CSS Framework',          detectedFramework],
    ['🎨 Color dedup',             `${rawColorCount} raw → ${dedupedColorCount} unique`],
    ['📄 Content sections',        contentSectionCount],
    ['📦 Container queries',       containerQueryCount],
    ['🌓 Dark mode support',       hasDarkMode],
    ['🌈 Gradients',               gradientCount],
    ['⚠️ Contrast violations',     contrastViolationCount],
    ['🔄 Fluid expressions',       fluidExprCount > 0 ? `${fluidExprCount} (typo: ${fluidTypoCount}, spacing: ${fluidSpacingCount})` : '0'],
    ['🎛️ Custom easing curves',   customEasingCount],
    ['🔤 Font pairing type',       fontPairingType],
    ['📐 Grid system type',        gridSystemType],
    ['📏 Spacing formula',         spacingFormula],
    ['♿ Accessibility score',      `${a11yScore}/100 (${a11yGrade(a11yScore)})`],
    ['❗ Accessibility issues',    a11yIssues],
  ];

  function buildTable(rows) {
    return [
      '| Metric | Value |',
      '|--------|-------|',
      ...rows.map(([label, value]) => `| ${label} | ${value} |`),
    ].join('\n');
  }

  return [
    '## 📊 Executive Summary',
    '### Visual Foundations\n\n' + buildTable(foundationsRows),
    '### Design Tokens\n\n' + buildTable(tokenRows),
    '### Components\n\n' + buildTable(componentRows),
    '### System Overview\n\n' + buildTable(systemRows),
  ].join('\n\n');
}
