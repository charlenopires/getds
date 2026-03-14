/**
 * Visual Foundations section renderer — Layer 1
 *
 * Produces detailed, human-readable Markdown for:
 *   - Color palette (grouped by usage role, with hex/rgb/hsl)
 *   - CSS custom properties / design token variables
 *   - Typography (font families + type scale)
 *   - Spacing system (sorted scale with token names)
 *   - Elevation / shadows
 *   - Shape / border radius
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseHue(hsl) {
  if (!hsl) return 999;
  const m = hsl.match(/hsl\(\s*([\d.]+)/);
  return m ? parseFloat(m[1]) : 999;
}

function parsePx(val) {
  if (!val) return 0;
  const m = String(val).match(/^([\d.]+)/);
  return m ? parseFloat(m[1]) : 0;
}

// Infer a semantic role for a color based on its extraction property
function inferColorRole(property) {
  if (!property) return 'other';
  if (property.includes('background')) return 'background';
  if (property === 'color') return 'text';
  if (property.includes('border')) return 'border';
  if (property === 'outline-color') return 'border';
  if (property.includes('shadow')) return 'shadow';
  return 'other';
}

// ---------------------------------------------------------------------------
// Color Palette
// ---------------------------------------------------------------------------

function renderColorPalette(colors) {
  if (!Array.isArray(colors) || colors.length === 0) {
    return '_No colors extracted._';
  }

  // Sort by count (frequency) descending for dominant colors
  const byFrequency = [...colors].sort((a, b) => (b.count || 0) - (a.count || 0));
  const top10 = byFrequency.slice(0, 10);

  const dominantRows = top10.map(c => {
    const hex   = c.hex  ?? c.raw ?? '—';
    const rgb   = c.rgb  ?? '—';
    const hsl   = c.hsl  ?? '—';
    const count = c.count ?? '—';
    const role  = inferColorRole(c.property);
    return `| \`${hex}\` | ${rgb} | ${hsl} | ${count} | ${role} |`;
  });

  const dominantTable =
    '#### Dominant Colors (by frequency)\n\n' +
    '| Hex | RGB | HSL | Count | Role |\n' +
    '|-----|-----|-----|-------|------|\n' +
    dominantRows.join('\n');

  // Group by inferred role
  const groups = {};
  const ORDER = ['text', 'background', 'border', 'shadow', 'other'];
  for (const role of ORDER) groups[role] = [];

  for (const c of colors) {
    const role = inferColorRole(c.property);
    groups[role].push(c);
  }

  const sections = [dominantTable];

  for (const role of ORDER) {
    const list = groups[role];
    if (!list || list.length === 0) continue;

    const sorted = [...list].sort((a, b) => parseHue(a.hsl) - parseHue(b.hsl));

    const label = role.charAt(0).toUpperCase() + role.slice(1);
    const rows = sorted.map(c => {
      const hex   = c.hex  ?? c.raw ?? '—';
      const rgb   = c.rgb  ?? '—';
      const hsl   = c.hsl  ?? '—';
      const count = c.count ?? '—';
      return `| \`${hex}\` | ${rgb} | ${hsl} | ${count} |`;
    });

    sections.push(
      `#### ${label} Colors\n\n` +
      '| Hex | RGB | HSL | Count |\n' +
      '|-----|-----|-----|-------|\n' +
      rows.join('\n')
    );
  }

  return sections.join('\n\n');
}

// ---------------------------------------------------------------------------
// CSS Custom Properties
// ---------------------------------------------------------------------------

function renderCssVariables(cssVariables) {
  if (!cssVariables || typeof cssVariables !== 'object') return '';
  const entries = Object.entries(cssVariables);
  if (entries.length === 0) return '';

  // Group by prefix (e.g. --color-*, --space-*, --font-*)
  const groups = {};
  const OTHER = 'other';
  for (const [name, value] of entries) {
    const m = name.match(/^--([a-z]+)/);
    const prefix = m ? m[1] : OTHER;
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push({ name, value });
  }

  const sections = [];
  for (const [prefix, vars] of Object.entries(groups)) {
    const label = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    const rows = vars.map(v => `| \`${v.name}\` | \`${v.value}\` |`);
    sections.push(
      `#### ${label} Variables\n\n` +
      '| Variable | Value |\n' +
      '|----------|-------|\n' +
      rows.join('\n')
    );
  }

  return sections.join('\n\n');
}

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

function renderFontFamilies(fonts) {
  if (!Array.isArray(fonts) || fonts.length === 0) {
    return '_No font families extracted._';
  }

  const rows = fonts.map(f => {
    const primary = f.primary ?? f.stack ?? '—';
    const category =
      f.generic === 'monospace' ? 'Monospace / Code' :
      f.generic === 'serif'     ? 'Serif' :
      f.generic === 'cursive'   ? 'Cursive' :
      f.generic === 'fantasy'   ? 'Fantasy' :
                                  'Sans-serif';
    const stack = f.stack ?? '—';
    return `| **${primary}** | ${category} | \`${stack}\` |`;
  });

  return (
    '| Primary Family | Category | Full Stack |\n' +
    '|----------------|----------|------------|\n' +
    rows.join('\n')
  );
}

function renderTypeScale(typeScale) {
  if (!Array.isArray(typeScale) || typeScale.length === 0) {
    return '_No type scale detected._';
  }

  // Assign semantic names based on step position
  const NAMES = ['2xs', 'xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'];

  const rows = typeScale.map((step, i) => {
    const tokenName = `text-${NAMES[i] ?? `step-${step.step}`}`;
    const rem = step.remValue
      ? `${step.remValue}rem`
      : `${(step.px / 16).toFixed(4).replace(/\.?0+$/, '')}rem`;
    const ratio = i === 0 ? '—' : `${(step.px / typeScale[i - 1].px).toFixed(3)}`;
    return `| \`${tokenName}\` | ${step.value} | ${step.px}px | ${rem} | ${ratio} |`;
  });

  return (
    '| Token | Raw Value | px | rem | Ratio |\n' +
    '|-------|-----------|----|-----|-------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Spacing System
// ---------------------------------------------------------------------------

function renderSpacingScale(spacing) {
  if (!Array.isArray(spacing) || spacing.length === 0) {
    return '_No spacing values extracted._';
  }

  // Sort numerically
  const sorted = [...spacing].sort((a, b) => parsePx(a.value) - parsePx(b.value));

  // Detect likely base unit (smallest value)
  const base = parsePx(sorted[0]?.value) || 4;

  const rows = sorted.map((s, i) => {
    const px = parsePx(s.value);
    const multiplier = base > 0 ? `${(px / base).toFixed(1).replace('.0', '')}×` : '—';
    const props = Array.isArray(s.properties) ? s.properties.slice(0, 3).join(', ') : '—';
    const more = Array.isArray(s.properties) && s.properties.length > 3
      ? ` +${s.properties.length - 3} more` : '';
    return `| \`space-${i + 1}\` | ${s.value} | ${multiplier} | ${props}${more} |`;
  });

  return (
    `> **Base unit**: \`${sorted[0]?.value ?? '?'}\`\n\n` +
    '| Token | Value | Multiplier | Used in |\n' +
    '|-------|-------|------------|--------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Elevation / Shadows
// ---------------------------------------------------------------------------

function renderShadows(shadows) {
  if (!Array.isArray(shadows) || shadows.length === 0) {
    return '_No elevation shadows detected._';
  }

  // Sort by inferred "heaviness" (number of px values and spread)
  const rows = shadows.map((s, i) => {
    return `| \`elevation-${i}\` | \`${s.value}\` |`;
  });

  return (
    '| Level | Definition |\n' +
    '|-------|------------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Shape / Border Radius
// ---------------------------------------------------------------------------

function renderBorderRadius(radii) {
  if (!Array.isArray(radii) || radii.length === 0) {
    return '_No border-radius values detected._';
  }

  const NAMES = ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', 'full'];
  const sorted = [...radii].sort((a, b) => {
    const aFull = /^50%$|^9999/.test(a.value);
    const bFull = /^50%$|^9999/.test(b.value);
    if (aFull) return 1;
    if (bFull) return -1;
    return parsePx(a.value) - parsePx(b.value);
  });

  const rows = sorted.map((r, i) => {
    const name = NAMES[i] ?? `r${i + 1}`;
    const note =
      /^50%$/.test(r.value) || /9999/.test(r.value) ? 'pill / circle' :
      r.value === '0px' || r.value === '0' ? 'sharp' : '';
    return `| \`radius-${name}\` | ${r.value} | ${note} |`;
  });

  return (
    '| Token | Value | Note |\n' +
    '|-------|-------|------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Color Schemes (Dark/Light Mode)
// ---------------------------------------------------------------------------

function renderColorSchemes(colorSchemes) {
  if (!colorSchemes || ((!colorSchemes.dark || colorSchemes.dark.length === 0) && (!colorSchemes.light || colorSchemes.light.length === 0))) {
    return '_No color scheme overrides detected._';
  }

  const parts = [];

  if (colorSchemes.dark && colorSchemes.dark.length > 0) {
    const rows = colorSchemes.dark.slice(0, 20).map(c => {
      return `| \`${c.property}\` | \`${c.value}\` |`;
    });
    parts.push(
      '#### Dark Mode\n\n' +
      `**${colorSchemes.dark.length} color overrides**\n\n` +
      '| Property | Value |\n' +
      '|----------|-------|\n' +
      rows.join('\n')
    );
  }

  if (colorSchemes.light && colorSchemes.light.length > 0) {
    const rows = colorSchemes.light.slice(0, 20).map(c => {
      return `| \`${c.property}\` | \`${c.value}\` |`;
    });
    parts.push(
      '#### Light Mode\n\n' +
      `**${colorSchemes.light.length} color overrides**\n\n` +
      '| Property | Value |\n' +
      '|----------|-------|\n' +
      rows.join('\n')
    );
  }

  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// Gradients
// ---------------------------------------------------------------------------

function renderGradients(gradients) {
  if (!Array.isArray(gradients) || gradients.length === 0) {
    return '_No gradients detected._';
  }

  const rows = gradients.slice(0, 15).map((g, i) => {
    const type = g.type ?? '—';
    const val = (g.value ?? '—').slice(0, 80);
    const stops = Array.isArray(g.stops) ? g.stops.length : 0;
    return `| ${i + 1} | ${type} | \`${val}\` | ${stops} |`;
  });

  return (
    `- **Gradients found**: ${gradients.length}\n\n` +
    '| # | Type | Value | Stops |\n' +
    '|---|------|-------|-------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Z-Index Layers
// ---------------------------------------------------------------------------

function renderZIndexLayers(layers) {
  if (!Array.isArray(layers) || layers.length === 0) {
    return '_No z-index layers detected._';
  }

  const rows = layers.slice(0, 20).map(l => {
    return `| ${l.value} | ${l.count} | ${l.inferredRole ?? '—'} |`;
  });

  return (
    `- **Z-index values found**: ${layers.length}\n\n` +
    '| Value | Count | Role |\n' +
    '|-------|-------|------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// CSS Filters
// ---------------------------------------------------------------------------

function renderFilters(filters, backdropFilters) {
  const hasFilters = Array.isArray(filters) && filters.length > 0;
  const hasBackdrop = Array.isArray(backdropFilters) && backdropFilters.length > 0;

  if (!hasFilters && !hasBackdrop) {
    return '_No CSS filters detected._';
  }

  const parts = [];

  if (hasFilters) {
    const rows = filters.slice(0, 10).map(f => {
      const fns = Array.isArray(f.functions) ? f.functions.join(', ') : '—';
      return `| \`${(f.value ?? '—').slice(0, 60)}\` | ${fns} |`;
    });
    parts.push(
      '#### filter\n\n' +
      '| Value | Functions |\n' +
      '|-------|----------|\n' +
      rows.join('\n')
    );
  }

  if (hasBackdrop) {
    const rows = backdropFilters.slice(0, 10).map(f => {
      const fns = Array.isArray(f.functions) ? f.functions.join(', ') : '—';
      return `| \`${(f.value ?? '—').slice(0, 60)}\` | ${fns} |`;
    });
    parts.push(
      '#### backdrop-filter\n\n' +
      '| Value | Functions |\n' +
      '|-------|----------|\n' +
      rows.join('\n')
    );
  }

  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// Opacity Values
// ---------------------------------------------------------------------------

function renderOpacityValues(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return '_No non-default opacity values detected._';
  }

  const rows = values.slice(0, 15).map(v => {
    return `| ${v.value} | ${v.count} |`;
  });

  return (
    `- **Opacity values found**: ${values.length}\n\n` +
    '| Value | Count |\n' +
    '|-------|-------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Overflow & Scrolling
// ---------------------------------------------------------------------------

function renderOverflowPatterns(overflow) {
  if (!overflow || typeof overflow !== 'object') {
    return '_No overflow patterns detected._';
  }

  const patterns = overflow.overflowPatterns ?? [];
  const parts = [];

  if (patterns.length > 0) {
    const rows = patterns.slice(0, 10).map(p => {
      return `| ${p.overflow} | ${p.overflowX} | ${p.overflowY} | ${p.count} |`;
    });
    parts.push(
      '| overflow | overflow-x | overflow-y | Count |\n' +
      '|----------|------------|------------|-------|\n' +
      rows.join('\n')
    );
  }

  const meta = [];
  if (overflow.scrollBehavior && overflow.scrollBehavior !== 'auto') {
    meta.push(`- **Scroll behavior**: \`${overflow.scrollBehavior}\``);
  }
  if (overflow.hasScrollbarStyling) {
    meta.push('- **Custom scrollbar styling**: Yes');
  }

  if (meta.length > 0) parts.push(meta.join('\n'));

  return parts.length > 0 ? parts.join('\n\n') : '_No overflow patterns detected._';
}

// ---------------------------------------------------------------------------
// Font Sources
// ---------------------------------------------------------------------------

function renderFontSources(fontSources) {
  if (!Array.isArray(fontSources) || fontSources.length === 0) return '';

  const rows = fontSources.map(s => {
    const family = s.family ?? '—';
    const provider = s.provider ?? '—';
    const link = s.linkTag ?? s.importRule ?? s.url ?? '—';
    return `| ${family} | ${provider} | \`${link.length > 80 ? link.slice(0, 77) + '...' : link}\` |`;
  });

  return (
    '| Family | Provider | Link/Import |\n' +
    '|--------|----------|-------------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// @font-face Declarations
// ---------------------------------------------------------------------------

function renderFontFaceDeclarations(fontFaceRules) {
  if (!Array.isArray(fontFaceRules) || fontFaceRules.length === 0) return '';

  const blocks = fontFaceRules.slice(0, 10).map(rule => {
    const lines = [`@font-face {`];
    lines.push(`  font-family: '${rule.fontFamily}';`);
    if (rule.sources?.length > 0) {
      const srcParts = rule.sources.map(s => {
        let part = `url('${s.url}')`;
        if (s.format) part += ` format('${s.format}')`;
        return part;
      });
      lines.push(`  src: ${srcParts.join(',\n       ')};`);
    }
    if (rule.fontWeight) lines.push(`  font-weight: ${rule.fontWeight};`);
    if (rule.fontStyle && rule.fontStyle !== 'normal') lines.push(`  font-style: ${rule.fontStyle};`);
    if (rule.fontDisplay) lines.push(`  font-display: ${rule.fontDisplay};`);
    if (rule.unicodeRange) lines.push(`  unicode-range: ${rule.unicodeRange};`);
    if (rule.fontStretch) lines.push(`  font-stretch: ${rule.fontStretch};`);
    lines.push('}');
    return lines.join('\n');
  });

  return '```css\n' + blocks.join('\n\n') + '\n```';
}

// ---------------------------------------------------------------------------
// Variable Fonts
// ---------------------------------------------------------------------------

function renderVariableFonts(variableFonts) {
  if (!Array.isArray(variableFonts) || variableFonts.length === 0) return '';

  const rows = [];
  for (const font of variableFonts) {
    for (const axis of (font.axes ?? [])) {
      rows.push(`| ${font.family} | ${axis.tag} | ${axis.name} | ${axis.min} | ${axis.max} | ${axis.isRegistered ? 'Yes' : 'No'} |`);
    }
  }

  let md = '| Family | Axis | Name | Min | Max | Registered |\n' +
           '|--------|------|------|-----|-----|------------|\n' +
           rows.join('\n');

  // Add CSS usage examples
  const examples = variableFonts
    .filter(f => f.usedSettings?.length > 0)
    .slice(0, 3)
    .map(f => f.usedSettings.map(s => `font-variation-settings: ${s};`).join('\n'));

  if (examples.length > 0) {
    md += '\n\n```css\n' + examples.join('\n') + '\n```';
  }

  return md;
}

// ---------------------------------------------------------------------------
// Fluid Typography
// ---------------------------------------------------------------------------

function renderFluidTypography(fluidTypography) {
  if (!Array.isArray(fluidTypography) || fluidTypography.length === 0) return '';

  const rows = fluidTypography.map(f => {
    return `| \`${f.selector}\` | \`${f.declaration}\` | ${f.type} | ${f.min ?? '—'} | ${f.preferred ?? '—'} | ${f.max ?? '—'} |`;
  });

  return (
    '| Selector | Declaration | Type | Min | Preferred | Max |\n' +
    '|----------|-------------|------|-----|-----------|-----|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Main renderer
// ---------------------------------------------------------------------------

/**
 * Render the Visual Foundations layer as rich Markdown.
 *
 * @param {object} data - Layer 1 extraction payload
 * @returns {string}
 */
