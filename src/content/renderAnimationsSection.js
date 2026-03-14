/**
 * Animations section renderer — Layer 5
 *
 * Produces detailed, human-readable Markdown for the full animation layer:
 *   - Overview with library badges
 *   - Animation Libraries
 *   - CSS Animations by Category
 *   - Keyframe Details (full stop tables)
 *   - CSS Transitions
 *   - Animation Triggers
 *   - Web Animations (enhanced)
 *   - Scroll-driven Animations
 *   - SVG Animations
 *   - Motion Paths
 *   - Performance Hints
 *   - Accessibility: Reduced Motion
 *   - Motion Design Tokens (3-tier)
 *   - Animation Reconstruction Snippets
 */

import { generateMotionTokens } from './generateMotionTokens.js';

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

function renderOverview(data) {
  const counts = {
    'Active CSS animations':    Array.isArray(data.animations)       ? data.animations.length       : 0,
    'CSS transitions':          Array.isArray(data.transitions)      ? data.transitions.length      : 0,
    '@keyframes definitions':   Array.isArray(data.keyframes)        ? data.keyframes.length        : 0,
    'CSS transforms':           Array.isArray(data.transforms)       ? data.transforms.length       : 0,
    'Web Animations (JS)':      Array.isArray(data.webAnimations)    ? data.webAnimations.length    : 0,
    'Scroll-driven animations': Array.isArray(data.scrollAnimations) ? data.scrollAnimations.length : 0,
    'Motion paths':             Array.isArray(data.motionPaths)      ? data.motionPaths.length      : 0,
    'will-change hints':        Array.isArray(data.willChangeHints)  ? data.willChangeHints.length  : 0,
    'SVG animations (SMIL)':    Array.isArray(data.svgAnimations)    ? data.svgAnimations.length    : 0,
    'Animation triggers':       Array.isArray(data.triggers)         ? data.triggers.length         : 0,
    '3D signals':               (Array.isArray(data.libraries3D) ? data.libraries3D.length : 0) +
                                (Array.isArray(data.webglCanvases) ? data.webglCanvases.length : 0) +
                                (Array.isArray(data.components3D) ? data.components3D.length : 0) +
                                (Array.isArray(data.css3DScenes) ? data.css3DScenes.length : 0) +
                                (Array.isArray(data.modelFiles) ? data.modelFiles.length : 0) +
                                (Array.isArray(data.animations3D) ? data.animations3D.length : 0),
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const rows = Object.entries(counts).map(([k, v]) => `| ${k} | ${v} |`);

  const parts = [
    `- **Total motion signals**: ${total}`,
  ];

  // Libraries badge
  if (Array.isArray(data.libraries) && data.libraries.length > 0) {
    const libNames = data.libraries.map(l => l.name).join(', ');
    parts.push(`- **Animation libraries**: ${libNames}`);
  }

  // Reduced motion badge
  if (data.reducedMotion) {
    parts.push(`- **prefers-reduced-motion**: ${data.reducedMotion.assessment ?? 'Unknown'}`);
  }

  parts.push(
    '\n| Type | Count |\n|------|-------|\n' + rows.join('\n')
  );

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Animation Libraries
// ---------------------------------------------------------------------------

function renderLibraries(libraries) {
  if (!Array.isArray(libraries) || libraries.length === 0) return '';

  const rows = libraries.map(l => {
    const version = l.version ?? '—';
    const details = [];
    if (l.details?.tweenCount) details.push(`${l.details.tweenCount} tweens`);
    if (l.details?.elementCount) details.push(`${l.details.elementCount} elements`);
    if (l.details?.triggerCount) details.push(`${l.details.triggerCount} triggers`);
    if (l.details?.animationTypes) details.push(`types: ${l.details.animationTypes.join(', ')}`);
    return `| ${l.name} | ${version} | ${details.join('; ') || '—'} |`;
  });

  return (
    '### Animation Libraries\n\n' +
    '| Library | Version | Details |\n' +
    '|---------|---------|--------|\n' +
    rows.join('\n') +
    '\n\n> **Reconstruction note**: Install detected libraries to faithfully reproduce animations.'
  );
}

// ---------------------------------------------------------------------------
// CSS Animations by Category
// ---------------------------------------------------------------------------

function renderCssAnimationsByCategory(animations) {
  if (!Array.isArray(animations) || animations.length === 0) {
    return '### CSS Animations\n\n_No CSS animations detected on visible elements._';
  }

  // Group by category
  const groups = {};
  for (const a of animations) {
    const cat = a.category ?? 'micro-interaction';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(a);
  }

  const categoryOrder = ['entrance', 'exit', 'loading', 'continuous', 'micro-interaction', 'scroll-triggered', 'page-transition'];
  const parts = [`### CSS Animations\n\n- **Active animations**: ${animations.length}`];

  for (const cat of categoryOrder) {
    const items = groups[cat];
    if (!items || items.length === 0) continue;

    const rows = items.map(a => {
      const name     = a.name           ?? '—';
      const duration = a.duration       ?? '—';
      const easing   = a.timingFunction ?? '—';
      const delay    = a.delay          ?? '0s';
      const iter     = a.iterationCount ?? '1';
      const fill     = a.fillMode       ?? 'none';
      return `| \`${name}\` | ${duration} | ${easing} | ${delay} | ${iter} | ${fill} |`;
    });

    parts.push(
      `#### ${capitalize(cat)} (${items.length})\n\n` +
      '| Name | Duration | Easing | Delay | Iterations | Fill Mode |\n' +
      '|------|----------|--------|-------|------------|----------|\n' +
      rows.join('\n')
    );
  }

  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// Keyframe Details
// ---------------------------------------------------------------------------

function renderKeyframeDetails(keyframes) {
  if (!Array.isArray(keyframes) || keyframes.length === 0) {
    return '### Keyframe Definitions\n\n_No `@keyframes` definitions detected._';
  }

  const parts = [`### Keyframe Definitions\n\n- **@keyframes defined**: ${keyframes.length}`];

  for (const kf of keyframes) {
    const name = kf.name ?? '—';
    const stops = kf.stops ?? [];

    if (stops.length === 0) {
      parts.push(`#### \`${name}\`\n\n_No stops found._`);
      continue;
    }

    // Collect all property names across all stops
    const allProps = new Set();
    for (const stop of stops) {
      if (stop.styles) {
        for (const prop of Object.keys(stop.styles)) allProps.add(prop);
      }
    }
    const propList = [...allProps];

    if (propList.length === 0) {
      parts.push(`#### \`${name}\`\n\n_No animated properties found._`);
      continue;
    }

    const header = `| Stop | ${propList.map(p => `\`${p}\``).join(' | ')} |`;
    const sep    = `|------|${propList.map(() => '---').join('|')}|`;

    const rows = stops.map(stop => {
      const key = stop.key ?? '—';
      const vals = propList.map(p => {
        const v = stop.styles?.[p] ?? '—';
        return v.length > 30 ? v.slice(0, 27) + '…' : v;
      });
      return `| ${key} | ${vals.join(' | ')} |`;
    });

    parts.push(`#### \`${name}\`\n\n${header}\n${sep}\n${rows.join('\n')}`);
  }

  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// CSS Transitions
// ---------------------------------------------------------------------------

function renderTransitions(transitions) {
  if (!Array.isArray(transitions) || transitions.length === 0) {
    return '_No CSS transitions detected._';
  }

  const propCount = {};
  for (const t of transitions) {
    const props = Array.isArray(t.properties) ? t.properties : [t.property ?? 'all'];
    for (const prop of props) {
      propCount[prop] = (propCount[prop] ?? 0) + 1;
    }
  }

  const seen = new Set();
  const deduped = [];
  for (const t of transitions) {
    const props = Array.isArray(t.properties) ? t.properties.join(',') : (t.property ?? 'all');
    const key   = `${props}|${t.duration ?? ''}|${t.timingFunction ?? ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(t);
    }
  }

  const rows = deduped.slice(0, 20).map(t => {
    const props  = Array.isArray(t.properties) ? t.properties.join(', ') : (t.property ?? 'all');
    const dur    = t.duration       ?? t.transitionDuration ?? '—';
    const easing = t.timingFunction ?? t.easing            ?? '—';
    const delay  = t.delay          ?? t.transitionDelay   ?? '0s';
    return `| \`${props}\` | ${dur} | ${easing} | ${delay} |`;
  });

  const propRows = Object.entries(propCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([prop, count]) => `| \`${prop}\` | ${count} |`);

  const parts = [
    `- **Transitions found**: ${transitions.length} (${deduped.length} unique patterns)`,
  ];

  parts.push(
    '#### Transition Patterns\n\n' +
    '| Properties | Duration | Easing | Delay |\n' +
    '|------------|----------|--------|-------|\n' +
    rows.join('\n')
  );

  if (propRows.length > 0) {
    parts.push(
      '#### Most Transitioned Properties\n\n' +
      '| Property | Count |\n|----------|-------|\n' +
      propRows.join('\n')
    );
  }

  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// Animation Triggers
// ---------------------------------------------------------------------------

function renderTriggers(triggers) {
  if (!Array.isArray(triggers) || triggers.length === 0) return '';

  const groups = {};
  for (const t of triggers) {
    const type = t.type ?? 'unknown';
    if (!groups[type]) groups[type] = [];
    groups[type].push(t);
  }

  const parts = [`### Animation Triggers\n\n- **Total triggers**: ${triggers.length}`];
  const order = ['hover', 'focus', 'active', 'scroll', 'load'];

  for (const type of order) {
    const items = groups[type];
    if (!items || items.length === 0) continue;

    const rows = items.slice(0, 15).map(t =>
      `| \`${truncate(t.selector, 40)}\` | ${t.animationOrProperty} | ${t.source} |`
    );

    parts.push(
      `#### ${capitalize(type)} (${items.length})\n\n` +
      '| Selector | Animation/Property | Source |\n' +
      '|----------|--------------------|--------|\n' +
      rows.join('\n')
    );
  }

  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// CSS Transforms
// ---------------------------------------------------------------------------

function renderTransforms(transforms) {
  if (!Array.isArray(transforms) || transforms.length === 0) {
    return '_No CSS transforms detected._';
  }

  const rows = transforms.map(t => {
    const value = t.value ?? '—';
    const fns   = Array.isArray(t.functions) ? t.functions.join(', ') : '—';
    return `| \`${value.length > 60 ? value.slice(0, 57) + '…' : value}\` | ${fns} |`;
  });

  return (
    `- **Unique transforms**: ${transforms.length}\n\n` +
    '| Transform Value | Functions Used |\n' +
    '|----------------|----------------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Web Animations (JS-driven) — enhanced
// ---------------------------------------------------------------------------

function renderWebAnimations(webAnimations) {
  if (!Array.isArray(webAnimations) || webAnimations.length === 0) {
    return '_No Web Animations detected._';
  }

  const rows = webAnimations.map(a => {
    const id    = a.animationName || a.id || '(anonymous)';
    const dur   = typeof a.duration === 'number' ? `${a.duration}ms` : (a.duration ?? '—');
    const ease  = a.easing     ?? '—';
    const type  = a.animationType ?? 'web-animation';
    const state = a.playState  ?? '—';
    const elCtx = a.element ? `${a.element.tag}${a.element.classes?.length ? '.' + a.element.classes[0] : ''}` : '—';
    return `| ${id} | ${type} | ${dur} | ${ease} | ${state} | ${elCtx} |`;
  });

  const parts = [
    `- **JS-driven animations**: ${webAnimations.length}\n\n` +
    '| Name | Type | Duration | Easing | State | Element |\n' +
    '|----|------|----------|--------|-------|--------|\n' +
    rows.join('\n')
  ];

  // Keyframe details for top 5 most interesting animations
  const withKeyframes = webAnimations
    .filter(a => Array.isArray(a.keyframes) && a.keyframes.length > 0)
    .slice(0, 5);

  if (withKeyframes.length > 0) {
    parts.push('#### Computed Keyframes');

    for (const a of withKeyframes) {
      const name = a.animationName || a.id || '(anonymous)';
      const props = new Set();
      for (const kf of a.keyframes) {
        for (const key of Object.keys(kf)) {
          if (key !== 'offset' && key !== 'computedOffset' && key !== 'easing' && key !== 'composite') {
            props.add(key);
          }
        }
      }
      const propList = [...props].slice(0, 6);
      if (propList.length === 0) continue;

      const header = `| offset | ${propList.map(p => `\`${p}\``).join(' | ')} |`;
      const sep    = `|--------|${propList.map(() => '---').join('|')}|`;
      const kfRows = a.keyframes.map(kf => {
        const offset = kf.offset !== undefined ? kf.offset : '—';
        const vals = propList.map(p => truncate(String(kf[p] ?? '—'), 25));
        return `| ${offset} | ${vals.join(' | ')} |`;
      });

      parts.push(`\n**\`${name}\`**\n\n${header}\n${sep}\n${kfRows.join('\n')}`);
    }
  }

  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// Scroll-driven Animations
// ---------------------------------------------------------------------------

function renderScrollAnimations(scrollAnimations) {
  if (!Array.isArray(scrollAnimations) || scrollAnimations.length === 0) {
    return '_No scroll-driven animations detected._';
  }

  const rows = scrollAnimations.map(a =>
    `| \`${a.timeline}\` | ${a.animation || '—'} | ${a.type} |`
  );

  return (
    `- **Scroll-driven animations**: ${scrollAnimations.length}\n\n` +
    '| Timeline | Animation | Type |\n' +
    '|----------|-----------|------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// SVG Animations
// ---------------------------------------------------------------------------

function renderSvgAnimations(svgAnimations) {
  if (!Array.isArray(svgAnimations) || svgAnimations.length === 0) return '';

  const rows = svgAnimations.map(a => {
    const fromTo = a.from && a.to ? `${a.from} → ${a.to}` : (a.values || '—');
    return `| ${a.type} | ${a.attributeName || '—'} | ${truncate(fromTo, 30)} | ${a.dur || '—'} | ${a.repeatCount || '1'} | \`${truncate(a.selector, 30)}\` |`;
  });

  return (
    '### SVG Animations (SMIL)\n\n' +
    `- **SMIL elements**: ${svgAnimations.length}\n\n` +
    '| Type | Attribute | From → To | Duration | Repeat | Element |\n' +
    '|------|-----------|-----------|----------|--------|--------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Motion Paths
// ---------------------------------------------------------------------------

function renderMotionPaths(motionPaths) {
  if (!Array.isArray(motionPaths) || motionPaths.length === 0) {
    return '_No motion paths detected._';
  }

  const rows = motionPaths.map(mp => {
    const path = mp.path.length > 50 ? mp.path.slice(0, 47) + '…' : mp.path;
    return `| \`${mp.selector}\` | \`${path}\` | ${mp.distance} |`;
  });

  return (
    `- **Motion paths**: ${motionPaths.length}\n\n` +
    '| Element | offset-path | offset-distance |\n' +
    '|---------|-------------|----------------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Will-change Hints
// ---------------------------------------------------------------------------

function renderWillChange(willChangeHints) {
  if (!Array.isArray(willChangeHints) || willChangeHints.length === 0) {
    return '_No will-change hints detected._';
  }

  const rows = willChangeHints.map(h => `| \`${h.property}\` | ${h.count} |`);

  return (
    `- **will-change properties**: ${willChangeHints.length}\n\n` +
    '| Property | Count |\n' +
    '|----------|-------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Accessibility: Reduced Motion
// ---------------------------------------------------------------------------

function renderReducedMotion(reducedMotion) {
  if (!reducedMotion) return '';

  const badge = reducedMotion.assessment ?? 'Unknown';
  const parts = [
    '### Accessibility: Reduced Motion\n',
    `- **Support level**: ${badge}`,
    `- **@media rules found**: ${reducedMotion.ruleCount ?? 0}`,
  ];

  if (reducedMotion.overriddenProperties?.length > 0) {
    parts.push(`- **Properties overridden**: \`${reducedMotion.overriddenProperties.join('`, `')}\``);
  }

  if (badge === 'None') {
    parts.push(
      '\n> **Recommendation**: Add `@media (prefers-reduced-motion: reduce)` rules to disable or simplify animations for users who prefer reduced motion.'
    );
  } else if (badge === 'Partial') {
    parts.push(
      '\n> **Recommendation**: Consider covering all animation and transition properties in reduced-motion media queries for full accessibility compliance.'
    );
  }

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Motion Tokens (3-tier)
// ---------------------------------------------------------------------------

function renderMotionTokens(data) {
  const tokens = generateMotionTokens(data);

  const parts = [];

  // Primitive tokens
  if (tokens.primitive && Object.keys(tokens.primitive).length > 0) {
    const rows = Object.entries(tokens.primitive).map(([name, t]) =>
      `| \`${name}\` | \`${t.$value}\` | ${t.$type} |`
    );
    parts.push(
      '#### Primitive Tokens\n\n' +
      '| Token | Value | Type |\n' +
      '|-------|-------|------|\n' +
      rows.join('\n')
    );
  }

  // Semantic tokens
  if (tokens.semantic && Object.keys(tokens.semantic).length > 0) {
    const rows = Object.entries(tokens.semantic).map(([name, t]) =>
      `| \`${name}\` | \`${t.$value}\` | ${t.$type} | ${t.$description ?? ''} |`
    );
    parts.push(
      '#### Semantic Tokens\n\n' +
      '| Token | Value | Type | Description |\n' +
      '|-------|-------|------|-------------|\n' +
      rows.join('\n')
    );
  }

  // Component tokens
  if (tokens.component && Object.keys(tokens.component).length > 0) {
    const rows = Object.entries(tokens.component).map(([name, t]) =>
      `| \`${name}\` | \`${t.$value}\` | ${t.$type} |`
    );
    parts.push(
      '#### Component Tokens\n\n' +
      '| Token | Value/Reference | Type |\n' +
      '|-------|----------------|------|\n' +
      rows.join('\n')
    );
  }

  // Composite transition tokens
  if (tokens.transitions && Object.keys(tokens.transitions).length > 0) {
    const block = JSON.stringify(tokens.transitions, null, 2);
    parts.push(
      '#### Composite Transition Tokens\n\n' +
      '```json\n' + block + '\n```'
    );
  }

  // Full token export
  const allTokens = {
    ...(tokens.primitive ?? {}),
    ...(tokens.semantic ?? {}),
    ...(tokens.component ?? {}),
    ...(tokens.transitions ?? {}),
  };

  if (Object.keys(allTokens).length > 0) {
    parts.push(
      '<details>\n<summary>Full Motion Token Export (JSON)</summary>\n\n' +
      '```json\n' + JSON.stringify(allTokens, null, 2) + '\n```\n\n</details>'
    );
  }

  if (parts.length === 0) return '';

  return '### Motion Design Tokens\n\n' +
    '> 3-tier W3C DTCG token system derived from observed animation values.\n\n' +
    parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// Reconstruction Snippets
// ---------------------------------------------------------------------------

function renderReconstructionSnippets(keyframes, animations) {
  if (!Array.isArray(keyframes) || keyframes.length === 0) return '';

  // Pick top 5 keyframes that have matching CSS animations
  const animNames = new Set(
    (Array.isArray(animations) ? animations : []).map(a => a.name)
  );

  const significant = keyframes
    .filter(kf => kf.stops && kf.stops.length > 0)
    .sort((a, b) => {
      // Prioritize keyframes used by active animations
      const aUsed = animNames.has(a.name) ? 1 : 0;
      const bUsed = animNames.has(b.name) ? 1 : 0;
      if (aUsed !== bUsed) return bUsed - aUsed;
      return (b.stops?.length ?? 0) - (a.stops?.length ?? 0);
    })
    .slice(0, 5);

  if (significant.length === 0) return '';

  const parts = ['### Animation Reconstruction Snippets\n\n> CSS code blocks for the most significant animations — copy-paste ready for reconstruction.\n'];

  for (const kf of significant) {
    const lines = [`@keyframes ${kf.name} {`];
    for (const stop of kf.stops) {
      const props = Object.entries(stop.styles ?? {})
        .map(([prop, val]) => `    ${prop}: ${val};`)
        .join('\n');
      lines.push(`  ${stop.key} {\n${props}\n  }`);
    }
    lines.push('}');

    // Find matching CSS animation rule
    const anim = (Array.isArray(animations) ? animations : []).find(a => a.name === kf.name);
    if (anim) {
      lines.push('');
      lines.push(`/* Usage: */`);
      const animProps = [
        `animation-name: ${anim.name}`,
        anim.duration ? `animation-duration: ${anim.duration}` : null,
        anim.timingFunction ? `animation-timing-function: ${anim.timingFunction}` : null,
        anim.delay && anim.delay !== '0s' ? `animation-delay: ${anim.delay}` : null,
        anim.iterationCount && anim.iterationCount !== '1' ? `animation-iteration-count: ${anim.iterationCount}` : null,
        anim.fillMode && anim.fillMode !== 'none' ? `animation-fill-mode: ${anim.fillMode}` : null,
      ].filter(Boolean);
      lines.push(`.element {\n  ${animProps.map(p => p + ';').join('\n  ')}\n}`);
    }

    parts.push('```css\n' + lines.join('\n') + '\n```');
  }

  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// 3D Rendering
// ---------------------------------------------------------------------------

function render3DOverview(data) {
  const libs = Array.isArray(data.libraries3D) ? data.libraries3D.length : 0;
  const canvases = Array.isArray(data.webglCanvases) ? data.webglCanvases.length : 0;
  const components = Array.isArray(data.components3D) ? data.components3D.length : 0;
  const scenes = Array.isArray(data.css3DScenes) ? data.css3DScenes.length : 0;
  const models = Array.isArray(data.modelFiles) ? data.modelFiles.length : 0;
  const anims = Array.isArray(data.animations3D) ? data.animations3D.length : 0;
  const total = libs + canvases + components + scenes + models + anims;

  const parts = [`- **3D signals detected**: ${total}`];
  if (libs > 0) {
    const names = data.libraries3D.map(l => `${l.name}${l.version ? ' ' + l.version : ''}`).join(', ');
    parts.push(`- **3D libraries**: ${names}`);
  }
  if (canvases > 0) parts.push(`- **WebGL canvases**: ${canvases}`);
  if (components > 0) {
    const types = data.components3D.map(c => c.type).join(', ');
    parts.push(`- **3D components**: ${components} (${types})`);
  }
  if (scenes > 0) parts.push(`- **CSS 3D scenes**: ${scenes}`);
  if (models > 0) parts.push(`- **3D model files**: ${models}`);
  if (anims > 0) parts.push(`- **3D animations**: ${anims}`);

  return parts.join('\n');
}

function render3DLibraries(libraries3D) {
  if (!Array.isArray(libraries3D) || libraries3D.length === 0) return '';

  const rows = libraries3D.map(l => {
    const version = l.version ?? '—';
    const src = l.scriptSrc ? truncate(l.scriptSrc, 50) : '—';
    const global = l.globalVar ? `\`${l.globalVar}\`` : '—';
    return `| ${l.name} | ${version} | ${src} | ${global} |`;
  });

  return (
    '#### 3D Libraries & Frameworks\n\n' +
    '| Name | Version | Source | Global |\n' +
    '|------|---------|--------|--------|\n' +
    rows.join('\n')
  );
}

function renderWebGLCanvases(webglCanvases) {
  if (!Array.isArray(webglCanvases) || webglCanvases.length === 0) return '';

  const rows = webglCanvases.map(c => {
    const id = c.id ? `\`${c.id}\`` : '—';
    const dims = `${c.width}×${c.height}`;
    return `| ${id} | ${dims} | ${c.contextType} | ${c.parentInfo} |`;
  });

  return (
    '#### WebGL Canvases\n\n' +
    '| ID | Dimensions | Context | Container |\n' +
    '|----|------------|---------|----------|\n' +
    rows.join('\n')
  );
}

function render3DComponents(components3D) {
  if (!Array.isArray(components3D) || components3D.length === 0) return '';

  const rows = components3D.map(c => {
    const src = c.src ? truncate(c.src, 50) : '—';
    const attrs = Object.entries(c.attributes).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(', ') || '—';
    return `| ${c.type} | ${src} | ${attrs} |`;
  });

  return (
    '#### 3D Components\n\n' +
    '| Type | Source URL | Key Attributes |\n' +
    '|------|-----------|---------------|\n' +
    rows.join('\n')
  );
}

function renderCss3DScenes(css3DScenes) {
  if (!Array.isArray(css3DScenes) || css3DScenes.length === 0) return '';

  const rows = css3DScenes.map(s => {
    const perspective = s.perspective ?? '—';
    const tStyle = s.transformStyle ?? '—';
    const backface = s.backfaceVisibility ?? '—';
    return `| \`${s.selector}\` | ${perspective} | ${tStyle} | ${backface} | ${s.childCount} |`;
  });

  return (
    '#### CSS 3D Scenes\n\n' +
    '| Selector | Perspective | Transform-Style | Backface | Children |\n' +
    '|----------|-------------|-----------------|----------|----------|\n' +
    rows.join('\n')
  );
}

function render3DModelFiles(modelFiles) {
  if (!Array.isArray(modelFiles) || modelFiles.length === 0) return '';

  const rows = modelFiles.map(f => {
    const url = truncate(f.url, 50);
    return `| ${url} | ${f.format} | ${f.source} |`;
  });

  return (
    '#### 3D Model Files\n\n' +
    '| URL | Format | Source |\n' +
    '|-----|--------|--------|\n' +
    rows.join('\n')
  );
}

function render3DAnimations(animations3D) {
  if (!Array.isArray(animations3D) || animations3D.length === 0) return '';

  const rows = animations3D.map(a => {
    const axes = a.axes.join(', ') || '—';
    const dur = a.duration ?? '—';
    const easing = a.easing ?? '—';
    return `| ${a.name} | ${a.type} | ${axes} | ${dur} | ${easing} |`;
  });

  return (
    '#### 3D Animations\n\n' +
    '| Name | Type | Axes | Duration | Easing |\n' +
    '|------|------|------|----------|--------|\n' +
    rows.join('\n')
  );
}

function render3DSection(data) {
  const has3D =
    (Array.isArray(data.libraries3D) && data.libraries3D.length > 0) ||
    (Array.isArray(data.webglCanvases) && data.webglCanvases.length > 0) ||
    (Array.isArray(data.components3D) && data.components3D.length > 0) ||
    (Array.isArray(data.css3DScenes) && data.css3DScenes.length > 0) ||
    (Array.isArray(data.modelFiles) && data.modelFiles.length > 0) ||
    (Array.isArray(data.animations3D) && data.animations3D.length > 0);

  if (!has3D) return '';

  const parts = ['### 3D Rendering\n\n' + render3DOverview(data)];

  const libs = render3DLibraries(data.libraries3D);
  if (libs) parts.push(libs);

  const canvases = renderWebGLCanvases(data.webglCanvases);
  if (canvases) parts.push(canvases);

  const comps = render3DComponents(data.components3D);
  if (comps) parts.push(comps);

  const scenes = renderCss3DScenes(data.css3DScenes);
  if (scenes) parts.push(scenes);

  const models = render3DModelFiles(data.modelFiles);
  if (models) parts.push(models);

  const anims = render3DAnimations(data.animations3D);
  if (anims) parts.push(anims);

  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
}

function truncate(str, max) {
  if (!str) return '—';
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

// ---------------------------------------------------------------------------
// Main renderer
// ---------------------------------------------------------------------------

/**
 * Render the Animations layer as rich Markdown.
 *
 * @param {object} data - Animations layer payload
 * @returns {string}
 */
export function renderAnimationsSection(data = {}) {
  const {
    animations, transitions, keyframes, transforms,
    webAnimations, scrollAnimations, motionPaths, willChangeHints,
    libraries, triggers, reducedMotion, svgAnimations,
  } = data;

  const parts = [];

  // 4.1 Overview
  parts.push('### Overview\n\n' + renderOverview(data));

  // 4.2 Animation Libraries
  const libSection = renderLibraries(libraries);
  if (libSection) parts.push(libSection);

  // 4.3 CSS Animations by Category
  const animCount = Array.isArray(animations) ? animations.length : 0;
  if (animCount > 0) {
    parts.push(renderCssAnimationsByCategory(animations));
  }

  // 4.4 Keyframe Details
  const kfCount = Array.isArray(keyframes) ? keyframes.length : 0;
  if (kfCount > 0) {
    parts.push(renderKeyframeDetails(keyframes));
  }

  // 4.5 CSS Transitions
  const transCount = Array.isArray(transitions) ? transitions.length : 0;
  if (transCount > 0) {
    parts.push('### CSS Transitions\n\n' + renderTransitions(transitions));
  }

  // 4.6 Animation Triggers
  const triggerSection = renderTriggers(triggers);
  if (triggerSection) parts.push(triggerSection);

  // 4.7 Web Animations (enhanced)
  const waCount = Array.isArray(webAnimations) ? webAnimations.length : 0;
  if (waCount > 0) {
    parts.push('### Web Animations (JS-driven)\n\n' + renderWebAnimations(webAnimations));
  }

  // 4.8 Scroll-driven Animations
  const saCount = Array.isArray(scrollAnimations) ? scrollAnimations.length : 0;
  if (saCount > 0) {
    parts.push('### Scroll-driven Animations\n\n' + renderScrollAnimations(scrollAnimations));
  }

  // 4.9 SVG Animations
  const svgSection = renderSvgAnimations(svgAnimations);
  if (svgSection) parts.push(svgSection);

  // 4.10 Motion Paths
  const mpCount = Array.isArray(motionPaths) ? motionPaths.length : 0;
  if (mpCount > 0) {
    parts.push('### Motion Paths\n\n' + renderMotionPaths(motionPaths));
  }

  // 4.11 Performance Hints
  const wcCount = Array.isArray(willChangeHints) ? willChangeHints.length : 0;
  if (wcCount > 0) {
    parts.push('### Performance Hints (will-change)\n\n' + renderWillChange(willChangeHints));
  }

  // 4.12 Accessibility: Reduced Motion
  const rmSection = renderReducedMotion(reducedMotion);
  if (rmSection) parts.push(rmSection);

  // 4.13 Motion Design Tokens (3-tier)
  const tokenSection = renderMotionTokens(data);
  if (tokenSection) parts.push(tokenSection);

  // 4.14 Reconstruction Snippets
  const snippetSection = renderReconstructionSnippets(keyframes, animations);
  if (snippetSection) parts.push(snippetSection);

  // 4.15 3D Rendering
  const threeDSection = render3DSection(data);
  if (threeDSection) parts.push(threeDSection);

  // 4.16 Canvas Animations
  if (Array.isArray(data.canvasAnimations) && data.canvasAnimations.length > 0) {
    const rows = data.canvasAnimations.map(ca => {
      const dims = ca.dimensions ? `${ca.dimensions.width}×${ca.dimensions.height}` : '—';
      return `| ${ca.engine} | ${ca.canvasId ?? '—'} | ${dims} |`;
    });
    parts.push(
      '### Canvas Animations\n\n' +
      `- **Canvas animations detected**: ${data.canvasAnimations.length}\n\n` +
      '| Engine | Canvas ID | Dimensions |\n' +
      '|--------|-----------|------------|\n' +
      rows.join('\n')
    );
  }

  // 4.17 View Transitions
  if (data.viewTransitions?.hasViewTransitions) {
    const vt = data.viewTransitions;
    const vtParts = ['### View Transitions\n'];
    if (vt.transitionNames.length > 0) {
      vtParts.push(`- **Transition names**: ${vt.transitionNames.map(n => `\`${n}\``).join(', ')}`);
    }
    if (vt.pseudoElements.length > 0) {
      vtParts.push(`- **Pseudo-elements**: ${vt.pseudoElements.map(p => `\`${p}\``).join(', ')}`);
    }
    parts.push(vtParts.join('\n'));
  }

  // 4.18 Motion Variables
  if (Array.isArray(data.motionVariables) && data.motionVariables.length > 0) {
    const rows = data.motionVariables.map(v =>
      `| \`${v.name}\` | \`${v.value}\` | ${v.category} |`
    );
    parts.push(
      '### Motion Variables\n\n' +
      `- **CSS motion custom properties**: ${data.motionVariables.length}\n\n` +
      '| Variable | Value | Category |\n' +
      '|----------|-------|----------|\n' +
      rows.join('\n')
    );
  }

  // 4.19 Animation Choreography
  if (data.choreography) {
    const choreoSection = renderAnimationChoreography(data.choreography);
    if (choreoSection) parts.push(choreoSection);
  }

  if (parts.length === 1) {
    parts.push('_No motion design detected on this page._');
  }

  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// Animation Choreography
// ---------------------------------------------------------------------------

function renderAnimationChoreography(choreo) {
  if (!choreo) return '';
  const parts = [];

  const {
    ambientAnimations, interactiveAnimations, scrollAnimations,
    hoverChoreography, staggerSequences, animationSequenceMap,
  } = choreo;

  const hasContent =
    ambientAnimations?.length > 0 || interactiveAnimations?.length > 0 ||
    scrollAnimations?.length > 0 || hoverChoreography?.length > 0 ||
    staggerSequences?.length > 0 || animationSequenceMap?.length > 0;

  if (!hasContent) return '';

  parts.push('### Animation Choreography');

  // Ambient loops
  if (ambientAnimations?.length > 0) {
    const rows = ambientAnimations.map(a =>
      `| \`${a.name}\` | ${a.duration} | ${a.element?.tag ?? '—'} |`
    );
    parts.push(
      '#### Ambient Loops\n\n' +
      `- **Infinite ambient animations**: ${ambientAnimations.length}\n\n` +
      '| Name | Duration | Element |\n' +
      '|------|----------|---------|\n' +
      rows.join('\n')
    );
  }

  // Hover choreography
  if (hoverChoreography?.length > 0) {
    const groups = hoverChoreography.slice(0, 10).map(h => {
      const childRows = h.affectedChildren.map(c => {
        const props = Object.entries(c.properties).map(([p, v]) => `${p}: ${v.to ?? v}`).join('; ');
        return `| \`${h.triggerSelector}:hover\` | \`${c.selector}\` | ${props.slice(0, 60)} | ${c.transition ?? '—'} |`;
      });
      return childRows.join('\n');
    });
    parts.push(
      '#### Hover Choreography\n\n' +
      '| Trigger | Child | Property Changes | Transition |\n' +
      '|---------|-------|-----------------|------------|\n' +
      groups.join('\n')
    );
  }

  // Stagger sequences
  if (staggerSequences?.length > 0) {
    const rows = staggerSequences.map(s =>
      `| \`${s.animationName}\` | ${s.count} | ${s.staggerIncrement} |`
    );
    parts.push(
      '#### Stagger Sequences\n\n' +
      '| Animation | Count | Stagger |\n' +
      '|-----------|-------|---------|\n' +
      rows.join('\n')
    );
  }

  // State machine map
  if (animationSequenceMap?.length > 0) {
    const blocks = animationSequenceMap.slice(0, 5).map(sm => {
      const states = Object.entries(sm.states).map(([state, props]) => {
        const propStr = Object.entries(props).map(([p, v]) => `  ${p}: ${v};`).join('\n');
        return `${sm.selector}:${state} {\n${propStr}\n}`;
      });
      return states.join('\n');
    });
    parts.push(
      '#### State Machine Map\n\n```css\n' + blocks.join('\n\n') + '\n```'
    );
  }

  return parts.join('\n\n');
}
