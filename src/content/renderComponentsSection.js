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

  const totalInstances = buttons.reduce((sum, b) => sum + (b.instanceCount || 1), 0);

  // Check if buttons have visual style data
  const hasVisualData = buttons.some(b => b.backgroundColor && b.backgroundColor !== 'rgba(0, 0, 0, 0)');

  const parts = [];

  parts.push(`- **Total instances**: ${totalInstances}\n- **Distinct visual variants**: ${buttons.length}`);

  if (hasVisualData) {
    // Visual variants table
    const sorted = [...buttons].sort((a, b) => (b.instanceCount || 0) - (a.instanceCount || 0)).slice(0, 8);
    const variantRows = sorted.map((b, i) => {
      const bg     = b.backgroundColor ?? '—';
      const fg     = b.color ?? '—';
      const border = b.border ?? '—';
      const radius = b.borderRadius ?? '—';
      const pad    = b.padding ?? '—';
      const fw     = b.fontWeight ?? '—';
      const count  = b.instanceCount ?? 1;
      return `| ${i + 1} | \`${bg}\` | \`${fg}\` | \`${border}\` | \`${radius}\` | \`${pad}\` | ${fw} | ${count} |`;
    });

    parts.push(
      '#### Visual Variants\n\n' +
      '| # | Background | Text | Border | Radius | Padding | Weight | Instances |\n' +
      '|---|------------|------|--------|--------|---------|--------|-----------|\n' +
      variantRows.join('\n')
    );
  }

  // Per-tag breakdown
  const byTag = {};
  for (const b of buttons) {
    const tag = b.tag ?? 'unknown';
    byTag[tag] = (byTag[tag] || 0) + (b.instanceCount || 1);
  }

  const tagRows = Object.entries(byTag)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => `| \`<${tag}>\` | ${count} |`);

  parts.push(
    '#### By Element Type\n\n' +
    '| Element | Count |\n' +
    '|---------|-------|\n' +
    tagRows.join('\n')
  );

  // Class-based variant detection
  const allClasses = new Set();
  for (const b of buttons) {
    if (b.classes) b.classes.forEach(c => allClasses.add(c));
  }

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

  if (detectedVariants.length > 0) {
    parts.push(`- **Class-detected variants**: ${detectedVariants.join(', ')}`);
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

  const totalInstances = inputs.reduce((sum, i) => sum + (i.instanceCount || 1), 0);
  const parts = [];
  parts.push(`- **Total inputs**: ${totalInstances}\n- **Distinct visual variants**: ${inputs.length}`);

  // Check if we have visual data
  const hasVisualData = inputs.some(i => i.border || i.borderRadius);

  if (hasVisualData) {
    const textInput = inputs.find(i => ['text', 'email', 'search', 'password', 'textarea'].includes(i.type ?? i.tag)) ?? inputs[0];
    if (textInput) {
      const profileLines = [
        `- **Background**: \`${textInput.backgroundColor ?? '—'}\``,
        `- **Border**: \`${textInput.border ?? '—'}\``,
        `- **Border radius**: \`${textInput.borderRadius ?? '—'}\``,
        `- **Padding**: \`${textInput.padding ?? '—'}\``,
        `- **Font size**: \`${textInput.fontSize ?? '—'}\``,
        `- **Text color**: \`${textInput.color ?? '—'}\``,
      ];
      parts.push('#### Text Input Visual Style\n\n' + profileLines.join('\n'));
    }
  }

  // Group by type
  const byType = {};
  for (const inp of inputs) {
    const type = inp.type ?? inp.tag ?? 'text';
    byType[type] = (byType[type] || 0) + (inp.instanceCount || 1);
  }

  const rows = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `| \`${type}\` | ${count} |`);

  parts.push(
    '#### By Input Type\n\n' +
    '| Type | Count |\n' +
    '|------|-------|\n' +
    rows.join('\n')
  );

  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// Navigation renderer
// ---------------------------------------------------------------------------

function renderNavigation(navigation) {
  if (!navigation || (Array.isArray(navigation) && navigation.length === 0)) {
    return '_No navigation components detected._';
  }

  const items = Array.isArray(navigation) ? navigation : Object.values(navigation);
  if (items.length === 0) return '_No navigation components detected._';

  const parts = [];
  parts.push(`- **Navigation landmarks found**: ${items.length}`);

  // Show header/nav visual profile if available
  const headerItem = items.find(i => i.navType === 'header' || i.navType === 'nav');
  if (headerItem && (headerItem.backgroundColor || headerItem.height)) {
    const profileLines = [
      `- **Background**: \`${headerItem.backgroundColor ?? '—'}\``,
      `- **Position**: \`${headerItem.position ?? '—'}\``,
      `- **Height**: \`${headerItem.height ?? '—'}\``,
      `- **Border bottom**: \`${headerItem.borderBottom ?? '—'}\``,
    ];
    parts.push('#### Header/Nav Visual Profile\n\n' + profileLines.join('\n'));
  }

  const rows = items.slice(0, 20).map(item => {
    const tag      = item.tag     ?? item.element ?? '—';
    const role     = item.role    ?? '—';
    const navType  = item.navType ?? '—';
    const height   = item.height  ?? '—';
    return `| \`<${tag}>\` | ${role} | ${navType} | ${height} |`;
  });

  parts.push(
    '#### Navigation Elements\n\n' +
    '| Element | Role | Type | Height |\n' +
    '|---------|------|------|--------|\n' +
    rows.join('\n')
  );

  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// Cards renderer
// ---------------------------------------------------------------------------

function renderCards(cards) {
  if (!Array.isArray(cards) || cards.length === 0) {
    return '_No card components detected._';
  }

  const parts = [];
  parts.push(`- **Card groups detected**: ${cards.length}`);

  // Check if we have visual data
  const hasVisualData = cards.some(c => c.backgroundColor || c.borderRadius);

  if (hasVisualData) {
    const sample = cards[0];
    const profileLines = [
      `- **Background**: \`${sample.backgroundColor ?? '—'}\``,
      `- **Border**: \`${sample.border ?? '—'}\``,
      `- **Border radius**: \`${sample.borderRadius ?? '—'}\``,
      `- **Box shadow**: \`${sample.boxShadow ?? '—'}\``,
      `- **Padding**: \`${sample.padding ?? '—'}\``,
    ];
    parts.push('#### Representative Card Visual Profile\n\n' + profileLines.join('\n'));
  }

  const rows = cards.slice(0, 15).map(card => {
    const tag       = card.tag       ?? '—';
    const parentTag = card.parentTag ?? '—';
    const instances = card.instanceCount ?? 1;
    const hasImage  = card.hasImage  ? '✅' : '❌';
    const hasAction = card.hasAction ? '✅' : '❌';
    const classes   = Array.isArray(card.classes)
      ? card.classes.slice(0, 3).join(', ')
      : '—';
    return `| \`<${tag}>\` | \`<${parentTag}>\` | ${instances} | ${hasImage} | ${hasAction} | ${classes} |`;
  });

  parts.push(
    '#### All Card Groups\n\n' +
    '| Element | Parent | Instances | Has Image | Has Action | Classes |\n' +
    '|---------|--------|-----------|-----------|------------|--------|\n' +
    rows.join('\n')
  );

  return parts.join('\n\n');
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
