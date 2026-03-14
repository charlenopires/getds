/**
 * Iconography section renderer — Layer 6
 *
 * Produces detailed, human-readable Markdown for:
 *   - Icon inventory summary
 *   - Inline SVG analysis
 *   - SVG references (img, use, background)
 *   - Icon fonts detected
 */

// ---------------------------------------------------------------------------
// Inline SVGs
// ---------------------------------------------------------------------------

function renderInlineSvgs(inlineSvgs) {
  if (!Array.isArray(inlineSvgs) || inlineSvgs.length === 0) {
    return '_No inline SVGs detected._';
  }

  // Aggregate by context
  const byContext = {};
  const viewBoxes = new Set();

  for (const { descriptor, context } of inlineSvgs) {
    const ctx = context ?? 'unknown';
    byContext[ctx] = (byContext[ctx] ?? 0) + 1;
    if (descriptor?.viewBox) viewBoxes.add(descriptor.viewBox);
  }

  const ctxRows = Object.entries(byContext)
    .sort((a, b) => b[1] - a[1])
    .map(([ctx, count]) => `| ${ctx} | ${count} |`);

  const parts = [
    `- **Total inline SVGs**: ${inlineSvgs.length}`,
    '#### SVG Usage Context\n\n' +
      '| Context | Count |\n|---------|-------|\n' +
      ctxRows.join('\n'),
  ];

  if (viewBoxes.size > 0) {
    const vbRows = [...viewBoxes].slice(0, 10)
      .map(vb => `| \`${vb}\` |`);
    parts.push(
      '#### ViewBox Sizes\n\n' +
      '| ViewBox |\n|----------|\n' +
      vbRows.join('\n')
    );
  }

  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// SVG references via <img> and <use>
// ---------------------------------------------------------------------------

function renderSvgRefs(imgRefs, useRefs, bgRefs) {
  const total = (imgRefs?.length ?? 0) + (useRefs?.length ?? 0) + (bgRefs?.length ?? 0);
  if (total === 0) return '_No SVG references detected._';

  const parts = [];

  if (Array.isArray(imgRefs) && imgRefs.length > 0) {
    const rows = imgRefs.slice(0, 10).map(ref => {
      const src = ref.src ?? ref.href ?? '—';
      const alt = ref.alt ?? '—';
      return `| \`${src}\` | ${alt} |`;
    });
    parts.push(
      `#### SVG via \`<img>\` (${imgRefs.length})\n\n` +
      '| src | alt |\n|-----|-----|\n' +
      rows.join('\n')
    );
  }

  if (Array.isArray(useRefs) && useRefs.length > 0) {
    const hrefs = [...new Set(useRefs.map(r => r.href ?? r.xlink ?? '—'))];
    const rows  = hrefs.slice(0, 10).map(h => `| \`${h}\` |`);
    parts.push(
      `#### SVG via \`<use>\` (${useRefs.length})\n\n` +
      '| href |\n|------|\n' +
      rows.join('\n')
    );
  }

  if (Array.isArray(bgRefs) && bgRefs.length > 0) {
    parts.push(`#### SVG via CSS background-image: **${bgRefs.length}** references`);
  }

  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// Icon fonts
// ---------------------------------------------------------------------------

function renderIconFonts(iconFonts) {
  if (!Array.isArray(iconFonts) || iconFonts.length === 0) {
    return '_No icon fonts detected._';
  }

  const rows = iconFonts.map(f => {
    const name  = f.name    ?? f.family  ?? f.primary ?? '—';
    const src   = f.src     ?? '—';
    return `| **${name}** | \`${src}\` |`;
  });

  return (
    '| Font | Source |\n' +
    '|------|--------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

function renderInventory(inventory) {
  if (!Array.isArray(inventory) || inventory.length === 0) return '';

  const rows = inventory.slice(0, 20).map(item => {
    const id    = item.id    ?? item.href ?? item.name ?? '—';
    const type  = item.type  ?? '—';
    const count = item.count ?? item.uses ?? 1;
    return `| \`${id}\` | ${type} | ${count} |`;
  });

  return (
    '### Icon Inventory\n\n' +
    '| Identifier | Type | Uses |\n' +
    '|------------|------|------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Main renderer
// ---------------------------------------------------------------------------

/**
 * Render the Iconography layer as rich Markdown.
 *
 * @param {object} data - Iconography layer payload
 * @returns {string}
 */
export function renderIconographySection(data = {}) {
  const { inlineSvgs, iconFonts, svgImgRefs, svgUseRefs, svgBgRefs, inventory } = data;

  const parts = [];

  // Summary table
  const counts = [
    ['Inline SVGs',              (inlineSvgs ?? []).length],
    ['SVG via `<img>`',          (svgImgRefs ?? []).length],
    ['SVG via `<use>`',          (svgUseRefs ?? []).length],
    ['SVG via CSS background',   (svgBgRefs  ?? []).length],
    ['Icon fonts',               (iconFonts  ?? []).length],
  ];

  const summaryRows = counts.map(([label, count]) =>
    `| ${label} | ${count} |`
  );

  parts.push(
    '### Summary\n\n' +
    '| Source | Count |\n|--------|-------|\n' +
    summaryRows.join('\n')
  );

  const totalIcons = counts.reduce((s, [, c]) => s + c, 0);
  if (totalIcons === 0) {
    parts.push('_No iconography detected on this page._');
    return parts.join('\n\n');
  }

  // Inline SVGs
  if ((inlineSvgs ?? []).length > 0) {
    parts.push('### Inline SVGs\n\n' + renderInlineSvgs(inlineSvgs));
  }

  // SVG references
  const refTotal = (svgImgRefs?.length ?? 0) + (svgUseRefs?.length ?? 0) + (svgBgRefs?.length ?? 0);
  if (refTotal > 0) {
    parts.push('### SVG References\n\n' + renderSvgRefs(svgImgRefs, svgUseRefs, svgBgRefs));
  }

  // Icon fonts
  if ((iconFonts ?? []).length > 0) {
    parts.push('### Icon Fonts\n\n' + renderIconFonts(iconFonts));
  }

  // Inventory
  if (Array.isArray(inventory) && inventory.length > 0) {
    parts.push(renderInventory(inventory));
  }

  return parts.join('\n\n');
}
