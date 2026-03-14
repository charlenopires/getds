/**
 * AI Reconstruction Guide generator
 * Produces a structured Markdown section optimized for LLMs to reconstruct
 * a website from the extracted design system data.
 */

function safeStr(val, fallback = '—') {
  return (val && String(val).trim()) ? String(val).trim() : fallback;
}

function renderBrandIdentity(semanticRoles, typographyRoles, borderRadii) {
  const primary = safeStr(semanticRoles?.brandPrimary ?? semanticRoles?.interactivePrimary);
  const bg = safeStr(semanticRoles?.pageBackground);
  const textColor = safeStr(semanticRoles?.textDefault);

  // Infer theme
  let theme = 'unknown';
  if (bg !== '—') {
    const hex = bg.replace('#', '');
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      theme = luminance > 0.5 ? 'light' : 'dark';
    }
  }

  // Infer style (sharp/rounded/pill)
  let borderStyle = 'unknown';
  if (Array.isArray(borderRadii) && borderRadii.length > 0) {
    const maxRadius = Math.max(...borderRadii.map(r => {
      const m = String(r.value ?? r).match(/^([\d.]+)/);
      return m ? parseFloat(m[1]) : 0;
    }));
    if (maxRadius === 0) borderStyle = 'sharp (no border-radius)';
    else if (maxRadius >= 50) borderStyle = 'pill / fully-rounded';
    else if (maxRadius >= 12) borderStyle = 'rounded (large radius)';
    else borderStyle = 'subtly rounded';
  }

  const h1 = typographyRoles?.h1;
  const body = typographyRoles?.body;
  const primaryFont = h1?.fontFamily ?? body?.fontFamily ?? '—';

  const lines = [
    `- **Brand color**: \`${primary}\``,
    `- **Page background**: \`${bg}\``,
    `- **Default text color**: \`${textColor}\``,
    `- **Theme**: ${theme}`,
    `- **Primary font**: ${primaryFont}`,
    `- **Visual style**: ${borderStyle}`,
  ];

  return lines.join('\n');
}

function renderColorUsageMap(semanticRoles) {
  if (!semanticRoles) return '_No semantic color roles detected._';

  const rows = [
    ['pageBackground', semanticRoles.pageBackground, 'Page/body background'],
    ['surfaceBackground', semanticRoles.surfaceBackground, 'Cards, panels, modals'],
    ['brandPrimary', semanticRoles.brandPrimary, 'Brand accent, highlights'],
    ['textDefault', semanticRoles.textDefault, 'Primary text, headings'],
    ['textMuted', semanticRoles.textMuted, 'Secondary text, placeholders'],
    ['borderDefault', semanticRoles.borderDefault, 'Borders, dividers'],
    ['interactivePrimary', semanticRoles.interactivePrimary, 'Primary buttons, links, CTA'],
  ].filter(([, val]) => val);

  if (rows.length === 0) return '_No semantic color roles detected._';

  const header = '| Role | Value | Use it for |\n|------|-------|------------|';
  const tableRows = rows.map(([role, val, usage]) => `| \`${role}\` | \`${val}\` | ${usage} |`);
  return header + '\n' + tableRows.join('\n');
}

