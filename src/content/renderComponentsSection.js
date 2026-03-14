/**
 * Components section renderer — Layer 3
 *
 * Produces detailed, human-readable Markdown for:
 *   - Component inventory table
 *   - Button analysis (variants, elements, types)
 *   - Form inputs analysis
 *   - Navigation analysis
 *   - Cards analysis
 *   - Modals analysis
 */

// ---------------------------------------------------------------------------
// Button renderer
// ---------------------------------------------------------------------------

function renderButtons(buttons) {
  if (!Array.isArray(buttons) || buttons.length === 0) {
    return '_No buttons detected._';
  }

  // Aggregate: count by tag, collect unique classes and types
  const byTag = {};
  const allClasses = new Set();
  const allTypes   = new Set();

  for (const b of buttons) {
    const tag = b.tag ?? 'unknown';
    if (!byTag[tag]) byTag[tag] = 0;
    byTag[tag]++;
    if (b.classes) b.classes.forEach(c => allClasses.add(c));
    if (b.type) allTypes.add(b.type);
  }

  // Detect variants from class names
  const variantPatterns = [
    { label: 'Primary',   re: /primary|--primary/i },
    { label: 'Secondary', re: /secondary|--secondary/i },
    { label: 'Danger',    re: /danger|destructive|error/i },
    { label: 'Ghost',     re: /ghost|outline|tertiary/i },
    { label: 'Icon-only', re: /icon(-only)?$/i },
    { label: 'Link',      re: /link/i },
  ];

  const detectedVariants = variantPatterns
    .filter(v => [...allClasses].some(c => v.re.test(c)))
    .map(v => v.label);

  const parts = [];

  parts.push(
    `- **Total instances**: ${buttons.length}\n` +
    `- **Detected variants**: ${detectedVariants.length > 0 ? detectedVariants.join(', ') : 'default only'}\n` +
    `- **Input types detected**: ${[...allTypes].filter(Boolean).join(', ') || '—'}`
  );

  // Per-tag breakdown
  const tagRows = Object.entries(byTag)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => `| \`<${tag}>\` | ${count} |`);

  parts.push(
    '#### By Element Type\n\n' +
    '| Element | Count |\n' +
    '|---------|-------|\n' +
    tagRows.join('\n')
  );

  // Class-based variant table (top 15 classes)
  const topClasses = [...allClasses]
    .filter(c => c.length > 0)
    .slice(0, 15);

  if (topClasses.length > 0) {
    const classRows = topClasses.map(c => `| \`.${c}\` |`);
    parts.push(
      '#### Detected Classes\n\n' +
      '| Class |\n' +
      '|-------|\n' +
      classRows.join('\n')
    );
  }

  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// Form inputs renderer
// ---------------------------------------------------------------------------

