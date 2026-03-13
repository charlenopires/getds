/**
 * Easing normalization — Spec: 1bd1426a — Motion and Animation Extraction
 *
 * Maps CSS timing function values to human-readable easing names.
 * Recognises standard keywords and known cubic-bezier equivalents.
 */

/** Named cubic-bezier values matching CSS keyword easings */
const CUBIC_BEZIER_MAP = {
  'cubic-bezier(0.25, 0.1, 0.25, 1)': 'ease',
  'cubic-bezier(0.25,0.1,0.25,1)':    'ease',
  'cubic-bezier(0.42, 0, 1, 1)':      'ease-in',
  'cubic-bezier(0.42,0,1,1)':         'ease-in',
  'cubic-bezier(0, 0, 0.58, 1)':      'ease-out',
  'cubic-bezier(0,0,0.58,1)':         'ease-out',
  'cubic-bezier(0.42, 0, 0.58, 1)':   'ease-in-out',
  'cubic-bezier(0.42,0,0.58,1)':      'ease-in-out',
};

/** Standard CSS timing keywords that are self-documenting */
const NAMED_EASINGS = new Set([
  'ease', 'ease-in', 'ease-out', 'ease-in-out',
  'linear', 'step-start', 'step-end',
]);

/**
 * Map a CSS timing function value to a human-readable easing name.
 *
 * @param {string} value
 * @returns {string}
 */
export function normalizeEasing(value) {
  if (!value) return 'linear';

  const trimmed = value.trim();

  // Already a named easing
  if (NAMED_EASINGS.has(trimmed)) return trimmed;

  // Known cubic-bezier → named equivalent
  if (CUBIC_BEZIER_MAP[trimmed]) return CUBIC_BEZIER_MAP[trimmed];

  // Unknown cubic-bezier → prefix with "custom"
  if (trimmed.startsWith('cubic-bezier(')) return `custom ${trimmed}`;

  // steps() or other — return as-is
  return trimmed;
}

/**
 * Attach a human-readable `easingName` field to an animation descriptor.
 *
 * @param {Record<string, any>} descriptor
 * @param {string} timingKey — the key in descriptor that holds the timing function ('timingFunction' or 'easing')
 * @returns {Record<string, any>}
 */
export function attachEasingName(descriptor, timingKey = 'timingFunction') {
  const raw = descriptor[timingKey] ?? '';
  return {
    ...descriptor,
    easingName: normalizeEasing(raw),
  };
}