function renderTypographyReference(typographyRoles) {
  if (!typographyRoles || Object.keys(typographyRoles).length === 0) {
    return '_No typography roles detected._';
  }

  const ORDER = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'small', 'code'];
  const present = ORDER.filter(k => typographyRoles[k]);

  const header = '| Element | Font | Size | Weight | Line Height | Color |\n|---------|------|------|--------|-------------|-------|';
  const rows = present.map(role => {
    const t = typographyRoles[role];
    const fontName = (t.fontFamily ?? '—').split(',')[0].replace(/['"]/g, '').trim();
    return `| \`${role}\` | ${fontName} | ${t.fontSize ?? '—'} | ${t.fontWeight ?? '—'} | ${t.lineHeight ?? '—'} | \`${t.color ?? '—'}\` |`;
  });

  return header + '\n' + rows.join('\n');
}

function renderButtonProfiles(buttons) {
  if (!Array.isArray(buttons) || buttons.length === 0) {
    return '_No button variants detected._';
  }

  // Sort by instanceCount descending, take top 5
  const topVariants = [...buttons]
    .sort((a, b) => (b.instanceCount || 0) - (a.instanceCount || 0))
    .slice(0, 5);

  const header = '| # | Background | Text Color | Border | Radius | Padding | Instances |\n|---|------------|------------|--------|--------|---------|-----------|';
  const rows = topVariants.map((b, i) => {
    const bg = safeStr(b.backgroundColor);
    const fg = safeStr(b.color);
    const border = safeStr(b.border);
    const radius = safeStr(b.borderRadius);
    const padding = safeStr(b.padding);
    const count = b.instanceCount ?? 1;
    return `| ${i + 1} | \`${bg}\` | \`${fg}\` | \`${border}\` | \`${radius}\` | \`${padding}\` | ${count} |`;
  });

  return header + '\n' + rows.join('\n');
}

function renderInputProfile(inputs) {
  if (!Array.isArray(inputs) || inputs.length === 0) {
    return '_No input styles detected._';
  }

  const textInputs = inputs.filter(i => ['text', 'email', 'password', 'search', 'textarea'].includes(i.type ?? i.tag));
  const sample = textInputs[0] ?? inputs[0];

  const lines = [
    `- **Background**: \`${safeStr(sample.backgroundColor)}\``,
    `- **Border**: \`${safeStr(sample.border)}\``,
    `- **Border radius**: \`${safeStr(sample.borderRadius)}\``,
    `- **Padding**: \`${safeStr(sample.padding)}\``,
    `- **Font size**: \`${safeStr(sample.fontSize)}\``,
    `- **Text color**: \`${safeStr(sample.color)}\``,
  ];

  return lines.join('\n');
}

function renderCardProfile(cards) {
  if (!Array.isArray(cards) || cards.length === 0) {
    return '_No card visual profile detected._';
  }

  const sample = cards[0];
  const lines = [
    `- **Background**: \`${safeStr(sample.backgroundColor)}\``,
    `- **Border**: \`${safeStr(sample.border)}\``,
    `- **Border radius**: \`${safeStr(sample.borderRadius)}\``,
    `- **Box shadow**: \`${safeStr(sample.boxShadow)}\``,
    `- **Padding**: \`${safeStr(sample.padding)}\``,
  ];

  return lines.join('\n');
}

function renderSpacingRhythm(spacing) {
  if (!Array.isArray(spacing) || spacing.length === 0) {
    return '_No spacing data detected._';
  }

  const sorted = [...spacing].sort((a, b) => {
    const aPx = parseFloat(String(a.value ?? a).replace(/[^0-9.]/g, '')) || 0;
    const bPx = parseFloat(String(b.value ?? b).replace(/[^0-9.]/g, '')) || 0;
    return aPx - bPx;
  });

  const base = sorted[0];
  const basePx = parseFloat(String(base?.value ?? base).replace(/[^0-9.]/g, '')) || 4;

  const common = sorted.slice(0, 8).map(s => {
    const val = s.value ?? s;
    const px = parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
    const mult = basePx > 0 ? Math.round(px / basePx) : 1;
    return `\`${val}\` (${mult}×)`;
  });

  return `- **Base unit**: \`${base?.value ?? base ?? '?'}\`\n- **Common values**: ${common.join(', ')}`;
}

/**
 * Generate the AI Reconstruction Guide section.
 *
 * @param {object} payload - Full extraction payload (all 7 layers)
 * @returns {string} Markdown section
 */
export function generateAiReconstructionGuide(payload = {}) {
  const vf = payload['visual-foundations'] ?? {};
  const components = payload['components'] ?? {};
  const semanticRoles = components.semanticColorRoles ?? {};
  const typographyRoles = vf.typographyRoles ?? {};

  const parts = [];

  parts.push('> **Purpose**: Use this section to reconstruct a faithful HTML+CSS replica of this design system. All values are computed from the live page.');

  parts.push('#### Brand Identity\n\n' + renderBrandIdentity(semanticRoles, typographyRoles, vf.borderRadii));

  parts.push('#### Color Usage Map\n\n' + renderColorUsageMap(semanticRoles));

  parts.push('#### Typography Quick Reference\n\n' + renderTypographyReference(typographyRoles));

  parts.push('#### Button Visual Profiles\n\n' + renderButtonProfiles(components.buttons));

  parts.push('#### Input Style Profile\n\n' + renderInputProfile(components.inputs));

  parts.push('#### Card Visual Profile\n\n' + renderCardProfile(components.cards));

  parts.push('#### Spacing Rhythm\n\n' + renderSpacingRhythm(vf.spacing));

  return parts.join('\n\n');
}
