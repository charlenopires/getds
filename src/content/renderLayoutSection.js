/**
 * Layout Patterns section renderer — Layer 4
 *
 * Produces detailed, human-readable Markdown for:
 *   - Spatial System (base unit, spacing scale, insets, consistency)
 *   - Page Layout (layout type, page template)
 *   - Grid Systems (column grid, CSS grid, card grids)
 *   - Flexbox & Stacking (flex containers, flex children, stack/inline)
 *   - Responsive Design (breakpoints, containers, queries, gutters)
 *   - Advanced Layout (position/scroll-snap, nesting, spacing variables)
 *   - Content Patterns (content sections, form layouts)
 */

// ---------------------------------------------------------------------------
// Spatial System
// ---------------------------------------------------------------------------

function renderSpacingScale(spacingScale) {
  if (!Array.isArray(spacingScale) || spacingScale.length === 0) return '';

  const rows = spacingScale.map(s => {
    const sem = s.semanticName ?? '—';
    const mult = s.multiplier != null ? `×${s.multiplier}` : '—';
    return `| ${s.step} | \`${s.value}\` | ${s.px}px | ${mult} | ${sem} |`;
  });

  return (
    '#### Spacing Scale\n\n' +
    '| Step | Value | px | Multiplier | Semantic Name |\n' +
    '|------|-------|----|------------|---------------|\n' +
    rows.join('\n')
  );
}

function renderInsetPatterns(insets) {
  if (!Array.isArray(insets) || insets.length === 0) return '';

  const typeCounts = {};
  for (const i of insets) {
    typeCounts[i.type] = (typeCounts[i.type] ?? 0) + i.count;
  }

  const summary = Object.entries(typeCounts)
    .map(([type, count]) => `${type}: ${count}`)
    .join(', ');

  const rows = insets.slice(0, 10).map(i => {
    const v = i.values;
    return `| ${i.type} | \`${v.top}px ${v.right}px ${v.bottom}px ${v.left}px\` | ${i.count} |`;
  });

  return (
    `#### Inset Patterns\n\n` +
    `- **Pattern distribution**: ${summary}\n\n` +
    '| Type | Values (T R B L) | Count |\n' +
    '|------|-------------------|-------|\n' +
    rows.join('\n')
  );
}

function renderSpacingConsistency(consistency) {
  if (!consistency) return '';

  return (
    '#### Spacing Consistency\n\n' +
    `- **Score**: ${consistency.score} (${consistency.grade})\n` +
    `- **On scale**: ${consistency.onScale} / ${consistency.total}\n` +
    `- **Off scale**: ${consistency.offScale}`
  );
}

// ---------------------------------------------------------------------------
// Page Layout
// ---------------------------------------------------------------------------

function renderLayoutType(layoutType) {
  if (!layoutType) return '';

  return (
    '#### Layout Type\n\n' +
    `- **Type**: ${layoutType.layoutType}\n` +
    `- **Confidence**: ${Math.round(layoutType.confidence * 100)}%\n` +
    `- **Description**: ${layoutType.description}`
  );
}

function renderPageTemplate(pageTemplate) {
  if (!pageTemplate || typeof pageTemplate !== 'object') {
    return '_No page template detected._';
  }

  const parts = [];
  const landmarks = pageTemplate.landmarks ?? pageTemplate.elements ?? [];
  if (Array.isArray(landmarks) && landmarks.length > 0) {
    const rows = landmarks.map(lm => {
      const tag   = lm.tag   ?? lm.element ?? '—';
      const role  = lm.role  ?? lm.landmark ?? '—';
      const count = lm.count ?? 1;
      return `| \`<${tag}>\` | \`${role}\` | ${count} |`;
    });

    parts.push(
      '| Element | Role | Count |\n' +
      '|---------|------|-------|\n' +
      rows.join('\n')
    );
  }

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
    parts.push(structure.map((s, i) => `${i + 1}. ${s}`).join('\n'));
  }

  return parts.length ? parts.join('\n\n') : '_No meaningful page template detected._';
}

// ---------------------------------------------------------------------------
// Grid Systems
// ---------------------------------------------------------------------------

