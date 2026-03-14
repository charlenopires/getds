/**
 * Motion token generation — 3-tier W3C DTCG system
 *
 * Builds Primitive, Semantic, and Component-level motion tokens
 * from the full animation layer payload.
 */

/**
 * Convert a CSS duration string to milliseconds.
 */
function toMs(duration) {
  if (!duration) return 0;
  if (typeof duration === 'number') return duration;
  const sMatch  = String(duration).match(/^([\d.]+)s$/);
  const msMatch = String(duration).match(/^([\d.]+)ms$/);
  if (sMatch)  return Number(sMatch[1])  * 1000;
  if (msMatch) return Number(msMatch[1]);
  return 0;
}

/**
 * Turn an easing value into a URL-safe slug for token naming.
 */
function easingSlug(value) {
  return value
    .replace(/[(),.]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/**
 * Normalize duration to ms string.
 */
function normalizeDuration(val) {
  const ms = toMs(val);
  return ms > 0 ? `${ms}ms` : null;
}

/**
 * Collect all raw duration and easing values from the full animation payload.
 */
function collectRawValues(data = {}) {
  const durations = new Set();
  const easings = new Set();
  const componentAnimations = []; // { componentType, duration, easing, category }

  // CSS Animations
  for (const a of (Array.isArray(data.animations) ? data.animations : [])) {
    const d = normalizeDuration(a.duration);
    if (d) durations.add(d);
    if (a.timingFunction && a.timingFunction !== 'ease') easings.add(a.timingFunction);
    if (a.element?.componentType && a.element.componentType !== 'unknown') {
      componentAnimations.push({
        componentType: a.element.componentType,
        category: a.category ?? 'micro-interaction',
        duration: d,
        easing: a.timingFunction,
      });
    }
  }

  // Transitions
  for (const t of (Array.isArray(data.transitions) ? data.transitions : [])) {
    const d = normalizeDuration(t.duration ?? t.transitionDuration);
    if (d) durations.add(d);
    const easing = t.timingFunction ?? t.easing;
    if (easing && easing !== 'ease') easings.add(easing);
  }

  // Web Animations
  for (const wa of (Array.isArray(data.webAnimations) ? data.webAnimations : [])) {
    const d = normalizeDuration(wa.duration);
    if (d) durations.add(d);
    if (wa.easing && wa.easing !== 'linear' && wa.easing !== 'ease') easings.add(wa.easing);
    if (wa.element?.componentType && wa.element.componentType !== 'unknown') {
      componentAnimations.push({
        componentType: wa.element.componentType,
        category: wa.animationType ?? 'web-animation',
        duration: d,
        easing: wa.easing,
      });
    }
  }

  return { durations: [...durations], easings: [...easings], componentAnimations };
}

/**
 * Tier 1 — Primitive tokens: raw unique values with step names.
 */
function generatePrimitiveTokens(durations, easings) {
  const sorted = [...durations].sort((a, b) => toMs(a) - toMs(b));

  const durationTokens = {};
  sorted.forEach((val, i) => {
    const step = (i + 1) * 100;
    durationTokens[`motion.duration.${step}`] = {
      $value: val,
      $type: 'duration',
    };
  });

  const easingTokens = {};
  for (const val of easings) {
    easingTokens[`motion.easing.${easingSlug(val)}`] = {
      $value: val,
      $type: 'cubicBezier',
    };
  }

  const delayTokens = {};
  // Extract unique delays from durations (common pattern: reuse duration values as delays)
  const uniqueDelays = sorted.slice(0, 3);
  uniqueDelays.forEach((val, i) => {
    const step = (i + 1) * 100;
    delayTokens[`motion.delay.${step}`] = {
      $value: val,
      $type: 'duration',
    };
  });

  return { ...durationTokens, ...easingTokens, ...delayTokens };
}

/**
 * Tier 2 — Semantic tokens: intent-based names mapped to primitive values.
 */
function generateSemanticTokens(durations, easings) {
  const sorted = [...durations].sort((a, b) => toMs(a) - toMs(b));
  const semantic = {};

  // Duration semantics based on ms ranges
  const buckets = [
    { name: 'instant',  max: 100 },
    { name: 'fast',     max: 200 },
    { name: 'normal',   max: 400 },
    { name: 'slow',     max: 800 },
    { name: 'slower',   max: Infinity },
  ];

  const assigned = new Set();
  for (const d of sorted) {
    const ms = toMs(d);
    for (const bucket of buckets) {
      if (ms <= bucket.max && !assigned.has(bucket.name)) {
        assigned.add(bucket.name);
        semantic[`motion.duration.${bucket.name}`] = {
          $value: d,
          $type: 'duration',
          $description: `${bucket.name} (${ms}ms)`,
        };
        break;
      }
    }
  }

  // Easing semantics
  const easingMap = {
    'ease':         'standard',
    'ease-in-out':  'standard',
    'ease-out':     'decelerate',
    'ease-in':      'accelerate',
    'linear':       'linear',
  };

  // Find the most frequent easing → standard
  const easingAssigned = new Set();
  for (const e of easings) {
    const semanticName = easingMap[e];
    if (semanticName && !easingAssigned.has(semanticName)) {
      easingAssigned.add(semanticName);
      semantic[`motion.easing.${semanticName}`] = {
        $value: e,
        $type: 'cubicBezier',
      };
    }
  }

  // Custom cubic-bezier with wide range → emphasized
  for (const e of easings) {
    if (e.startsWith('cubic-bezier') && !easingAssigned.has('emphasized')) {
      easingAssigned.add('emphasized');
      semantic[`motion.easing.emphasized`] = {
        $value: e,
        $type: 'cubicBezier',
      };
      break;
    }
  }

  return semantic;
}

/**
 * Tier 3 — Component tokens: per-component, referencing semantic values.
 */
function generateComponentTokens(componentAnimations, semanticTokens) {
  const component = {};
  const seen = new Set();

  for (const ca of componentAnimations) {
    const { componentType, category, duration, easing } = ca;
    if (!componentType || componentType === 'unknown') continue;

    // Find matching semantic token for duration
    let durationRef = duration;
    for (const [name, token] of Object.entries(semanticTokens)) {
      if (name.startsWith('motion.duration.') && token.$value === duration) {
        durationRef = `{${name}}`;
        break;
      }
    }

    // Find matching semantic token for easing
    let easingRef = easing;
    for (const [name, token] of Object.entries(semanticTokens)) {
      if (name.startsWith('motion.easing.') && token.$value === easing) {
        easingRef = `{${name}}`;
        break;
      }
    }

    const catLabel = category === 'entrance' ? 'entrance'
      : category === 'exit' ? 'exit'
      : category === 'loading' ? 'loading'
      : 'hover';

    const durationKey = `motion.${componentType}.${catLabel}.duration`;
    const easingKey = `motion.${componentType}.${catLabel}.easing`;

    if (!seen.has(durationKey) && duration) {
      seen.add(durationKey);
      component[durationKey] = {
        $value: durationRef,
        $type: 'duration',
      };
    }
    if (!seen.has(easingKey) && easing) {
      seen.add(easingKey);
      component[easingKey] = {
        $value: easingRef,
        $type: 'cubicBezier',
      };
    }
  }

  return component;
}

/**
 * Generate composite transition tokens (W3C DTCG $type: "transition").
 */
function generateTransitionTokens(semanticTokens) {
  const transitions = {};

  // Find best duration and easing
  const durEntries = Object.entries(semanticTokens).filter(([k]) => k.startsWith('motion.duration.'));
  const easeEntries = Object.entries(semanticTokens).filter(([k]) => k.startsWith('motion.easing.'));

  if (durEntries.length > 0 && easeEntries.length > 0) {
    const normalDur = durEntries.find(([k]) => k.includes('normal')) ?? durEntries[0];
    const standardEase = easeEntries.find(([k]) => k.includes('standard')) ?? easeEntries[0];

    transitions['motion.transition.standard'] = {
      $type: 'transition',
      $value: {
        duration: `{${normalDur[0]}}`,
        delay: '0ms',
        timingFunction: `{${standardEase[0]}}`,
      },
    };

    const fastDur = durEntries.find(([k]) => k.includes('fast')) ?? durEntries[0];
    if (fastDur) {
      transitions['motion.transition.quick'] = {
        $type: 'transition',
        $value: {
          duration: `{${fastDur[0]}}`,
          delay: '0ms',
          timingFunction: `{${standardEase[0]}}`,
        },
      };
    }
  }

  return transitions;
}

/**
 * Generate 3-tier motion tokens from the full animation layer payload.
 *
 * @param {object} data - Full animations layer data
 * @returns {{
 *   primitive: object,
 *   semantic: object,
 *   component: object,
 *   transitions: object,
 *   durationTokens: Array<{ name: string, $value: string, $type: string }>,
 *   easingTokens: Array<{ name: string, $value: string, $type: string }>
 * }}
 */
export function generateMotionTokens(data = {}) {
  // Support legacy call signature: { durations, easings }
  if (data.durations && Array.isArray(data.durations)) {
    const durations = data.durations;
    const easings = data.easings ?? [];
    const sorted = [...new Set(durations)].sort((a, b) => toMs(a) - toMs(b));
    const durationTokens = sorted.map((val, i) => ({
      name: `duration-${i + 1}`,
      $value: val,
      $type: 'duration',
    }));
    const easingTokens = [...new Set(easings)].map(val => ({
      name: `easing-${easingSlug(val)}`,
      $value: val,
      $type: 'cubicBezier',
    }));
    return { durationTokens, easingTokens };
  }

  const { durations, easings, componentAnimations } = collectRawValues(data);

  if (durations.length === 0 && easings.length === 0) {
    return { primitive: {}, semantic: {}, component: {}, transitions: {}, durationTokens: [], easingTokens: [] };
  }

  const primitive = generatePrimitiveTokens(durations, easings);
  const semantic = generateSemanticTokens(durations, easings);
  const component = generateComponentTokens(componentAnimations, semantic);
  const transitions = generateTransitionTokens(semantic);

  // Legacy-compatible flat arrays
  const sorted = [...new Set(durations)].sort((a, b) => toMs(a) - toMs(b));
  const durationTokens = sorted.map((val, i) => ({
    name: `duration-${i + 1}`,
    $value: val,
    $type: 'duration',
  }));
  const easingTokens = [...new Set(easings)].map(val => ({
    name: `easing-${easingSlug(val)}`,
    $value: val,
    $type: 'cubicBezier',
  }));

  return { primitive, semantic, component, transitions, durationTokens, easingTokens };
}
