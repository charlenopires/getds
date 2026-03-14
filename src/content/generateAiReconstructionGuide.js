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

function renderCssVariablesCheatsheet(cssVariables) {
  if (!cssVariables || typeof cssVariables !== 'object') return '_No CSS custom properties found._';
  const vars = Object.entries(cssVariables);
  if (vars.length === 0) return '_No CSS custom properties found._';

  const lines = [':root {'];
  for (const [name, val] of vars.slice(0, 60)) {
    const value = typeof val === 'object' ? (val.resolved ?? val.value ?? '') : val;
    if (value) lines.push(`  ${name}: ${value};`);
  }
  lines.push('}');
  if (vars.length > 60) lines.push(`/* ... and ${vars.length - 60} more */`);

  return '```css\n' + lines.join('\n') + '\n```';
}

function renderColorSystem(colorGroups) {
  if (!colorGroups || colorGroups.length === 0) return '_No color groups available._';

  const parts = [];
  for (const group of colorGroups) {
    const header = `| Hex | Usage Count | CSS Properties |\n|-----|-------------|----------------|`;
    const rows = group.colors.slice(0, 10).map(c => {
      const props = (c.properties ?? [c.property]).filter(Boolean).join(', ');
      return `| \`${c.hex ?? '?'}\` | ${c.count ?? 1} | ${props} |`;
    });
    parts.push(`#### ${group.family.charAt(0).toUpperCase() + group.family.slice(1)}s\n\n${header}\n${rows.join('\n')}`);
  }
  return parts.join('\n\n');
}

function renderTypographyCssSnippet(typographyRoles) {
  if (!typographyRoles || Object.keys(typographyRoles).length === 0) return '_No typography roles detected._';
  const ORDER = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'small', 'code'];
  const present = ORDER.filter(k => typographyRoles[k]);
  if (present.length === 0) return '_No typography roles detected._';

  const lines = [];
  for (const role of present) {
    const t = typographyRoles[role];
    const selector = role === 'body' ? 'body' : role === 'small' ? 'small' : role === 'code' ? 'code, pre' : role;
    const props = [];
    if (t.fontFamily) props.push(`font-family: ${t.fontFamily}`);
    if (t.fontSize) props.push(`font-size: ${t.fontSize}`);
    if (t.fontWeight) props.push(`font-weight: ${t.fontWeight}`);
    if (t.lineHeight) props.push(`line-height: ${t.lineHeight}`);
    if (t.color) props.push(`color: ${t.color}`);
    lines.push(`${selector} { ${props.join('; ')}; }`);
  }
  return '```css\n' + lines.join('\n') + '\n```';
}

function renderElevationCss(tokens) {
  if (!tokens || typeof tokens !== 'object') return '_No elevation data._';
  const shadows = Object.entries(tokens).filter(([, t]) => t.$type === 'shadow');
  if (shadows.length === 0) return '_No elevation tokens._';

  const lines = shadows.map(([name, t]) => {
    let val;
    if (typeof t.$value === 'string') {
      val = t.$value;
    } else if (t.$value && typeof t.$value === 'object') {
      const s = t.$value;
      val = `${s.offsetX?.value ?? 0}px ${s.offsetY?.value ?? 0}px ${s.blur?.value ?? 0}px ${s.spread?.value ?? 0}px ${s.color ?? '#000'}`;
    } else {
      val = 'none';
    }
    return `  --${name}: ${val};`;
  });

  return '```css\n:root {\n' + lines.join('\n') + '\n}\n```';
}

function renderSpacingCss(tokens) {
  if (!tokens || typeof tokens !== 'object') return '_No spacing tokens._';
  const entries = Object.entries(tokens);
  if (entries.length === 0) return '_No spacing tokens._';
  const lines = entries.map(([name, t]) => `  --${name}: ${t.$value};`);
  return '```css\n:root {\n' + lines.join('\n') + '\n}\n```';
}

