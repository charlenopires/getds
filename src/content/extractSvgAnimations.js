/**
 * SVG animation (SMIL) extraction — Layer 5
 *
 * Extracts SMIL animation elements (<animate>, <animateTransform>,
 * <animateMotion>, <set>) from inline SVGs in the document.
 *
 * @returns {{ svgAnimations: Array<{ type: string, attributeName: string, from: string, to: string, values: string, dur: string, repeatCount: string, selector: string }> }}
 */

const SMIL_SELECTOR = 'animate, animateTransform, animateMotion, set';

function buildSelector(el) {
  let label = el.tagName.toLowerCase();
  if (el.id) return '#' + el.id;
  if (el.classList && el.classList.length) {
    const cls = Array.from(el.classList).filter(c => /^[\w-]+$/.test(c)).slice(0, 2).join('.');
    if (cls) label += '.' + cls;
  }
  return label;
}

function getParentSelector(animEl) {
  const parent = animEl.parentElement;
  if (!parent) return 'unknown';
  // Walk up to find the SVG root or meaningful parent
  const svg = animEl.closest('svg');
  if (svg) {
    const svgSel = buildSelector(svg);
    const parentSel = buildSelector(parent);
    return parent === svg ? svgSel : `${svgSel} > ${parentSel}`;
  }
  return buildSelector(parent);
}

/**
 * @returns {{ svgAnimations: Array<{ type: string, attributeName: string, from: string, to: string, values: string, dur: string, repeatCount: string, selector: string }> }}
 */
export function extractSvgAnimations() {
  const svgAnimations = [];
  let els = [];
  try { els = document.querySelectorAll(SMIL_SELECTOR); } catch { return { svgAnimations }; }

  for (const el of els) {
    const type = el.tagName.toLowerCase();

    svgAnimations.push({
      type,
      attributeName: el.getAttribute('attributeName') ?? '',
      from: el.getAttribute('from') ?? '',
      to: el.getAttribute('to') ?? '',
      values: el.getAttribute('values') ?? '',
      dur: el.getAttribute('dur') ?? '',
      repeatCount: el.getAttribute('repeatCount') ?? '',
      selector: getParentSelector(el),
    });
  }

  return { svgAnimations };
}
