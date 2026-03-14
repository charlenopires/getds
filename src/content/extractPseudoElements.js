/**
 * Pseudo-element extraction — Gap 1: Morphology & Geometry
 *
 * Captures ::before, ::after, ::selection, ::placeholder, ::marker
 * visual properties from computed styles.
 *
 * @returns {{ pseudoElements, selectionStyles, placeholderStyles, markerStyles, pseudoRadii }}
 */

function buildSelector(el) {
  const tag = el.tagName?.toLowerCase() ?? 'div';
  const id = el.id ? `#${el.id}` : '';
  const cls = el.classList?.length > 0 ? `.${[...el.classList].slice(0, 2).join('.')}` : '';
  return `${tag}${id}${cls}`;
}

const VISUAL_PROPS = [
  'background-color', 'border-radius', 'border', 'box-shadow',
  'width', 'height', 'position', 'transform',
  'background-image', 'filter', 'opacity', 'clip-path',
];

function extractPseudoStyles(el, pseudo) {
  const cs = getComputedStyle(el, pseudo);
  const content = cs.getPropertyValue('content').trim();
  if (!content || content === 'none' || content === 'normal') return null;

  const styles = {};
  for (const prop of VISUAL_PROPS) {
    const val = cs.getPropertyValue(prop).trim();
    if (val && val !== 'none' && val !== 'auto' && val !== '0px' && val !== 'rgba(0, 0, 0, 0)') {
      styles[prop] = val;
    }
  }

  const isPurelyDecorative =
    (content === '""' || content === "''") &&
    Object.keys(styles).length > 0;

  return { content, styles, isPurelyDecorative };
}

export function extractPseudoElements() {
  const pseudoElements = [];
  const pseudoRadii = [];
  const seenRadii = new Set();

  // Target elements likely to have pseudo-elements
  const TARGET_TAGS = new Set([
    'a', 'button', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'span', 'em', 'strong', 'blockquote', 'section', 'header', 'footer', 'nav',
  ]);
  const CLASS_PATTERNS = ['btn', 'card', 'badge', 'tag', 'nav', 'menu', 'link'];
  const allEls = Array.from(document.getElementsByTagName('*'));
  const candidates = allEls.filter(el => {
    const tag = el.tagName?.toLowerCase() ?? '';
    if (TARGET_TAGS.has(tag)) return true;
    if (el.getAttribute('role') === 'button') return true;
    const cls = (el.className ?? '').toString().toLowerCase();
    return CLASS_PATTERNS.some(p => cls.includes(p));
  });
  const elements = candidates.slice(0, 500);

  for (const el of elements) {
    const selector = buildSelector(el);

    for (const pseudo of ['::before', '::after']) {
      try {
        const result = extractPseudoStyles(el, pseudo);
        if (!result) continue;

        pseudoElements.push({
          selector,
          pseudo,
          content: result.content,
          styles: result.styles,
          isPurelyDecorative: result.isPurelyDecorative,
        });

        // Collect border-radius for merge
        const radius = result.styles['border-radius'];
        if (radius && !seenRadii.has(radius)) {
          seenRadii.add(radius);
          pseudoRadii.push({ value: radius });
        }
      } catch { continue; }
    }
  }

  // ::selection styles
  let selectionStyles = null;
  try {
    const cs = getComputedStyle(document.documentElement, '::selection');
    const bg = cs.getPropertyValue('background-color').trim();
    const color = cs.getPropertyValue('color').trim();
    if (bg && bg !== 'rgba(0, 0, 0, 0)') {
      selectionStyles = { backgroundColor: bg, color };
    }
  } catch { /* ignore */ }

  // ::placeholder styles
  const placeholderStyles = [];
  const placeholderEls = [
    ...Array.from(document.getElementsByTagName('input')),
    ...Array.from(document.getElementsByTagName('textarea')),
  ];
  for (const el of placeholderEls.slice(0, 50)) {
    try {
      const cs = getComputedStyle(el, '::placeholder');
      const color = cs.getPropertyValue('color').trim();
      if (color && color !== 'rgba(0, 0, 0, 0)') {
        placeholderStyles.push({
          selector: buildSelector(el),
          color,
          fontSize: cs.getPropertyValue('font-size').trim(),
          fontStyle: cs.getPropertyValue('font-style').trim(),
        });
      }
    } catch { continue; }
  }

  // ::marker styles
  const markerStyles = [];
  const liEls = document.getElementsByTagName('li');
  const seenMarkers = new Set();
  for (const el of Array.from(liEls).slice(0, 50)) {
    try {
      const cs = getComputedStyle(el, '::marker');
      const color = cs.getPropertyValue('color').trim();
      const fontSize = cs.getPropertyValue('font-size').trim();
      const content = cs.getPropertyValue('content').trim();
      const key = `${color}|${fontSize}|${content}`;
      if (!seenMarkers.has(key) && color) {
        seenMarkers.add(key);
        markerStyles.push({ color, fontSize, content });
      }
    } catch { continue; }
  }

  return { pseudoElements, selectionStyles, placeholderStyles, markerStyles, pseudoRadii };
}
