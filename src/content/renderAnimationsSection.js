/**
 * Animations section renderer — Layer 5
 *
 * Produces detailed, human-readable Markdown for:
 *   - CSS animations inventory
 *   - CSS transitions
 *   - Keyframe names
 *   - Inferred motion token recommendations
 */

// ---------------------------------------------------------------------------
// CSS Animations
// ---------------------------------------------------------------------------

function renderCssAnimations(animations) {
  if (!Array.isArray(animations) || animations.length === 0) {
    return '_No CSS animations detected on visible elements._';
  }

  const rows = animations.map(a => {
    const name     = a.name           ?? '—';
    const duration = a.duration       ?? '—';
    const easing   = a.timingFunction ?? '—';
    const delay    = a.delay          ?? '0s';
    const iter     = a.iterationCount ?? '1';
    const fill     = a.fillMode       ?? 'none';
    return `| \`${name}\` | ${duration} | ${easing} | ${delay} | ${iter} | ${fill} |`;
  });

  return (
    `- **Active animations**: ${animations.length}\n\n` +
    '| Name | Duration | Easing | Delay | Iterations | Fill Mode |\n' +
    '|------|----------|--------|-------|------------|----------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// CSS Transitions
// ---------------------------------------------------------------------------

function renderTransitions(transitions) {
  if (!Array.isArray(transitions) || transitions.length === 0) {
    return '_No CSS transitions detected._';
  }

  // Aggregate property frequency
  const propCount = {};
  const durationCount = {};

  for (const t of transitions) {
    const props = Array.isArray(t.properties) ? t.properties : [t.property ?? 'all'];
    const dur   = t.duration ?? t.transitionDuration ?? '—';

    for (const prop of props) {
      propCount[prop] = (propCount[prop] ?? 0) + 1;
    }
    if (dur !== '—') {
      durationCount[dur] = (durationCount[dur] ?? 0) + 1;
    }
  }

  // Deduplicated transition patterns
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
    const props  = Array.isArray(t.properties)
      ? t.properties.join(', ')
      : (t.property ?? 'all');
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
// Keyframes
// ---------------------------------------------------------------------------

function renderKeyframes(keyframes) {
  if (!Array.isArray(keyframes) || keyframes.length === 0) {
    return '_No `@keyframes` definitions detected._';
  }

  const rows = keyframes.map(kf => {
    const name   = kf.name   ?? kf   ?? '—';
    const steps  = kf.steps  ?? '—';
    const props  = Array.isArray(kf.properties)
      ? kf.properties.slice(0, 4).join(', ')
      : '—';
    return `| \`${name}\` | ${steps} | ${props} |`;
  });

  return (
    `- **@keyframes defined**: ${keyframes.length}\n\n` +
    '| Name | Steps | Animated Properties |\n' +
    '|------|-------|--------------------|\n' +
    rows.join('\n')
  );
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
// Web Animations (JS-driven)
// ---------------------------------------------------------------------------

function renderWebAnimations(webAnimations) {
  if (!Array.isArray(webAnimations) || webAnimations.length === 0) {
    return '_No Web Animations detected._';
  }

  const rows = webAnimations.map(a => {
    const id   = a.id         || '(anonymous)';
    const dur  = typeof a.duration === 'number' ? `${a.duration}ms` : (a.duration ?? '—');
    const ease = a.easing     ?? '—';
    const del  = typeof a.delay === 'number' ? `${a.delay}ms` : (a.delay ?? '0');
    const iter = a.iterations ?? 1;
    const fill = a.fill       ?? 'none';
    return `| ${id} | ${dur} | ${ease} | ${del} | ${iter} | ${fill} |`;
  });

  return (
    `- **JS-driven animations**: ${webAnimations.length}\n\n` +
    '| ID | Duration | Easing | Delay | Iterations | Fill |\n' +
    '|----|----------|--------|-------|------------|------|\n' +
    rows.join('\n')
  );
}

// ---------------------------------------------------------------------------
// Scroll-driven Animations
// ---------------------------------------------------------------------------

function renderScrollAnimations(scrollAnimations) {
  if (!Array.isArray(scrollAnimations) || scrollAnimations.length === 0) {
    return '_No scroll-driven animations detected._';
  }

  const rows = scrollAnimations.map(a => {
    return `| \`${a.timeline}\` | ${a.animation || '—'} | ${a.type} |`;
  });

  return (
    `- **Scroll-driven animations**: ${scrollAnimations.length}\n\n` +
    '| Timeline | Animation | Type |\n' +
    '|----------|-----------|------|\n' +
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
// Inferred motion tokens
// ---------------------------------------------------------------------------

function inferMotionTokens(animations, transitions, webAnimations) {
  const durations = new Set();
  const easings   = new Set();

  for (const a of (Array.isArray(animations) ? animations : [])) {
    if (a.duration       && a.duration       !== '0s') durations.add(a.duration);
    if (a.timingFunction && a.timingFunction !== 'ease') easings.add(a.timingFunction);
  }

  for (const t of (Array.isArray(transitions) ? transitions : [])) {
    const dur    = t.duration       ?? t.transitionDuration;
    const easing = t.timingFunction ?? t.easing;
    if (dur    && dur    !== '0s')   durations.add(dur);
    if (easing && easing !== 'ease') easings.add(easing);
  }

  for (const wa of (Array.isArray(webAnimations) ? webAnimations : [])) {
    if (typeof wa.duration === 'number' && wa.duration > 0) {
      durations.add(`${wa.duration}ms`);
    }
    if (wa.easing && wa.easing !== 'linear' && wa.easing !== 'ease') {
      easings.add(wa.easing);
    }
  }

  if (durations.size === 0 && easings.size === 0) return '';

  const TOKEN_NAMES = ['duration-instant', 'duration-fast', 'duration-normal', 'duration-slow', 'duration-slower'];

  const sortedDurations = [...durations].sort((a, b) => {
    const msA = parseFloat(a) * (a.endsWith('ms') ? 1 : 1000);
    const msB = parseFloat(b) * (b.endsWith('ms') ? 1 : 1000);
    return msA - msB;
  });

  const durationRows = sortedDurations.map((d, i) => {
    const token = TOKEN_NAMES[i] ?? `duration-${i + 1}`;
    return `| \`${token}\` | \`${d}\` | duration |`;
  });

  const EASING_NAMES = {
    'linear': 'easing-linear',
    'ease': 'easing-standard',
    'ease-in': 'easing-decelerate',
    'ease-out': 'easing-accelerate',
    'ease-in-out': 'easing-standard',
  };

  const easingRows = [...easings].map((e, i) => {
    const token = EASING_NAMES[e] ?? `easing-${i + 1}`;
    return `| \`${token}\` | \`${e}\` | cubicBezier |`;
  });

  const allRows = [...durationRows, ...easingRows];

  return (
    '### Inferred Motion Tokens\n\n' +
    '> These token recommendations are derived from observed animation values.\n\n' +
    '| Token | Value | Type |\n' +
    '|-------|-------|------|\n' +
    allRows.join('\n')
  );
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
  const { animations, transitions, keyframes, transforms, webAnimations, scrollAnimations, motionPaths, willChangeHints } = data;

  const parts = [];

  // Summary
  const animCount   = Array.isArray(animations)       ? animations.length       : 0;
  const transCount  = Array.isArray(transitions)       ? transitions.length      : 0;
  const kfCount     = Array.isArray(keyframes)         ? keyframes.length        : 0;
  const tfCount     = Array.isArray(transforms)        ? transforms.length       : 0;
  const waCount     = Array.isArray(webAnimations)     ? webAnimations.length    : 0;
  const saCount     = Array.isArray(scrollAnimations)  ? scrollAnimations.length : 0;
  const mpCount     = Array.isArray(motionPaths)       ? motionPaths.length      : 0;
  const wcCount     = Array.isArray(willChangeHints)   ? willChangeHints.length  : 0;

  parts.push(
    '### Overview\n\n' +
    `| Type | Count |\n|------|-------|\n` +
    `| Active CSS animations | ${animCount} |\n` +
    `| CSS transitions | ${transCount} |\n` +
    `| @keyframes definitions | ${kfCount} |\n` +
    `| CSS transforms | ${tfCount} |\n` +
    `| Web Animations (JS) | ${waCount} |\n` +
    `| Scroll-driven animations | ${saCount} |\n` +
    `| Motion paths | ${mpCount} |\n` +
    `| will-change hints | ${wcCount} |`
  );

  if (animCount > 0) {
    parts.push('### CSS Animations\n\n' + renderCssAnimations(animations));
  }

  if (transCount > 0) {
    parts.push('### CSS Transitions\n\n' + renderTransitions(transitions));
  }

  if (kfCount > 0) {
    parts.push('### Keyframe Definitions\n\n' + renderKeyframes(keyframes));
  }

  if (tfCount > 0) {
    parts.push('### CSS Transforms\n\n' + renderTransforms(transforms));
  }

  if (waCount > 0) {
    parts.push('### Web Animations (JS-driven)\n\n' + renderWebAnimations(webAnimations));
  }

  if (saCount > 0) {
    parts.push('### Scroll-driven Animations\n\n' + renderScrollAnimations(scrollAnimations));
  }

  if (mpCount > 0) {
    parts.push('### Motion Paths\n\n' + renderMotionPaths(motionPaths));
  }

  if (wcCount > 0) {
    parts.push('### Performance Hints (will-change)\n\n' + renderWillChange(willChangeHints));
  }

  const motionTokens = inferMotionTokens(animations, transitions, webAnimations);
  if (motionTokens) {
    parts.push(motionTokens);
  }

  if (parts.length === 1) {
    parts.push('_No motion design detected on this page._');
  }

  return parts.join('\n\n');
}