export function renderVisualFoundationsSection(data = {}) {
  const { colors, fonts, spacing, boxShadows, borderRadii, typeScale, cssVariables, typographyRoles, colorSchemes, gradients, zIndexLayers, filters, backdropFilters, opacityValues, overflowPatterns, fontFaceRules, fontSources, variableFonts, fluidTypography } = data;

  const parts = [];

  // --- Color System ---
  parts.push('### Color System\n\n' + renderColorPalette(colors));

  // --- CSS Custom Properties ---
  const cssVarsMd = renderCssVariables(cssVariables);
  if (cssVarsMd) {
    parts.push(
      '### CSS Custom Properties\n\n' +
      '> These CSS variables form the primitive token layer of the design system.\n\n' +
      cssVarsMd
    );
  }

  // --- Typography ---
  parts.push('### Typography\n\n#### Font Families\n\n' + renderFontFamilies(fonts));

  // Typography by element role
  if (typographyRoles && Object.keys(typographyRoles).length > 0) {
    const ORDER = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'small', 'code'];
    const present = ORDER.filter(k => typographyRoles[k]);
    if (present.length > 0) {
      const header = '| Element | Font Family | Size | Weight | Line Height | Color |\n|---------|-------------|------|--------|-------------|-------|';
      const rows = present.map(role => {
        const t = typographyRoles[role];
        const fontName = (t.fontFamily ?? '—').split(',')[0].replace(/['"]/g, '').trim();
        return `| \`${role}\` | ${fontName} | ${t.fontSize ?? '—'} | ${t.fontWeight ?? '—'} | ${t.lineHeight ?? '—'} | \`${t.color ?? '—'}\` |`;
      });
      parts.push('#### Typography by Element\n\n' + header + '\n' + rows.join('\n'));
    }
  }

  if (Array.isArray(typeScale) && typeScale.length > 0) {
    parts.push('#### Type Scale\n\n' + renderTypeScale(typeScale));
  }

  // Font Sources
  if (Array.isArray(fontSources) && fontSources.length > 0) {
    parts.push('#### Font Sources\n\n' + renderFontSources(fontSources));
  }

  // @font-face Declarations
  if (Array.isArray(fontFaceRules) && fontFaceRules.length > 0) {
    parts.push('#### @font-face Declarations\n\n' + renderFontFaceDeclarations(fontFaceRules));
  }

  // Variable Fonts
  if (Array.isArray(variableFonts) && variableFonts.length > 0) {
    parts.push('#### Variable Fonts\n\n' + renderVariableFonts(variableFonts));
  }

  // Fluid Typography
  if (Array.isArray(fluidTypography) && fluidTypography.length > 0) {
    parts.push('#### Fluid Typography\n\n' + renderFluidTypography(fluidTypography));
  }

  // --- Spacing ---
  parts.push('### Spacing System\n\n' + renderSpacingScale(spacing));

  // --- Elevation ---
  if (Array.isArray(boxShadows) && boxShadows.length > 0) {
    parts.push('### Elevation / Shadows\n\n' + renderShadows(boxShadows));
  }

  // --- Shape ---
  if (Array.isArray(borderRadii) && borderRadii.length > 0) {
    parts.push('### Shape / Border Radius\n\n' + renderBorderRadius(borderRadii));
  }

  // --- Color Schemes ---
  if (colorSchemes !== undefined) {
    parts.push('### Color Schemes (Dark/Light Mode)\n\n' + renderColorSchemes(colorSchemes));
  }

  // --- Gradients ---
  if (Array.isArray(gradients) && gradients.length > 0) {
    parts.push('### Gradients\n\n' + renderGradients(gradients));
  }

  // --- Z-Index Layers ---
  if (Array.isArray(zIndexLayers) && zIndexLayers.length > 0) {
    parts.push('### Z-Index Layers\n\n' + renderZIndexLayers(zIndexLayers));
  }

  // --- CSS Filters ---
  if (filters !== undefined || backdropFilters !== undefined) {
    parts.push('### CSS Filters\n\n' + renderFilters(filters, backdropFilters));
  }

  // --- Opacity ---
  if (Array.isArray(opacityValues) && opacityValues.length > 0) {
    parts.push('### Opacity Values\n\n' + renderOpacityValues(opacityValues));
  }

  // --- Overflow & Scrolling ---
  if (overflowPatterns !== undefined) {
    parts.push('### Overflow & Scrolling\n\n' + renderOverflowPatterns(overflowPatterns));
  }

  return parts.join('\n\n');
}
