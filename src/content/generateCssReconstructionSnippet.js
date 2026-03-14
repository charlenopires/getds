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

  // ── @import rules for Google Fonts ──
  const fontSources = vf.fontSources ?? [];
  const googleImports = fontSources.filter(s => s.provider === 'google-fonts' && s.url);
  const seenImports = new Set();
  for (const s of googleImports) {
    if (seenImports.has(s.url)) continue;
    seenImports.add(s.url);
    lines.push(`@import url('${s.url}');`);
  }
  if (googleImports.length > 0) lines.push('');

  // ── @font-face blocks for self-hosted fonts ──
  const fontFaceRules = vf.fontFaceRules ?? [];
  const selfHostedRules = fontFaceRules.filter(rule => {
    const src = fontSources.find(s => s.family === rule.fontFamily);
    return !src || src.provider === 'self-hosted';
  });
  for (const rule of selfHostedRules.slice(0, 10)) {
    lines.push('@font-face {');
    lines.push(`  font-family: '${rule.fontFamily}';`);
    if (rule.sources?.length > 0) {
      const srcParts = rule.sources.map(s => {
        let p = `url('${s.url}')`;
        if (s.format) p += ` format('${s.format}')`;
        return p;
      });
      lines.push(`  src: ${srcParts.join(', ')};`);
    }
    if (rule.fontWeight) lines.push(`  font-weight: ${rule.fontWeight};`);
    if (rule.fontStyle && rule.fontStyle !== 'normal') lines.push(`  font-style: ${rule.fontStyle};`);
    if (rule.fontDisplay) lines.push(`  font-display: ${rule.fontDisplay};`);
    lines.push('}');
    lines.push('');
  }

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

  // ── Gradient custom properties ──
  const gradients = vf.gradients ?? [];
  if (gradients.length > 0) {
    lines.push('  /* Gradients */');
    gradients.slice(0, 10).forEach((g, i) => {
      lines.push(`  --gradient-${i + 1}: ${g.value};`);
    });
    lines.push('');
  }

  // ── Z-index scale ──
  const zIndexLayers = vf.zIndexLayers ?? [];
  if (zIndexLayers.length > 0) {
    lines.push('  /* Z-Index Scale */');
    for (const z of zIndexLayers) {
      lines.push(`  --z-${z.inferredRole ?? 'layer'}-${z.value}: ${z.value};`);
    }
    lines.push('');
  }

  // ── Motion tokens ──
  const anim = payload['animations'] ?? {};
  const motionDurations = new Set();
  const motionEasings = new Set();

  for (const a of (Array.isArray(anim.animations) ? anim.animations : [])) {
    if (a.duration && a.duration !== '0s') motionDurations.add(a.duration);
    if (a.timingFunction && a.timingFunction !== 'ease') motionEasings.add(a.timingFunction);
  }
  for (const t of (Array.isArray(anim.transitions) ? anim.transitions : [])) {
    const dur = t.duration ?? t.transitionDuration;
    if (dur && dur !== '0s') motionDurations.add(dur);
    const easing = t.timingFunction ?? t.easing;
    if (easing && easing !== 'ease') motionEasings.add(easing);
  }

  if (motionDurations.size > 0 || motionEasings.size > 0) {
    lines.push('');
    lines.push('  /* Motion */');
    let di = 1;
    for (const d of [...motionDurations].sort()) {
      lines.push(`  --motion-duration-${di++}: ${d};`);
    }
    let ei = 1;
    for (const e of motionEasings) {
      lines.push(`  --motion-easing-${ei++}: ${e};`);
    }
    lines.push('');
  }

  lines.push('}');

  // ── 3D Perspective Containers ──
  const css3DScenes = anim.css3DScenes ?? [];
  if (css3DScenes.length > 0) {
    lines.push('');
    lines.push('  /* 3D Perspective Containers */');
    for (const scene of css3DScenes.slice(0, 10)) {
      if (scene.perspective) lines.push(`  --perspective-${scene.selector.replace(/[^a-zA-Z0-9-]/g, '-')}: ${scene.perspective};`);
    }
    lines.push('');
  }

  // ── 3D Transform custom properties ──
  const animations3D = anim.animations3D ?? [];
  if (animations3D.length > 0) {
    lines.push('  /* 3D Animations */');
    const seen3D = new Set();
    for (const a of animations3D.slice(0, 10)) {
      const key = `${a.type}-${a.axes.join('-')}`;
      if (seen3D.has(key)) continue;
      seen3D.add(key);
      lines.push(`  --3d-${a.type}: ${a.transforms.join(', ')};`);
    }
    lines.push('');
  }

  // ── @keyframes definitions ──
  const keyframes = Array.isArray(anim.keyframes) ? anim.keyframes : [];
  if (keyframes.length > 0) {
    lines.push('');
    lines.push('/* Keyframe Animations */');
    for (const kf of keyframes.slice(0, 10)) {
      lines.push(`@keyframes ${kf.name} {`);
      for (const stop of (kf.stops ?? [])) {
        const props = Object.entries(stop.styles ?? {})
          .map(([p, v]) => `${p}: ${v}`)
          .join('; ');
        lines.push(`  ${stop.key} { ${props}; }`);
      }
      lines.push('}');
    }
  }

  // ── @media (prefers-reduced-motion) ──
  const reducedMotion = anim.reducedMotion;
  if (reducedMotion && reducedMotion.assessment !== 'Excellent') {
    lines.push('');
    lines.push('/* Reduced Motion (recommended) */');
    lines.push('@media (prefers-reduced-motion: reduce) {');
    lines.push('  *, *::before, *::after {');
    lines.push('    animation-duration: 0.01ms !important;');
    lines.push('    animation-iteration-count: 1 !important;');
    lines.push('    transition-duration: 0.01ms !important;');
    lines.push('    scroll-behavior: auto !important;');
    lines.push('  }');
    lines.push('}');
  }

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
      if (t.fontStyle && t.fontStyle !== 'normal') {
        props.push(`  font-style: ${t.fontStyle};`);
      }
      if (t.fontVariant && t.fontVariant !== 'normal') {
        props.push(`  font-variant: ${t.fontVariant};`);
      }
      if (t.textDecoration && t.textDecoration !== 'none' && !t.textDecoration.startsWith('none ')) {
        props.push(`  text-decoration: ${t.textDecoration};`);
      }
      if (t.color) props.push(`  color: ${t.color};`);
      if (props.length > 0) {
        lines.push(`${selector} { ${props.map(p => p.trim()).join(' ')} }`);
      }
    }
  }

  // ── Dark mode block ──
  const colorSchemes = vf.colorSchemes ?? {};
  if (colorSchemes.dark?.length > 0) {
    lines.push('');
    lines.push('/* Dark Mode */');
    lines.push('@media (prefers-color-scheme: dark) {');
    lines.push('  :root {');
    for (const c of colorSchemes.dark.slice(0, 30)) {
      lines.push(`    --dark-${c.property}: ${c.value};`);
    }
    lines.push('  }');
    lines.push('}');
  }

  // ── Interaction state CSS ──
  const interactionStates = comp.interactionStates ?? [];
  if (interactionStates.length > 0) {
    lines.push('');
    lines.push('/* Interaction States */');
    for (const state of interactionStates.slice(0, 15)) {
      const props = Object.entries(state.styles ?? {})
        .map(([p, v]) => `  ${p}: ${v};`).join('\n');
      if (props) {
        lines.push(`${state.selector ?? '???'} {`);
        lines.push(props);
        lines.push('}');
      }
    }
  }

  // ── ::selection styles ──
  const selectionStyles = vf.selectionStyles;
  if (selectionStyles) {
    lines.push('');
    lines.push('/* Selection Styles */');
    lines.push('::selection {');
    lines.push(`  background-color: ${selectionStyles.backgroundColor};`);
    lines.push(`  color: ${selectionStyles.color};`);
    lines.push('}');
  }

  // ── Pseudo-element CSS (top 5 most impactful) ──
  const pseudoElements = vf.pseudoElements ?? [];
  const impactful = pseudoElements.filter(pe => pe.isPurelyDecorative && Object.keys(pe.styles).length >= 2).slice(0, 5);
  if (impactful.length > 0) {
    lines.push('');
    lines.push('/* Decorative Pseudo-Elements */');
    for (const pe of impactful) {
      lines.push(`${pe.selector}${pe.pseudo} {`);
      lines.push(`  content: ${pe.content};`);
      for (const [prop, val] of Object.entries(pe.styles)) {
        lines.push(`  ${prop}: ${val};`);
      }
      lines.push('}');
    }
  }

  // ── Atmospheric effect CSS ──
  const atmosphericEffects = vf.atmosphericEffects ?? [];
  if (atmosphericEffects.length > 0) {
    lines.push('');
    lines.push('/* Atmospheric Effects */');
    for (const e of atmosphericEffects.slice(0, 3)) {
      lines.push(`.atmospheric-${e.classification} {`);
      if (e.blurAmount > 0) lines.push(`  filter: blur(${e.blurAmount}px);`);
      if (e.opacity < 1) lines.push(`  opacity: ${e.opacity};`);
      if (e.color) lines.push(`  background-color: ${e.color};`);
      if (e.backgroundImage) lines.push(`  background-image: ${e.backgroundImage};`);
      lines.push(`  pointer-events: ${e.pointerEvents};`);
      lines.push(`  width: ${e.width}px;`);
      lines.push(`  height: ${e.height}px;`);
      lines.push('}');
    }
  }

  // ── Hover choreography CSS ──
  const choreography = (payload['animations'] ?? {}).choreography;
  if (choreography?.hoverChoreography?.length > 0) {
    lines.push('');
    lines.push('/* Hover Choreography */');
    for (const h of choreography.hoverChoreography.slice(0, 5)) {
      for (const child of h.affectedChildren) {
        lines.push(`${h.triggerSelector}:hover ${child.selector} {`);
        for (const [prop, val] of Object.entries(child.properties)) {
          lines.push(`  ${prop}: ${val.to ?? val};`);
        }
        if (child.transition) lines.push(`  transition: ${child.transition};`);
        lines.push('}');
      }
    }
  }

  // ── Display typography CSS ──
  const artDirection = vf.artDirection;
  if (artDirection?.artDirectedElements?.length > 0) {
    const displayEls = artDirection.artDirectedElements.filter(e => e.displayScore >= 50).slice(0, 3);
    if (displayEls.length > 0) {
      lines.push('');
      lines.push('/* Display Typography */');
      for (const el of displayEls) {
        lines.push(`${el.selector} {`);
        lines.push(`  font-size: ${el.fontSize};`);
        lines.push(`  font-weight: ${el.fontWeight};`);
        if (el.leadingRatio < 1.2) lines.push(`  line-height: ${el.leadingRatio};`);
        if (el.trackingEm !== 0) lines.push(`  letter-spacing: ${el.trackingEm}em;`);
        if (el.textEffects?.textStroke) lines.push(`  -webkit-text-stroke: ${el.textEffects.textStroke};`);
        if (el.textEffects?.textShadow) lines.push(`  text-shadow: ${el.textEffects.textShadow};`);
        if (el.textEffects?.backgroundClipText) {
          lines.push('  -webkit-background-clip: text;');
          lines.push('  background-clip: text;');
        }
        lines.push('}');
      }
    }
  }

  // ── Custom cursor CSS ──
  const uxRefinements = vf.uxRefinements;
  if (uxRefinements?.customCursors?.length > 0) {
    lines.push('');
    lines.push('/* Custom Cursors */');
    for (const c of uxRefinements.customCursors.filter(c => c.type === 'css-url').slice(0, 3)) {
      lines.push(`${c.selector} { cursor: ${c.value}; }`);
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
