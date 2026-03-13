/**
 * CSS transition extraction — Spec: 1bd1426a — Motion and Animation Extraction
 *
 * Extracts transition-property, transition-duration, transition-timing-function,
 * and transition-delay from computed styles of all visible DOM elements.
 * Deduplicates by transition signature.
 */

const SKIP_PROPERTIES = new Set(['', 'none', 'all']);

function isVisible(computed) {
  if (computed.display === 'none') return false;
  if (computed.visibility === 'hidden') return false;
  if (computed.opacity === '0') return false;
  return true;
}

/**
 * @returns {{ transitions: Array<{ property: string, duration: string, timingFunction: string, delay: string }> }}
 */
export function extractTransitions() {
  const seen = new Set();
  const transitions = [];

  for (const el of document.getElementsByTagName('*')) {
    const computed = getComputedStyle(el);
    if (!isVisible(computed)) continue;

    const property       = computed.getPropertyValue('transition-property').trim();
    const duration       = computed.getPropertyValue('transition-duration').trim();
    const timingFunction = computed.getPropertyValue('transition-timing-function').trim();
    const delay          = computed.getPropertyValue('transition-delay').trim();

    if (!property || SKIP_PROPERTIES.has(property)) continue;

    const sig = `${property}|${duration}|${timingFunction}|${delay}`;
    if (seen.has(sig)) continue;
    seen.add(sig);

    transitions.push({ property, duration, timingFunction, delay });
  }

  return { transitions };
}