function renderBorderCss(borderTokens, radiusTokens) {
  const lines = [];
  if (borderTokens && typeof borderTokens === 'object') {
    const borders = Object.entries(borderTokens).filter(([, t]) => t.$type === 'border');
    for (const [name, t] of borders) {
      lines.push(`  --${name}: ${t.$value.width} ${t.$value.style} ${t.$value.color};`);
    }
  }
  if (radiusTokens && typeof radiusTokens === 'object') {
    for (const [name, t] of Object.entries(radiusTokens)) {
      lines.push(`  --${name}: ${t.$value};`);
    }
  }
  if (lines.length === 0) return '_No border data._';
  return '```css\n:root {\n' + lines.join('\n') + '\n}\n```';
}

function renderComponentRecipes(components) {
  const parts = [];
  if (Array.isArray(components.buttons) && components.buttons.length > 0) {
    const btn = components.buttons[0];
    const props = [];
    if (btn.backgroundColor) props.push(`  background-color: ${btn.backgroundColor};`);
    if (btn.color) props.push(`  color: ${btn.color};`);
    if (btn.padding) props.push(`  padding: ${btn.padding};`);
    if (btn.borderRadius) props.push(`  border-radius: ${btn.borderRadius};`);
    if (btn.border) props.push(`  border: ${btn.border};`);
    if (btn.fontWeight) props.push(`  font-weight: ${btn.fontWeight};`);
    if (btn.fontSize) props.push(`  font-size: ${btn.fontSize};`);
    if (props.length > 0) parts.push('```css\n.btn-primary {\n' + props.join('\n') + '\n}\n```');
  }
  if (Array.isArray(components.cards) && components.cards.length > 0) {
    const card = components.cards[0];
    const props = [];
    if (card.backgroundColor) props.push(`  background-color: ${card.backgroundColor};`);
    if (card.borderRadius) props.push(`  border-radius: ${card.borderRadius};`);
    if (card.boxShadow) props.push(`  box-shadow: ${card.boxShadow};`);
    if (card.padding) props.push(`  padding: ${card.padding};`);
    if (card.border) props.push(`  border: ${card.border};`);
    if (props.length > 0) parts.push('```css\n.card {\n' + props.join('\n') + '\n}\n```');
  }
  if (Array.isArray(components.inputs) && components.inputs.length > 0) {
    const inp = components.inputs[0];
    const props = [];
    if (inp.backgroundColor) props.push(`  background-color: ${inp.backgroundColor};`);
    if (inp.border) props.push(`  border: ${inp.border};`);
    if (inp.borderRadius) props.push(`  border-radius: ${inp.borderRadius};`);
    if (inp.padding) props.push(`  padding: ${inp.padding};`);
    if (inp.fontSize) props.push(`  font-size: ${inp.fontSize};`);
    if (inp.color) props.push(`  color: ${inp.color};`);
    if (props.length > 0) parts.push('```css\ninput, textarea {\n' + props.join('\n') + '\n}\n```');
  }
  return parts.length > 0 ? parts.join('\n\n') : '_No component recipes available._';
}

function renderFrameworkContext(framework) {
  if (!framework?.frameworks?.length) return '';
  const fw = framework.frameworks[0];
  const signalStr = fw.signals?.slice(0, 5).join('; ') ?? '';
  return `This site uses **${fw.name}** (confidence: ${fw.confidence}%).\nDetected signals: ${signalStr}`;
}

function renderFontLoadingInstructions(fontSources) {
  if (!fontSources || fontSources.length === 0) return '_No external font sources detected._';
  const lines = fontSources.map(s => {
    if (s.provider === 'Google Fonts') {
      return `\`\`\`html\n<link href="${s.url}" rel="stylesheet">\n\`\`\``;
    }
    return `- **${s.provider}**: \`${s.url}\``;
  });
  return lines.join('\n\n');
}

