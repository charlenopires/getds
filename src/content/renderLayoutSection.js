/**
 * Layout Patterns section renderer — Layer 4
 *
 * Produces detailed, human-readable Markdown for:
 *   - Page template / landmark structure
 *   - CSS Grid descriptors
 *   - Flexbox usage
 *   - Responsive breakpoints
 */

// ---------------------------------------------------------------------------
// Page Template
// ---------------------------------------------------------------------------

function renderPageTemplate(pageTemplate) {
  if (!pageTemplate || typeof pageTemplate !== 'object') {
    return '_No page template detected._';
  }

  const parts = [];

  // Landmarks
  const landmarks = pageTemplate.landmarks ?? pageTemplate.elements ?? [];
  if (Array.isArray(landmarks) && landmarks.length > 0) {
    const rows = landmarks.map(lm => {
      const tag   = lm.tag   ?? lm.element ?? '—';
      const role  = lm.role  ?? lm.landmark ?? '—';
      const count = lm.count ?? 1;
      return `| \`<${tag}>\` | \`${role}\` | ${count} |`;
    });

    parts.push(
      '#### Page Landmarks\n\n' +
      '| Element | Role | Count |\n' +
      '|---------|------|-------|\n' +
      rows.join('\n')
    );
  }

  // Page structure summary
  const hasHeader = landmarks.some(l => /header|banner/i.test(l.role ?? l.tag ?? ''));
  const hasNav    = landmarks.some(l => /nav|navigation/i.test(l.role ?? l.tag ?? ''));
  const hasMain   = landmarks.some(l => /main/i.test(l.role ?? l.tag ?? ''));
  const hasAside  = landmarks.some(l => /aside|complementary/i.test(l.role ?? l.tag ?? ''));
  const hasFooter = landmarks.some(l => /footer|contentinfo/i.test(l.role ?? l.tag ?? ''));

  const structure = [
    hasHeader ? 'Header' : null,
    hasNav    ? 'Navigation' : null,
    hasMain   ? 'Main content' : null,
    hasAside  ? 'Aside' : null,
    hasFooter ? 'Footer' : null,
  ].filter(Boolean);

  if (structure.length > 0) {
    parts.push(
      '#### Page Structure\n\n' +
      structure.map((s, i) => `${i + 1}. ${s}`).join('\n')
    );
  }

  return parts.length ? parts.join('\n\n') : '_No meaningful page template detected._';
}

// ---------------------------------------------------------------------------
// CSS Grid
// ---------------------------------------------------------------------------

function renderGrid(grid) {
  if (!Array.isArray(grid) || grid.length === 0) {
    return '_No CSS Grid usage detected._';
  }

  const deduped = [];
  const seen = new Set();
  for (const g of grid) {
    const key = `${g.templateColumns}|${g.templateRows}|${g.gap}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(g);
    }
  }

  const rows = deduped.slice(0, 10).map(g => {
    const cols = g.templateColumns ?? g.gridTemplateColumns ?? '—';
    const rows_ = g.templateRows   ?? g.gridTemplateRows   ?? '—';
    const gap  = g.gap             ?? g.columnGap          ?? '—';
    const auto = g.autoFlow        ?? '—';
    return `| \`${cols}\` | \`${rows_}\` | ${gap} | ${auto} |`;
  });

  return (
    `- **Grid containers found**: ${grid.length} (${deduped.length} unique patterns)\n\n` +
    '| Template Columns | Template Rows | Gap | Auto Flow |\n' +
    '|------------------|--------------|-----|----------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Flexbox
// ---------------------------------------------------------------------------

function renderFlexbox(flexbox) {
  if (!Array.isArray(flexbox) || flexbox.length === 0) {
    return '_No Flexbox usage detected._';
  }

  // Aggregate: count direction usage
  const directionCounts = {};
  const justifyCounts   = {};
  const alignCounts     = {};

  for (const f of flexbox) {
    const dir = f.flexDirection  ?? f.direction  ?? 'row';
    const jc  = f.justifyContent ?? f.justify    ?? '—';
    const ai  = f.alignItems     ?? f.align      ?? '—';
    directionCounts[dir] = (directionCounts[dir] ?? 0) + 1;
    if (jc !== '—') justifyCounts[jc] = (justifyCounts[jc] ?? 0) + 1;
    if (ai !== '—') alignCounts[ai]   = (alignCounts[ai]   ?? 0) + 1;
  }

  const dirRows = Object.entries(directionCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([dir, count]) => `| \`${dir}\` | ${count} |`);

  const jcRows = Object.entries(justifyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([val, count]) => `| \`${val}\` | ${count} |`);

  const aiRows = Object.entries(alignCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([val, count]) => `| \`${val}\` | ${count} |`);

  const parts = [
    `- **Flex containers found**: ${flexbox.length}`,
    '#### Flex Direction\n\n' +
      '| Direction | Count |\n|-----------|-------|\n' + dirRows.join('\n'),
  ];

  if (jcRows.length > 0) {
    parts.push(
      '#### Justify Content\n\n' +
      '| Value | Count |\n|-------|-------|\n' + jcRows.join('\n')
    );
  }

  if (aiRows.length > 0) {
    parts.push(
      '#### Align Items\n\n' +
      '| Value | Count |\n|-------|-------|\n' + aiRows.join('\n')
    );
  }

  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// Breakpoints
// ---------------------------------------------------------------------------

function renderBreakpoints(breakpoints) {
  if (!Array.isArray(breakpoints) || breakpoints.length === 0) {
    return '_No responsive breakpoints detected._';
  }

  // Sort by value ascending
  const sorted = [...breakpoints].sort((a, b) => {
    const aVal = a.unit === 'px' ? a.value : a.value * 16;
    const bVal = b.unit === 'px' ? b.value : b.value * 16;
    return aVal - bVal;
  });

  // Infer token name from category
  const CATEGORY_TOKENS = {
    mobile:  'sm',
    tablet:  'md',
    desktop: 'lg',
    wide:    'xl',
  };

  const usedTokens = {};
  const rows = sorted.map(bp => {
    const px    = bp.unit === 'px' ? bp.value : Math.round(bp.value * 16);
    const cat   = bp.category ?? 'desktop';
    const base  = CATEGORY_TOKENS[cat] ?? cat;
    const count = (usedTokens[base] = (usedTokens[base] ?? 0) + 1);
    const token = count > 1 ? `breakpoint-${base}-${count}` : `breakpoint-${base}`;
    const query = bp.query ?? `(min-width: ${px}px)`;
    return `| \`${token}\` | \`${bp.value}${bp.unit}\` | ${px}px | ${cat} | \`@media ${query}\` |`;
  });

  return (
    `- **Total breakpoints**: ${breakpoints.length}\n\n` +
    '| Token | Value | px | Category | Media Query |\n' +
    '|-------|-------|----|----------|-------------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Main renderer
// ---------------------------------------------------------------------------

/**
 * Render the Layout Patterns layer as rich Markdown.
 *
 * @param {object} data - Layout layer payload
 * @returns {string}
 */
export function renderLayoutSection(data = {}) {
  const { pageTemplate, grid, flexbox, breakpoints } = data;

  const parts = [];

  parts.push('### Page Template\n\n' + renderPageTemplate(pageTemplate));
  parts.push('### CSS Grid\n\n' + renderGrid(grid));
  parts.push('### Flexbox\n\n' + renderFlexbox(flexbox));
  parts.push('### Responsive Breakpoints\n\n' + renderBreakpoints(breakpoints));

  return parts.join('\n\n');
}