function renderColumnGridSystem(columnSystem) {
  if (!columnSystem || columnSystem.detectedSystem === 'none') return '';

  return (
    '#### Column Grid System\n\n' +
    `- **Detected**: ${columnSystem.detectedSystem}\n` +
    `- **Dominant column count**: ${columnSystem.dominantColumnCount}\n` +
    `- **Confidence**: ${Math.round(columnSystem.confidence * 100)}%`
  );
}

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
    const cols = g.templateColumns ?? '—';
    const rows_ = g.templateRows   ?? '—';
    const gap  = g.gap             ?? '—';
    const auto = g.gridAutoFlow    ?? g.autoFlow ?? '—';
    const place = g.placeItems     ?? '—';
    return `| \`${cols}\` | \`${rows_}\` | ${gap} | ${auto} | ${place} |`;
  });

  return (
    `- **Grid containers found**: ${grid.length} (${deduped.length} unique patterns)\n\n` +
    '| Template Columns | Template Rows | Gap | Auto Flow | Place Items |\n' +
    '|------------------|--------------|-----|-----------|-------------|\n' +
    rows.join('\n')
  );
}

function renderCardGrids(grids) {
  if (!Array.isArray(grids) || grids.length === 0) {
    return '_No card grid patterns detected._';
  }

  const rows = grids.slice(0, 10).map(g => {
    const sel = (g.selector ?? '—').slice(0, 40);
    const cols = g.columnCount ?? '—';
    const cards = g.cardCount ?? '—';
    const type = g.gridType ?? '—';
    return `| \`${sel}\` | ${cols} | ${cards} | ${type} |`;
  });

  return (
    `- **Card grids found**: ${grids.length}\n\n` +
    '| Container | Columns | Cards | Type |\n' +
    '|-----------|---------|-------|------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Flexbox & Stacking
// ---------------------------------------------------------------------------

function renderFlexbox(flexbox) {
  if (!Array.isArray(flexbox) || flexbox.length === 0) {
    return '_No Flexbox usage detected._';
  }

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
    '##### Flex Direction\n\n' +
      '| Direction | Count |\n|-----------|-------|\n' + dirRows.join('\n'),
  ];

  if (jcRows.length > 0) {
    parts.push(
      '##### Justify Content\n\n' +
      '| Value | Count |\n|-------|-------|\n' + jcRows.join('\n')
    );
  }

  if (aiRows.length > 0) {
    parts.push(
      '##### Align Items\n\n' +
      '| Value | Count |\n|-------|-------|\n' + aiRows.join('\n')
    );
  }

  return parts.join('\n\n');
}

function renderFlexChildren(flexChildren) {
  if (!Array.isArray(flexChildren) || flexChildren.length === 0) return '';

  const rows = flexChildren.slice(0, 10).map(fc =>
    `| \`${fc.flexBasis}\` | ${fc.flexGrow} | ${fc.flexShrink} | ${fc.order} | ${fc.count} |`
  );

  return (
    '#### Flex Child Patterns\n\n' +
    '| Flex Basis | Grow | Shrink | Order | Count |\n' +
    '|------------|------|--------|-------|-------|\n' +
    rows.join('\n')
  );
}

function renderStackInline(stackInline) {
  if (!stackInline) return '';
  const { stacks, inlines, wrapGrids } = stackInline;
  const hasData = (stacks?.length > 0) || (inlines?.length > 0) || (wrapGrids?.length > 0);
  if (!hasData) return '';

  const parts = ['#### Stack & Inline Patterns\n'];
  const allRows = [];

  for (const s of (stacks ?? [])) {
    allRows.push(`| stack | \`${s.gap}\` | ${s.count} |`);
  }
  for (const i of (inlines ?? [])) {
    allRows.push(`| inline | \`${i.gap}\` | ${i.count} |`);
  }
  for (const w of (wrapGrids ?? [])) {
    allRows.push(`| wrap-grid | \`${w.gap}\` | ${w.count} |`);
  }

  if (allRows.length > 0) {
    parts.push(
      '| Intent | Gap | Count |\n' +
      '|--------|-----|-------|\n' +
      allRows.join('\n')
    );
  }

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Responsive Design
// ---------------------------------------------------------------------------

function renderBreakpoints(breakpoints) {
  if (!Array.isArray(breakpoints) || breakpoints.length === 0) {
    return '_No responsive breakpoints detected._';
  }

  const sorted = [...breakpoints].sort((a, b) => {
    const aVal = a.unit === 'px' ? a.value : a.value * 16;
    const bVal = b.unit === 'px' ? b.value : b.value * 16;
    return aVal - bVal;
  });

  const CATEGORY_TOKENS = { mobile: 'sm', tablet: 'md', desktop: 'lg', wide: 'xl' };
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

function renderContainerWidths(widths) {
  if (!Array.isArray(widths) || widths.length === 0) {
    return '_No container width constraints detected._';
  }

  const rows = widths.slice(0, 15).map(w => {
    const mw = w.maxWidth || '—';
    const wd = w.width || '—';
    return `| \`${mw}\` | \`${wd}\` |`;
  });

  return (
    `- **Container width patterns**: ${widths.length}\n\n` +
    '| max-width | width |\n' +
    '|-----------|-------|\n' +
    rows.join('\n')
  );
}

function renderContainerQueries(queries) {
  if (!Array.isArray(queries) || queries.length === 0) {
    return '_No @container queries detected._';
  }

  const rows = queries.map(q => {
    const name = q.name || '(unnamed)';
    const condition = q.condition || '—';
    return `| ${name} | \`${condition}\` |`;
  });

  return (
    `- **Container queries found**: ${queries.length}\n\n` +
    '| Name | Condition |\n' +
    '|------|----------|\n' +
    rows.join('\n')
  );
}

function renderGutters(gutters) {
  if (!Array.isArray(gutters) || gutters.length === 0) {
    return '_No gutter values detected._';
  }

  const sorted = [...gutters].sort((a, b) => {
    const aPx = parseFloat(String(a).replace(/[^0-9.]/g, '')) || 0;
    const bPx = parseFloat(String(b).replace(/[^0-9.]/g, '')) || 0;
    return aPx - bPx;
  });

  return `- **Gutter tokens**: ${sorted.map(g => `\`${g}\``).join(', ')}`;
}

// ---------------------------------------------------------------------------
// Advanced Layout
// ---------------------------------------------------------------------------

function renderPositionPatterns(positionPatterns) {
  if (!positionPatterns) return '';

  const { stickyElements, fixedElements, scrollSnapContainers } = positionPatterns;
  const hasData = (stickyElements?.length > 0) || (fixedElements?.length > 0) || (scrollSnapContainers?.length > 0);
  if (!hasData) return '';

  const parts = ['#### Position & Scroll Snap\n'];

  if (stickyElements?.length > 0) {
    const rows = stickyElements.slice(0, 5).map(e =>
      `| sticky | \`${e.top}\` | \`${e.zIndex}\` |`
    );
    parts.push(
      `- **Sticky elements**: ${stickyElements.length}\n\n` +
      '| Position | Top | z-index |\n' +
      '|----------|-----|--------|\n' +
      rows.join('\n')
    );
  }

  if (fixedElements?.length > 0) {
    const rows = fixedElements.slice(0, 5).map(e =>
      `| fixed | \`${e.top}\` | \`${e.zIndex}\` |`
    );
    parts.push(
      `- **Fixed elements**: ${fixedElements.length}\n\n` +
      '| Position | Top | z-index |\n' +
      '|----------|-----|--------|\n' +
      rows.join('\n')
    );
  }

  if (scrollSnapContainers?.length > 0) {
    const rows = scrollSnapContainers.slice(0, 5).map(s =>
      `| \`${s.snapType}\` | \`${s.snapAlign}\` |`
    );
    parts.push(
      `- **Scroll snap containers**: ${scrollSnapContainers.length}\n\n` +
      '| Snap Type | Snap Align |\n' +
      '|-----------|----------|\n' +
      rows.join('\n')
    );
  }

  return parts.join('\n\n');
}