function renderLayoutBlueprint(lp) {
  if (!lp?.pageTemplate) return '_No layout blueprint available._';
  const pt = lp.pageTemplate;
  const lines = [];
  if (pt.header) lines.push(`- **Header**: ${pt.header.position ?? 'static'}, height ${pt.header.height ?? '?'}`);
  if (pt.main) lines.push(`- **Main content**: max-width ${pt.main.maxWidth ?? '?'}, padding ${pt.main.padding ?? '?'}`);
  if (pt.footer) lines.push(`- **Footer**: background ${pt.footer.backgroundColor ?? '?'}, padding ${pt.footer.padding ?? '?'}`);
  if (pt.layout) lines.push(`- **Layout type**: ${pt.layout}`);
  return lines.length > 0 ? lines.join('\n') : '_No layout data._';
}

function renderAnimationProfile(anim) {
  if (!anim) return '_No animation data._';
  const lines = [];
  if (Array.isArray(anim.transitions) && anim.transitions.length > 0) {
    const t = anim.transitions[0];
    const val = typeof t === 'string' ? t : t.value ?? t.shorthand ?? '';
    if (val) lines.push(`- **Default transition**: \`${val}\``);
  }
  if (Array.isArray(anim.animations) && anim.animations.length > 0) {
    lines.push(`- **CSS animations**: ${anim.animations.length} detected`);
  }
  if (Array.isArray(anim.transforms) && anim.transforms.length > 0) {
    const sample = anim.transforms.slice(0, 3).map(t => `\`${t.value ?? t}\``).join(', ');
    lines.push(`- **Transform samples**: ${sample}`);
  }
  return lines.length > 0 ? lines.join('\n') : '_No animation data._';
}

function renderInteractionStatesCss(interactionStates) {
  if (!Array.isArray(interactionStates) || interactionStates.length === 0) {
    return '_No interaction state CSS detected._';
  }

  // Group by pseudo-class, take top 10 per group
  const groups = {};
  for (const s of interactionStates) {
    const pc = s.pseudoClass ?? 'unknown';
    if (!groups[pc]) groups[pc] = [];
    if (groups[pc].length < 10) groups[pc].push(s);
  }

  const lines = [];
  for (const [pseudo, rules] of Object.entries(groups)) {
    lines.push(`/* :${pseudo} states */`);
    for (const r of rules) {
      const props = Object.entries(r.styles ?? {})
        .map(([p, v]) => `  ${p}: ${v};`).join('\n');
      if (props) lines.push(`${r.selector ?? '???'} {\n${props}\n}`);
    }
    lines.push('');
  }

  return '```css\n' + lines.join('\n') + '```';
}

function renderDarkModeVariables(colorSchemes) {
  if (!colorSchemes?.dark?.length) return '_No dark mode variables detected._';

  const lines = ['@media (prefers-color-scheme: dark) {', '  :root {'];
  for (const c of colorSchemes.dark.slice(0, 30)) {
    lines.push(`    /* ${c.property} */ --dark-${c.property}: ${c.value};`);
  }
  lines.push('  }', '}');

  return '```css\n' + lines.join('\n') + '\n```';
}

function renderContentSectionMap(contentSections) {
  if (!Array.isArray(contentSections) || contentSections.length === 0) {
    return '_No content sections detected._';
  }

  const ordered = contentSections
    .filter(s => s.pattern !== 'unknown')
    .slice(0, 10);

  if (ordered.length === 0) return '_No recognized content section patterns._';

  return ordered.map((s, i) =>
    `${i + 1}. **${s.pattern}** — \`${(s.selector ?? '—').slice(0, 50)}\` (${Math.round((s.confidence ?? 0) * 100)}%)`
  ).join('\n');
}

function renderGradientTokens(gradients) {
  if (!Array.isArray(gradients) || gradients.length === 0) {
    return '_No gradient tokens._';
  }

  const lines = [':root {'];
  gradients.slice(0, 10).forEach((g, i) => {
    lines.push(`  --gradient-${i + 1}: ${g.value};`);
  });
  lines.push('}');

  return '```css\n' + lines.join('\n') + '\n```';
}

