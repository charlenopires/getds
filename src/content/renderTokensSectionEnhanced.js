/**
 * Design Tokens section renderer — Layer 2 (enhanced)
 *
 * Renders W3C DTCG tokens as human-readable tables + fenced JSON,
 * organized by the 3-layer token architecture:
 *   Primitive → Semantic/Alias → Component
 */

// ---------------------------------------------------------------------------
// Color token table
// ---------------------------------------------------------------------------

function renderColorTokenTable(tokens) {
  const entries = Object.entries(tokens);
  if (entries.length === 0) return '';

  // Check if any tokens have usage count extensions
  const hasUsage = entries.some(([, t]) => t.$extensions?.['com.getds.usageCount']);

  if (hasUsage) {
    const rows = entries.map(([name, token]) => {
      const value = token.$value ?? '—';
      const desc  = token.$description ?? '';
      const usage = token.$extensions?.['com.getds.usageCount'] ?? '';
      const authored = token.$extensions?.['com.getds.authored'] ?? '';
      return `| \`${name}\` | \`${value}\` | ${usage} | \`${authored}\` | ${desc} |`;
    });

    return (
      '| Token | Value | Usage | Authored | Description |\n' +
      '|-------|-------|-------|----------|-------------|\n' +
      rows.join('\n')
    );
  }

  const rows = entries.map(([name, token]) => {
    const value = token.$value ?? '—';
    const desc  = token.$description ?? '';
    return `| \`${name}\` | \`${value}\` | ${desc} |`;
  });

  return (
    '| Token | Value | Description |\n' +
    '|-------|-------|-------------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Typography token table
// ---------------------------------------------------------------------------

function renderTypographyTokenTable(tokens) {
  const entries = Object.entries(tokens);
  if (entries.length === 0) return '';

  const rows = entries.map(([name, token]) => {
    const v = token.$value ?? {};
    const family   = v.fontFamily ?? '—';
    const size     = v.fontSize   ?? '—';
    const weight   = v.fontWeight ?? '—';
    const lh       = v.lineHeight ?? '—';
    const tracking = v.letterSpacing ?? '—';
    return `| \`${name}\` | ${family} | ${size} | ${weight} | ${lh} | ${tracking} |`;
  });

  return (
    '| Token | Family | Size | Weight | Line Height | Letter Spacing |\n' +
    '|-------|--------|------|--------|-------------|----------------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Dimension token table (spacing, radius, etc.)
// ---------------------------------------------------------------------------

function renderDimensionTokenTable(tokens) {
  const entries = Object.entries(tokens);
  if (entries.length === 0) return '';

  const rows = entries.map(([name, token]) => {
    const value = token.$value ?? '—';
    const desc  = token.$description ?? '';
    return `| \`${name}\` | \`${value}\` | ${desc} |`;
  });

  return (
    '| Token | Value | Description |\n' +
    '|-------|-------|-------------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Shadow token table
// ---------------------------------------------------------------------------

function renderShadowTokenTable(tokens) {
  const entries = Object.entries(tokens);
  if (entries.length === 0) return '';

  // Check if any tokens have structured shadow values
  const hasStructured = entries.some(([, t]) =>
    t.$value && typeof t.$value === 'object' && t.$value.offsetX !== undefined
  );

  if (hasStructured) {
    const rows = entries.map(([name, token]) => {
      const v = token.$value;
      if (v && typeof v === 'object' && v.offsetX !== undefined) {
        return `| \`${name}\` | ${v.offsetX?.value ?? 0}px | ${v.offsetY?.value ?? 0}px | ${v.blur?.value ?? 0}px | ${v.spread?.value ?? 0}px | \`${v.color ?? '#000'}\` | ${v.inset ? 'yes' : 'no'} |`;
      }
      const value = typeof v === 'string' ? v : JSON.stringify(v);
      return `| \`${name}\` | — | — | — | — | \`${value}\` | — |`;
    });

    return (
      '| Token | Offset X | Offset Y | Blur | Spread | Color | Inset |\n' +
      '|-------|----------|----------|------|--------|-------|-------|\n' +
      rows.join('\n')
    );
  }

  const rows = entries.map(([name, token]) => {
    const value = typeof token.$value === 'string'
      ? token.$value
      : JSON.stringify(token.$value);
    return `| \`${name}\` | \`${value}\` |`;
  });

  return (
    '| Token | Shadow Definition |\n' +
    '|-------|-------------------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Human-readable labels and table renderers by $type
// ---------------------------------------------------------------------------

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
  fontWeight:    'Font Weight',
  strokeStyle:   'Stroke Style',
  string:        'String',
  fontFace:      'Font Face',
  variableFont:  'Variable Font',
};

function renderFontFamilyTokenTable(tokens) {
  const entries = Object.entries(tokens);
  if (entries.length === 0) return '';

  const rows = entries.map(([name, token]) => {
    const primary = token.$extensions?.['com.getds.primary'] ?? '—';
    const stack = Array.isArray(token.$value) ? token.$value.join(', ') : token.$value ?? '—';
    const generic = token.$extensions?.['com.getds.generic'] ?? '—';
    return `| \`${name}\` | ${primary} | ${stack} | ${generic} |`;
  });

  return (
    '| Token | Primary | Stack | Generic |\n' +
    '|-------|---------|-------|---------|\n' +
    rows.join('\n')
  );
}

function renderBorderTokenTable(tokens) {
  const entries = Object.entries(tokens).filter(([, t]) => t.$type === 'border');
  if (entries.length === 0) return renderDimensionTokenTable(tokens);

  const rows = entries.map(([name, token]) => {
    const v = token.$value;
    const usage = token.$extensions?.['com.getds.usageCount'] ?? '';
    return `| \`${name}\` | ${v.width} | ${v.style} | \`${v.color}\` | ${usage} |`;
  });

  return (
    '| Token | Width | Style | Color | Usage |\n' +
    '|-------|-------|-------|-------|-------|\n' +
    rows.join('\n')
  );
}

function renderFontFaceTokenTable(tokens) {
  const entries = Object.entries(tokens);
  if (entries.length === 0) return '';

  const rows = entries.map(([name, token]) => {
    const ext = token.$extensions?.['com.getds.fontFace'] ?? {};
    const provider = ext.provider ?? '—';
    const weight = ext.fontWeight ?? '—';
    const style = ext.fontStyle ?? '—';
    const display = ext.fontDisplay ?? '—';
    return `| \`${name}\` | ${provider} | ${weight} | ${style} | ${display} |`;
  });

  return (
    '| Token | Provider | Weight | Style | Display |\n' +
    '|-------|----------|--------|-------|--------|\n' +
    rows.join('\n')
  );
}

function renderVariableFontTokenTable(tokens) {
  const entries = Object.entries(tokens);
  if (entries.length === 0) return '';

  const rows = entries.map(([name, token]) => {
    const ext = token.$extensions?.['com.getds.variableFont'] ?? {};
    const axes = (ext.axes ?? []).map(a => `${a.tag}(${a.min}–${a.max})`).join(', ') || '—';
    const family = Array.isArray(token.$value) ? token.$value[0] : token.$value ?? '—';
    return `| \`${name}\` | ${family} | ${axes} |`;
  });

  return (
    '| Token | Family | Axes |\n' +
    '|-------|--------|------|\n' +
    rows.join('\n')
  );
}

function TABLE_RENDERER_FOR(type) {
  switch (type) {
    case 'color':      return renderColorTokenTable;
    case 'typography': return renderTypographyTokenTable;
    case 'dimension':  return renderDimensionTokenTable;
    case 'shadow':     return renderShadowTokenTable;
    case 'fontFamily': return renderFontFamilyTokenTable;
    case 'border':     return renderBorderTokenTable;
    default:           return renderDimensionTokenTable;
  }
}

// ---------------------------------------------------------------------------
// Render a single token group section
// ---------------------------------------------------------------------------

function renderTokenGroup(label, type, tokens) {
  const json = JSON.stringify(tokens, null, 2);
  const tableRenderer = TABLE_RENDERER_FOR(type);
  const table = tableRenderer(tokens);

  return [
    `### ${label} Tokens`,
    table,
    '<details>',
    '<summary>Raw DTCG JSON</summary>',
    '',
    '```json',
    json,
    '```',
    '',
    '</details>',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Alias/Semantic token inference
// ---------------------------------------------------------------------------

/**
 * Infer simple semantic aliases from primitive color tokens.
 * Heuristic: darkest color → likely primary-text, lightest → likely background,
 * most saturated → likely accent/primary.
 */
function inferSemanticAliases(primitiveTokens) {
  const colorEntries = Object.entries(primitiveTokens)
    .filter(([, t]) => t.$type === 'color');

  if (colorEntries.length === 0) return null;

  // Parse hex to relative luminance (simple approximation)
  function hexLuminance(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // Parse hex to saturation (HSL-based approximation)
  function hexSaturation(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return 0;
    const d = max - min;
    return l > 0.5 ? d / (2 - max - min) : d / (max + min);
  }

  const analyzed = colorEntries
    .filter(([, t]) => /^#[0-9a-fA-F]{6}$/.test(t.$value))
    .map(([name, token]) => ({
      name,
      value: token.$value,
      luminance: hexLuminance(token.$value),
      saturation: hexSaturation(token.$value),
    }));

  if (analyzed.length === 0) return null;

  const byLum = [...analyzed].sort((a, b) => a.luminance - b.luminance);
  const bySat = [...analyzed].sort((a, b) => b.saturation - a.saturation);

  const aliases = {};

  // Most saturated → accent/primary
  if (bySat[0]) {
    aliases['color-primary'] = {
      $value: `{${bySat[0].name}}`,
      $type: 'color',
      $description: 'Primary brand / accent color (most saturated)',
    };
  }
  // Second most saturated → secondary
  if (bySat[1] && bySat[1].saturation > 0.1) {
    aliases['color-secondary'] = {
      $value: `{${bySat[1].name}}`,
      $type: 'color',
      $description: 'Secondary brand color',
    };
  }
  // Darkest → text
  if (byLum[0]) {
    aliases['color-text-primary'] = {
      $value: `{${byLum[0].name}}`,
      $type: 'color',
      $description: 'Primary text color (darkest)',
    };
  }
  // Lightest → background
  if (byLum[byLum.length - 1] && byLum[byLum.length - 1].luminance > 0.7) {
    aliases['color-background'] = {
      $value: `{${byLum[byLum.length - 1].name}}`,
      $type: 'color',
      $description: 'Primary background color (lightest)',
    };
  }

  return aliases;
}

// ---------------------------------------------------------------------------
// Main renderer
// ---------------------------------------------------------------------------

/**
 * Render the Tokens layer as rich Markdown with tables, architecture docs,
 * and semantic alias inference.
 *
 * @param {object} data - Tokens layer payload: { primitive, typography, spacing?, ... }
 * @returns {string}
 */
export function renderTokensSectionEnhanced(data = {}) {
  const parts = [];

  // Architecture preamble
  parts.push(
    '> Tokens follow the **W3C Design Token Community Group (DTCG)** specification ' +
    'and are organized in a 3-layer hierarchy:\n>\n' +
    '> 1. **Primitive tokens** — raw values with no semantic meaning (`color-3b82f6`)\n' +
    '> 2. **Semantic/Alias tokens** — intent-based references (`color-primary`, `color-text-primary`)\n' +
    '> 3. **Component tokens** — scoped to a component (`button-background-primary-hover`)'
  );

  // --- Primitive tokens ---
  if (data.primitive && typeof data.primitive === 'object') {
    // Group by $type
    const groups = {};
    for (const [name, token] of Object.entries(data.primitive)) {
      if (!token || typeof token !== 'object') continue;
      const type  = token.$type ?? 'other';
      const label = TYPE_LABELS[type] ?? type;
      if (!groups[label]) groups[label] = { type, tokens: {} };
      groups[label].tokens[name] = token;
    }

    if (Object.keys(groups).length > 0) {
      const groupSections = Object.entries(groups)
        .map(([label, { type, tokens }]) => renderTokenGroup(label, type, tokens));

      parts.push('### Layer 1 — Primitive Tokens\n\n' + groupSections.join('\n\n'));
    }
  }

  // --- Semantic/alias tokens (inferred) ---
  if (data.primitive && typeof data.primitive === 'object') {
    const aliases = inferSemanticAliases(data.primitive);
    if (aliases && Object.keys(aliases).length > 0) {
      const table = renderColorTokenTable(aliases);
      parts.push(
        '### Layer 2 — Semantic / Alias Tokens (Inferred)\n\n' +
        '> These aliases are **inferred heuristically** from the primitive colors ' +
        'and provide a semantic naming layer for theming.\n\n' +
        table
      );
    }
  }

  // --- Typography tokens ---
  if (data.typography && typeof data.typography === 'object') {
    const entries = Object.entries(data.typography);
    if (entries.length > 0) {
      const table = renderTypographyTokenTable(data.typography);
      const json  = JSON.stringify(data.typography, null, 2);
      parts.push(
        '### Typography Tokens\n\n' +
        table + '\n\n' +
        '<details>\n<summary>Raw DTCG JSON</summary>\n\n```json\n' + json + '\n```\n\n</details>'
      );
    }
  }

  // --- Dedup stats ---
  if (data._meta) {
    const m = data._meta;
    if (m.rawColorCount != null && m.dedupedColorCount != null) {
      parts.push(`> **Color deduplication**: ${m.rawColorCount} raw → ${m.dedupedColorCount} unique (CIE76 delta-E < 15)`);
    }
  }

  // --- Color groups by hue family ---
  if (data._meta?.colorGroups && data._meta.colorGroups.length > 0) {
    const groupLines = data._meta.colorGroups.map(g => {
      const swatches = g.colors.slice(0, 8).map(c => `\`${c.hex ?? '?'}\``).join(', ');
      return `- **${g.family}** (${g.colors.length}): ${swatches}`;
    });
    parts.push('### Color Families\n\n' + groupLines.join('\n'));
  }

  // --- Framework detection ---
  if (data.framework?.frameworks?.length > 0) {
    const fws = data.framework.frameworks
      .map(f => `**${f.name}** (confidence: ${f.confidence}%)`)
      .join(', ');
    parts.push(`> **Detected CSS Framework(s)**: ${fws}`);
  }

  // --- Additional token types (spacing, elevation, etc.) ---
  const knownKeys = new Set(['primitive', 'typography', '_meta', 'framework']);
  for (const [key, tokenMap] of Object.entries(data)) {
    if (knownKeys.has(key) || !tokenMap || typeof tokenMap !== 'object') continue;

    // Use specialized renderers for fontFace and variableFont token groups
    let renderer;
    if (key === 'fontFace') {
      renderer = renderFontFaceTokenTable;
    } else if (key === 'variableFont') {
      renderer = renderVariableFontTokenTable;
    } else {
      const firstToken = Object.values(tokenMap)[0];
      const type = firstToken?.$type ?? 'dimension';
      renderer = TABLE_RENDERER_FOR(type);
    }

    const label = key.charAt(0).toUpperCase() + key.slice(1);
    const table = renderer(tokenMap);
    const json  = JSON.stringify(tokenMap, null, 2);
    parts.push(
      `### ${label} Tokens\n\n` +
      table + '\n\n' +
      '<details>\n<summary>Raw DTCG JSON</summary>\n\n```json\n' + json + '\n```\n\n</details>'
    );
  }

  return parts.join('\n\n');
}