function renderInputs(inputs) {
  if (!Array.isArray(inputs) || inputs.length === 0) {
    return '_No form inputs detected._';
  }

  // Group by type
  const byType = {};
  for (const inp of inputs) {
    const type = inp.type ?? inp.tag ?? 'text';
    if (!byType[type]) byType[type] = 0;
    byType[type]++;
  }

  const rows = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `| \`${type}\` | ${count} |`);

  return (
    `- **Total inputs**: ${inputs.length}\n\n` +
    '#### By Input Type\n\n' +
    '| Type | Count |\n' +
    '|------|-------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Navigation renderer
// ---------------------------------------------------------------------------

function renderNavigation(navigation) {
  if (!navigation || (Array.isArray(navigation) && navigation.length === 0)) {
    return '_No navigation components detected._';
  }

  // navigation can be array or object depending on detectNavigation output
  const items = Array.isArray(navigation) ? navigation : Object.values(navigation);
  if (items.length === 0) return '_No navigation components detected._';

  const rows = items.slice(0, 20).map(item => {
    const tag   = item.tag   ?? item.element ?? '—';
    const role  = item.role  ?? '—';
    const items_ = item.itemCount ?? item.childCount ?? '—';
    return `| \`<${tag}>\` | ${role} | ${items_} |`;
  });

  return (
    `- **Navigation landmarks found**: ${items.length}\n\n` +
    '| Element | Role | Items |\n' +
    '|---------|------|-------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Cards renderer
// ---------------------------------------------------------------------------

function renderCards(cards) {
  if (!Array.isArray(cards) || cards.length === 0) {
    return '_No card components detected._';
  }

  const rows = cards.slice(0, 15).map(card => {
    const tag         = card.tag         ?? '—';
    const parentTag   = card.parentTag   ?? '—';
    const instances   = card.instanceCount ?? 1;
    const hasImage    = card.hasImage   ? '✅' : '❌';
    const hasAction   = card.hasAction  ? '✅' : '❌';
    const classes     = Array.isArray(card.classes)
      ? card.classes.slice(0, 3).join(', ')
      : '—';
    return `| \`<${tag}>\` | \`<${parentTag}>\` | ${instances} | ${hasImage} | ${hasAction} | ${classes} |`;
  });

  return (
    `- **Card groups detected**: ${cards.length}\n\n` +
    '| Element | Parent | Instances | Has Image | Has Action | Classes |\n' +
    '|---------|--------|-----------|-----------|------------|--------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Modals renderer
// ---------------------------------------------------------------------------

function renderModals(modals) {
  if (!Array.isArray(modals) || modals.length === 0) {
    return '_No modal/dialog components detected._';
  }

  const rows = modals.slice(0, 10).map(modal => {
    const tag     = modal.tag   ?? modal.element ?? '—';
    const role    = modal.role  ?? '—';
    const classes = Array.isArray(modal.classes)
      ? modal.classes.slice(0, 3).join(', ')
      : '—';
    return `| \`<${tag}>\` | ${role} | ${classes} |`;
  });

  return (
    `- **Dialog/modal patterns found**: ${modals.length}\n\n` +
    '| Element | Role | Classes |\n' +
    '|---------|------|--------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Component inventory table
// ---------------------------------------------------------------------------

function renderInventory(components) {
  const inventory = [
    { key: 'buttons',    label: 'Button',     icon: '🔘' },
    { key: 'inputs',     label: 'Form Input', icon: '📝' },
    { key: 'navigation', label: 'Navigation', icon: '🗺️' },
    { key: 'cards',      label: 'Card',       icon: '🃏' },
    { key: 'modals',     label: 'Modal',      icon: '🪟' },
  ];

  const rows = inventory.map(({ key, label, icon }) => {
    const data = components[key];
    const count = Array.isArray(data) ? data.length :
                  (data && typeof data === 'object') ? Object.keys(data).length : 0;
    const status = count > 0 ? '✅ Detected' : '—';
    return `| ${icon} **${label}** | ${count} | ${status} |`;
  });

  return (
    '| Component | Instances | Status |\n' +
    '|-----------|-----------|--------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Main renderer
// ---------------------------------------------------------------------------

/**
 * Render the Components layer as rich Markdown.
 *
 * @param {object} data - Components layer payload
 * @returns {string}
 */
export function renderComponentsSection(data = {}) {
  const { buttons, inputs, navigation, cards, modals } = data;

  const parts = [];

  // Overview inventory
  parts.push('### Component Inventory\n\n' + renderInventory(data));

  // Individual sections
  if (buttons !== undefined) {
    parts.push('### Button\n\n' + renderButtons(buttons));
  }

  if (inputs !== undefined) {
    parts.push('### Form Inputs\n\n' + renderInputs(inputs));
  }

  if (navigation !== undefined) {
    parts.push('### Navigation\n\n' + renderNavigation(navigation));
  }

  if (cards !== undefined) {
    parts.push('### Card\n\n' + renderCards(cards));
  }

  if (modals !== undefined) {
    parts.push('### Modal / Dialog\n\n' + renderModals(modals));
  }

  return parts.join('\n\n');
}
