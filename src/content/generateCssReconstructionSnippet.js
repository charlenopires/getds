// ── CSS Reconstruction Snippet Generator ───────────────────────────────
// Produces a complete :root CSS block for LLM-based website reconstruction.

/**
 * Generate a ready-to-paste CSS :root block from the extraction payload.
 *
 * @param {Record<string, object>} payload - Full 7-layer extraction payload
 * @returns {string} CSS string with :root variables
 */
export function generateCssReconstructionSnippet(payload = {}) {
  const vf   = payload['visual-foundations'] ?? {};
  const tok  = payload['tokens'] ?? {};
  const comp = payload['components'] ?? {};
  const meta = payload._meta ?? {};

  const lines = [];
  const siteName = payload._siteName ?? 'Unknown Site';
  const date = new Date().toISOString().split('T')[0];

  lines.push(`/* === Design System: ${siteName} === */`);
  lines.push(`/* Extracted by getds on ${date} */`);
  lines.push('');
  lines.push(':root {');

  // ── CSS Variables (directly from the page) ──
  if (vf.cssVariables && typeof vf.cssVariables === 'object') {
    const vars = Object.entries(vf.cssVariables);
    if (vars.length > 0) {
      lines.push('  /* CSS Custom Properties (from page) */');
      for (const [name, val] of vars.slice(0, 100)) {
        const value = typeof val === 'object' ? (val.resolved ?? val.value ?? '') : val;
        if (value) lines.push(`  ${name}: ${value};`);
      }
      lines.push('');
    }
  }

  // ── Color tokens ──
  if (tok.primitive && typeof tok.primitive === 'object') {
    const colorTokens = Object.entries(tok.primitive).filter(([, t]) => t.$type === 'color');
    if (colorTokens.length > 0) {
      lines.push('  /* Colors */');
      for (const [name, token] of colorTokens.slice(0, 50)) {
        lines.push(`  --${name}: ${token.$value};`);
      }
      lines.push('');
    }
  }

  // ── Spacing tokens ──
  if (tok.spacing && typeof tok.spacing === 'object') {
    const spacingTokens = Object.entries(tok.spacing);
    if (spacingTokens.length > 0) {
      lines.push('  /* Spacing */');
      for (const [name, token] of spacingTokens) {
        lines.push(`  --${name}: ${token.$value};`);
      }
      lines.push('');
    }
  }

  // ── Font Family tokens ──
  if (tok.fontFamily && typeof tok.fontFamily === 'object') {
    const fontTokens = Object.entries(tok.fontFamily);
    if (fontTokens.length > 0) {
      lines.push('  /* Typography */');
      for (const [name, token] of fontTokens) {
        const val = Array.isArray(token.$value) ? token.$value.join(', ') : token.$value;
        lines.push(`  --${name}: ${val};`);
      }
      lines.push('');
    }
  }

  // ── Shadow / Elevation tokens ──
  const elevationSrc = tok.elevation ?? {};
  const elevationEntries = Object.entries(elevationSrc);
  if (elevationEntries.length > 0) {
    lines.push('  /* Shadows */');
    for (const [name, token] of elevationEntries) {
      const val = typeof token.$value === 'string' ? token.$value : formatShadowValue(token.$value);
      lines.push(`  --${name}: ${val};`);
    }
    lines.push('');
  }

  // ── Radius tokens ──
  if (tok.radius && typeof tok.radius === 'object') {
    const radiusTokens = Object.entries(tok.radius);
    if (radiusTokens.length > 0) {
      lines.push('  /* Radii */');
      for (const [name, token] of radiusTokens) {
        lines.push(`  --${name}: ${token.$value};`);
      }
      lines.push('');
    }
  }

  // ── Border tokens ──
  if (tok.border && typeof tok.border === 'object') {
    const borderTokens = Object.entries(tok.border).filter(([, t]) => t.$type === 'border');
    if (borderTokens.length > 0) {
      lines.push('  /* Borders */');
      for (const [name, token] of borderTokens) {
        const v = token.$value;
        lines.push(`  --${name}: ${v.width} ${v.style} ${v.color};`);
      }
      lines.push('');
    }
  }

  // ── Line Height tokens ──
  if (tok.lineHeight && typeof tok.lineHeight === 'object') {
    const lhTokens = Object.entries(tok.lineHeight);
    if (lhTokens.length > 0) {
      lines.push('  /* Line Heights */');
      for (const [name, token] of lhTokens) {
        lines.push(`  --${name}: ${token.$value};`);
      }
      lines.push('');
    }
  }

  lines.push('}');

  // ── Typography CSS ──
  const typographyRoles = vf.typographyRoles ?? {};
  const ORDER = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'small', 'code'];
  const present = ORDER.filter(k => typographyRoles[k]);

  if (present.length > 0) {
    lines.push('');
    lines.push('/* Typography */');
    for (const role of present) {
      const t = typographyRoles[role];
      const selector = role === 'body' ? 'body' : role === 'small' ? 'small' : role === 'code' ? 'code, pre' : role;
      const props = [];
      if (t.fontFamily) props.push(`  font-family: ${t.fontFamily};`);
      if (t.fontSize) props.push(`  font-size: ${t.fontSize};`);
      if (t.fontWeight) props.push(`  font-weight: ${t.fontWeight};`);
      if (t.lineHeight) props.push(`  line-height: ${t.lineHeight};`);
      if (t.letterSpacing && t.letterSpacing !== 'normal' && t.letterSpacing !== '0px') {
        props.push(`  letter-spacing: ${t.letterSpacing};`);
      }
      if (t.color) props.push(`  color: ${t.color};`);
      if (props.length > 0) {
        lines.push(`${selector} { ${props.map(p => p.trim()).join(' ')} }`);
      }
    }
  }

  return lines.join('\n');
}

function formatShadowValue(val) {
  if (!val) return 'none';
  if (Array.isArray(val)) return val.map(formatSingleShadow).join(', ');
  return formatSingleShadow(val);
}

function formatSingleShadow(s) {
  if (typeof s === 'string') return s;
  if (!s || typeof s !== 'object') return 'none';
  const parts = [];
  if (s.inset) parts.push('inset');
  parts.push(`${s.offsetX?.value ?? 0}px`);
  parts.push(`${s.offsetY?.value ?? 0}px`);
  parts.push(`${s.blur?.value ?? 0}px`);
  parts.push(`${s.spread?.value ?? 0}px`);
  parts.push(s.color ?? '#000');
  return parts.join(' ');
}