function renderLayoutNesting(nesting) {
  if (!nesting || nesting.maxDepth === 0) return '';

  const rows = nesting.nestingPatterns.slice(0, 8).map(p =>
    `| \`${p.path}\` | ${p.depth} | ${p.count} |`
  );

  return (
    '#### Layout Nesting\n\n' +
    `- **Max depth**: ${nesting.maxDepth}\n\n` +
    '| Path | Depth | Count |\n' +
    '|------|-------|-------|\n' +
    rows.join('\n')
  );
}

function renderCssSpacingVariables(spacingVariables) {
  if (!Array.isArray(spacingVariables) || spacingVariables.length === 0) return '';

  const rows = spacingVariables.slice(0, 15).map(v => {
    const px = v.resolvedPx != null ? `${v.resolvedPx}px` : '—';
    return `| \`${v.name}\` | \`${v.value}\` | ${px} | ${v.category} |`;
  });

  return (
    '#### CSS Spacing Variables\n\n' +
    `- **Spacing custom properties**: ${spacingVariables.length}\n\n` +
    '| Variable | Value | Resolved | Category |\n' +
    '|----------|-------|----------|----------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Content Patterns
// ---------------------------------------------------------------------------

function renderContentSections(sections) {
  if (!Array.isArray(sections) || sections.length === 0) {
    return '_No content section patterns detected._';
  }

  const capped = sections.slice(0, 5);
  const rows = capped.map(s => {
    const sel = (s.selector ?? '—').slice(0, 50);
    const pattern = s.pattern ?? '—';
    const conf = typeof s.confidence === 'number' ? `${Math.round(s.confidence * 100)}%` : '—';
    return `| \`${sel}\` | ${pattern} | ${conf} |`;
  });

  return (
    `- **Content sections detected**: ${sections.length}\n\n` +
    '| Section | Pattern | Confidence |\n' +
    '|---------|---------|------------|\n' +
    rows.join('\n')
  );
}

function renderFormLayouts(layouts) {
  if (!Array.isArray(layouts) || layouts.length === 0) {
    return '_No form layouts detected._';
  }

  const rows = layouts.map(l => {
    const idx = l.formIndex ?? 0;
    const layout = l.layout ?? '—';
    const fields = l.fieldCount ?? 0;
    const conf = typeof l.confidence === 'number' ? `${Math.round(l.confidence * 100)}%` : '—';
    return `| Form #${idx} | ${layout} | ${fields} | ${conf} |`;
  });

  return (
    '| Form | Layout | Fields | Confidence |\n' +
    '|------|--------|--------|------------|\n' +
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
  const {
    pageTemplate, grid, flexbox, breakpoints,
    contentSections, formLayouts, cardGrids, containerWidths, gutters, containerQueries,
    // New fields
    spacingScale, baseUnit, insets, spacingConsistency,
    layoutType, columnSystem, stackInline, flexChildren,
    positionPatterns, layoutNesting, spacingVariables,
  } = data;

  const parts = [];

  // ── Spatial System ──────────────────────────────────────────────────────
  const spatialParts = [];
  if (baseUnit) {
    spatialParts.push(`#### Base Unit & Grid\n\n- **Base unit**: ${baseUnit}px`);
  }

  const scaleSection = renderSpacingScale(spacingScale);
  if (scaleSection) spatialParts.push(scaleSection);

  const insetSection = renderInsetPatterns(insets);
  if (insetSection) spatialParts.push(insetSection);

  const consistencySection = renderSpacingConsistency(spacingConsistency);
  if (consistencySection) spatialParts.push(consistencySection);

  if (spatialParts.length > 0) {
    parts.push('### Spatial System\n\n' + spatialParts.join('\n\n'));
  }

  // ── Page Layout ──────────────────────────────────────────────────────────
  const layoutTypeSec = renderLayoutType(layoutType);
  if (layoutTypeSec) parts.push('### Page Layout\n\n' + layoutTypeSec);

  parts.push('### Page Template\n\n' + renderPageTemplate(pageTemplate));

  // ── Grid Systems ─────────────────────────────────────────────────────────
  const colGridSec = renderColumnGridSystem(columnSystem);
  if (colGridSec) parts.push(colGridSec);

  parts.push('### CSS Grid\n\n' + renderGrid(grid));

  if (cardGrids !== undefined) {
    parts.push('### Card Grids\n\n' + renderCardGrids(cardGrids));
  }

  // ── Flexbox & Stacking ───────────────────────────────────────────────────
  parts.push('### Flexbox\n\n' + renderFlexbox(flexbox));

  const flexChildSec = renderFlexChildren(flexChildren);
  if (flexChildSec) parts.push(flexChildSec);

  const stackSec = renderStackInline(stackInline);
  if (stackSec) parts.push(stackSec);

  // ── Responsive Design ────────────────────────────────────────────────────
  parts.push('### Responsive Breakpoints\n\n' + renderBreakpoints(breakpoints));

  if (containerWidths !== undefined) {
    parts.push('### Container Widths\n\n' + renderContainerWidths(containerWidths));
  }

  if (containerQueries !== undefined) {
    parts.push('### Container Queries\n\n' + renderContainerQueries(containerQueries));
  }

  if (gutters !== undefined) {
    parts.push('### Gutters\n\n' + renderGutters(gutters));
  }

  // ── Advanced Layout ──────────────────────────────────────────────────────
  const posSec = renderPositionPatterns(positionPatterns);
  if (posSec) parts.push(posSec);

  const nestSec = renderLayoutNesting(layoutNesting);
  if (nestSec) parts.push(nestSec);

  const varsSec = renderCssSpacingVariables(spacingVariables);
  if (varsSec) parts.push(varsSec);

  // ── Content Patterns ─────────────────────────────────────────────────────
  if (contentSections !== undefined) {
    parts.push('### Content Sections\n\n' + renderContentSections(contentSections));
  }

  if (formLayouts !== undefined) {
    parts.push('### Form Layouts\n\n' + renderFormLayouts(formLayouts));
  }

  return parts.join('\n\n');
}