/**
 * Generate the AI Reconstruction Guide section.
 *
 * @param {object} payload - Full extraction payload (all 7 layers)
 * @returns {string} Markdown section
 */
export function generateAiReconstructionGuide(payload = {}) {
  const vf = payload['visual-foundations'] ?? {};
  const tok = payload['tokens'] ?? {};
  const components = payload['components'] ?? {};
  const lp = payload['layout-patterns'] ?? {};
  const anim = payload['animations'] ?? {};
  const semanticRoles = components.semanticColorRoles ?? {};
  const typographyRoles = vf.typographyRoles ?? {};

  const parts = [];

  parts.push('> **Purpose**: Use this section to reconstruct a faithful HTML+CSS replica of this design system. All values are computed from the live page.');

  parts.push('#### Brand Identity\n\n' + renderBrandIdentity(semanticRoles, typographyRoles, vf.borderRadii));

  // Framework context (if detected)
  const fwContext = renderFrameworkContext(tok.framework);
  if (fwContext) parts.push('#### Framework Context\n\n' + fwContext);

  // CSS Variables Cheatsheet
  parts.push('#### CSS Variables Cheatsheet\n\n' + renderCssVariablesCheatsheet(vf.cssVariables));

  parts.push('#### Color Usage Map\n\n' + renderColorUsageMap(semanticRoles));

  // Complete Color System (grouped by hue)
  if (tok._meta?.colorGroups?.length > 0) {
    parts.push('#### Complete Color System\n\n' + renderColorSystem(tok._meta.colorGroups));
  }

  parts.push('#### Typography Quick Reference\n\n' + renderTypographyReference(typographyRoles));

  // Typography CSS Snippet
  parts.push('#### Typography CSS Snippet\n\n' + renderTypographyCssSnippet(typographyRoles));

  // Elevation System CSS
  parts.push('#### Elevation System CSS\n\n' + renderElevationCss(tok));

  // Spacing Scale CSS
  parts.push('#### Spacing Scale CSS\n\n' + renderSpacingCss(tok.spacing));

  // Border System CSS
  parts.push('#### Border System CSS\n\n' + renderBorderCss(tok.border, tok.radius));

  parts.push('#### Button Visual Profiles\n\n' + renderButtonProfiles(components.buttons));

  parts.push('#### Input Style Profile\n\n' + renderInputProfile(components.inputs));

  parts.push('#### Card Visual Profile\n\n' + renderCardProfile(components.cards));

  // Component Recipes
  parts.push('#### Component Recipes\n\n' + renderComponentRecipes(components));

  parts.push('#### Spacing Rhythm\n\n' + renderSpacingRhythm(vf.spacing));

  // Font Loading Instructions
  if (tok.framework?.fontSources?.length > 0) {
    parts.push('#### Font Loading Instructions\n\n' + renderFontLoadingInstructions(tok.framework.fontSources));
  }

  // Layout Blueprint
  parts.push('#### Layout Blueprint\n\n' + renderLayoutBlueprint(lp));

  // Animation & Motion Profile
  parts.push('#### Animation & Motion Profile\n\n' + renderAnimationProfile(anim));

  // Interaction States CSS
  const interactionStates = components.interactionStates ?? [];
  if (interactionStates.length > 0) {
    parts.push('#### Interaction States CSS\n\n' + renderInteractionStatesCss(interactionStates));
  }

  // Dark Mode Variables
  const colorSchemes = vf.colorSchemes ?? {};
  if (colorSchemes.dark?.length > 0) {
    parts.push('#### Dark Mode Variables\n\n' + renderDarkModeVariables(colorSchemes));
  }

  // Content Section Map
  const contentSections = lp.contentSections ?? [];
  if (contentSections.length > 0) {
    parts.push('#### Content Section Map\n\n' + renderContentSectionMap(contentSections));
  }

  // Gradient Tokens
  const gradients = vf.gradients ?? [];
  if (gradients.length > 0) {
    parts.push('#### Gradient Tokens\n\n' + renderGradientTokens(gradients));
  }

  return parts.join('\n\n');
}
