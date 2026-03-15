/**
 * Easing curve classification — parses cubic-bezier control points
 * and classifies physics model, overshoot, and named equivalents.
 */

/** Named CSS easing presets with control points */
const NAMED_EASINGS = [
  { name: 'ease',        points: [0.25, 0.1, 0.25, 1.0] },
  { name: 'ease-in',     points: [0.42, 0.0, 1.0,  1.0] },
  { name: 'ease-out',    points: [0.0,  0.0, 0.58, 1.0] },
  { name: 'ease-in-out', points: [0.42, 0.0, 0.58, 1.0] },
  { name: 'linear',      points: [0.0,  0.0, 1.0,  1.0] },
];

/**
 * Parse cubic-bezier(x1, y1, x2, y2) from a string.
 * @param {string} str
 * @returns {{ x1: number, y1: number, x2: number, y2: number }|null}
 */
function parseCubicBezier(str) {
  const m = str.match(/cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/i);
  if (!m) return null;
  return {
    x1: parseFloat(m[1]),
    y1: parseFloat(m[2]),
    x2: parseFloat(m[3]),
    y2: parseFloat(m[4]),
  };
}

/**
 * Euclidean distance between two sets of control points.
 */
function controlPointDistance(a, b) {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 +
    (a[1] - b[1]) ** 2 +
    (a[2] - b[2]) ** 2 +
    (a[3] - b[3]) ** 2
  );
}

/**
 * Classify a single easing value.
 */
function classifySingle(raw) {
  const trimmed = (raw ?? '').trim().toLowerCase();

  // Named keywords
  if (trimmed === 'linear') {
    return {
      raw,
      classification: 'linear',
      namedEquivalent: 'linear',
      isCustom: false,
      physicsModel: null,
      overshoot: false,
      controlPoints: null,
    };
  }

  for (const named of NAMED_EASINGS) {
    if (trimmed === named.name) {
      return {
        raw,
        classification: named.name,
        namedEquivalent: named.name,
        isCustom: false,
        physicsModel: null,
        overshoot: false,
        controlPoints: named.points,
      };
    }
  }

  // Step functions
  if (/^steps?\s*\(/.test(trimmed)) {
    return {
      raw,
      classification: 'step',
      namedEquivalent: null,
      isCustom: true,
      physicsModel: null,
      overshoot: false,
      controlPoints: null,
    };
  }

  // cubic-bezier
  const cb = parseCubicBezier(trimmed);
  if (!cb) {
    return {
      raw,
      classification: 'standard',
      namedEquivalent: null,
      isCustom: false,
      physicsModel: null,
      overshoot: false,
      controlPoints: null,
    };
  }

  const points = [cb.x1, cb.y1, cb.x2, cb.y2];
  const hasOvershoot = cb.y1 > 1 || cb.y1 < 0 || cb.y2 > 1 || cb.y2 < 0;

  // Find closest named easing
  let closestName = null;
  let closestDist = Infinity;
  for (const named of NAMED_EASINGS) {
    const dist = controlPointDistance(points, named.points);
    if (dist < closestDist) {
      closestDist = dist;
      closestName = named.name;
    }
  }
  const namedEquivalent = closestDist < 0.1 ? closestName : null;

  // Classify
  let classification;
  let physicsModel = null;

  if (hasOvershoot) {
    // Spring/elastic detection
    if ((cb.y1 > 1 || cb.y2 > 1) && (cb.y1 < 0 || cb.y2 < 0)) {
      classification = 'elastic';
      physicsModel = 'elastic';
    } else {
      classification = 'overshoot/spring';
      physicsModel = 'spring';
    }
  } else if (cb.x1 >= 0.7 && cb.y1 <= 0.1 && cb.x2 <= 0.3 && cb.y2 >= 0.9) {
    // Dramatic S-curve (steep in, steep out)
    classification = 'dramatic';
    physicsModel = null;
  } else if (cb.x1 <= 0.1 && cb.y1 >= 0.5 && cb.x2 <= 0.1 && cb.y2 >= 0.9) {
    // Snap (very fast start)
    classification = 'snap';
    physicsModel = 'inertia';
  } else if (namedEquivalent) {
    classification = namedEquivalent;
  } else {
    // General classification based on curve shape
    const isEaseIn = cb.y1 < cb.x1 * 0.5 && cb.y2 >= 0.8;
    const isEaseOut = cb.y1 >= 0.3 && cb.x2 >= 0.5;
    if (isEaseIn && isEaseOut) {
      classification = 'ease-in-out';
    } else if (isEaseIn) {
      classification = 'ease-in';
    } else if (isEaseOut) {
      classification = 'ease-out';
    } else {
      classification = 'standard';
    }
  }

  return {
    raw,
    classification,
    namedEquivalent,
    isCustom: namedEquivalent === null,
    physicsModel,
    overshoot: hasOvershoot,
    controlPoints: points,
  };
}

/**
 * Classify easing curves from animations and transitions.
 *
 * @param {Array<{ timingFunction?: string }>} animations
 * @param {Array<{ timingFunction?: string, easing?: string }>} transitions
 * @returns {{ easingClassifications: Array<{
 *   raw: string,
 *   classification: string,
 *   namedEquivalent: string|null,
 *   isCustom: boolean,
 *   physicsModel: string|null,
 *   overshoot: boolean,
 *   controlPoints: number[]|null,
 * }>, summary: { total: number, custom: number, withOvershoot: number, classifications: Record<string, number> } }}
 */
export function classifyEasingCurves(animations = [], transitions = []) {
  const seen = new Set();
  const results = [];

  // Collect all unique easing values
  for (const a of (Array.isArray(animations) ? animations : [])) {
    const easing = a.timingFunction ?? a.easing;
    if (easing && !seen.has(easing)) {
      seen.add(easing);
      results.push(classifySingle(easing));
    }
  }

  for (const t of (Array.isArray(transitions) ? transitions : [])) {
    const easing = t.timingFunction ?? t.easing;
    if (easing && !seen.has(easing)) {
      seen.add(easing);
      results.push(classifySingle(easing));
    }
  }

  // Build summary
  const classifications = {};
  let custom = 0;
  let withOvershoot = 0;

  for (const r of results) {
    classifications[r.classification] = (classifications[r.classification] ?? 0) + 1;
    if (r.isCustom) custom++;
    if (r.overshoot) withOvershoot++;
  }

  return {
    easingClassifications: results,
    summary: {
      total: results.length,
      custom,
      withOvershoot,
      classifications,
    },
  };
}
