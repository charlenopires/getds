/**
 * Spatial Composition extraction — Gap 5: Z-Axis & Composition
 *
 * Classifies positioned elements as decorative vs structural,
 * builds Z-axis layer map, maps blend mode intent, detects custom cursors.
 *
 * @returns {{ elementClassifications, zAxisLayerMap, blendModeIntentMap, customCursors }}
 */

function buildSelector(el) {
  const tag = el.tagName?.toLowerCase() ?? 'div';
  const id = el.id ? `#${el.id}` : '';
  const cls = el.classList?.length > 0 ? `.${[...el.classList].slice(0, 2).join('.')}` : '';
  return `${tag}${id}${cls}`;
}

const SEMANTIC_TAGS = new Set(['nav', 'header', 'main', 'footer', 'aside', 'section', 'article']);
const INTERACTIVE_TAGS = new Set(['a', 'button', 'input', 'select', 'textarea']);

function hasInteractiveChildren(el) {
  try {
    const children = el.getElementsByTagName('*');
    for (const child of children) {
      const tag = child.tagName?.toLowerCase() ?? '';
      if (INTERACTIVE_TAGS.has(tag)) return true;
    }
  } catch { /* ignore */ }
  return false;
}

function classifyElement(el, cs) {
  const tag = el.tagName?.toLowerCase() ?? '';
  const textContent = (el.textContent ?? '').trim();
  const pointerEvents = cs.getPropertyValue('pointer-events').trim();
  const ariaHidden = el.getAttribute('aria-hidden') === 'true';
  const opacity = parseFloat(cs.getPropertyValue('opacity')) || 1;
  const filter = cs.getPropertyValue('filter').trim();
  const zIndex = parseInt(cs.getPropertyValue('z-index'), 10) || 0;
  const role = el.getAttribute('role');
  const tabindex = el.getAttribute('tabindex');

  let decorativeScore = 0;
  let structuralScore = 0;

  // Decorative signals
  if (pointerEvents === 'none') decorativeScore += 2;
  if (ariaHidden) decorativeScore += 2;
  if (!textContent) decorativeScore += 1;
  if (opacity < 0.5) decorativeScore += 1;
  if (filter && filter.includes('blur')) decorativeScore += 1;
  if (zIndex < 0) decorativeScore += 1;
  if (!hasInteractiveChildren(el)) decorativeScore += 1;

  // Structural signals
  if (hasInteractiveChildren(el)) structuralScore += 2;
  if (textContent.length > 10) structuralScore += 1;
  if (SEMANTIC_TAGS.has(tag)) structuralScore += 2;
  if (role) structuralScore += 1;
  if (tabindex) structuralScore += 1;

  return {
    selector: buildSelector(el),
    role: decorativeScore > structuralScore ? 'decorative' : 'structural',
    decorativeScore,
    structuralScore,
  };
}

const BLEND_MODE_INTENT = {
  'difference': 'adaptive-contrast',
  'multiply': 'shadow-overlay',
  'screen': 'glow-lightening',
  'overlay': 'contrast-enhancement',
  'soft-light': 'texture-blending',
  'hard-light': 'texture-blending',
  'color-dodge': 'glow-lightening',
  'color-burn': 'shadow-overlay',
  'exclusion': 'adaptive-contrast',
  'hue': 'color-effect',
  'saturation': 'color-effect',
  'color': 'color-effect',
  'luminosity': 'color-effect',
};

export function extractSpatialComposition() {
  const elementClassifications = [];
  const zAxisLayerMap = {
    backgroundAtmosphere: [],
    content: [],
    overlay: [],
    navigation: [],
    decorativeScatter: [],
  };
  const blendModeIntentMap = [];
  const customCursors = [];

  const allElements = Array.from(document.getElementsByTagName('*')).slice(0, 500);

  for (const el of allElements) {
    try {
      const cs = getComputedStyle(el);
      const position = cs.getPropertyValue('position').trim();
      const zIndex = parseInt(cs.getPropertyValue('z-index'), 10);
      const mixBlendMode = cs.getPropertyValue('mix-blend-mode').trim();
      const cursor = cs.getPropertyValue('cursor').trim();

      // Only classify positioned elements for z-axis
      if (position === 'absolute' || position === 'fixed' || position === 'sticky') {
        const classification = classifyElement(el, cs);
        elementClassifications.push(classification);

        // Z-Axis layer assignment
        const tag = el.tagName?.toLowerCase() ?? '';
        if (position === 'fixed' || position === 'sticky') {
          if (SEMANTIC_TAGS.has(tag) || tag === 'nav' || zIndex > 100) {
            zAxisLayerMap.navigation.push(classification.selector);
          } else {
            zAxisLayerMap.overlay.push(classification.selector);
          }
        } else if (classification.role === 'decorative') {
          if (zIndex < 0 || (!isNaN(zIndex) && zIndex < 0)) {
            zAxisLayerMap.backgroundAtmosphere.push(classification.selector);
          } else {
            zAxisLayerMap.decorativeScatter.push(classification.selector);
          }
        } else if (!isNaN(zIndex) && zIndex > 100) {
          zAxisLayerMap.overlay.push(classification.selector);
        } else {
          zAxisLayerMap.content.push(classification.selector);
        }
      }

      // Blend mode intent
      if (mixBlendMode && mixBlendMode !== 'normal') {
        const intent = BLEND_MODE_INTENT[mixBlendMode] ?? 'custom';
        const tag = el.tagName?.toLowerCase() ?? '';
        let elementRole = 'unknown';
        if (SEMANTIC_TAGS.has(tag)) elementRole = tag;
        else {
          try {
            if (el.closest('nav')) elementRole = 'navigation-child';
            else if (el.closest('header')) elementRole = 'header-child';
          } catch { /* ignore closest errors */ }
        }

        blendModeIntentMap.push({
          selector: buildSelector(el),
          blendMode: mixBlendMode,
          intent,
          elementRole,
        });
      }

      // Custom cursor detection
      if (cursor && cursor.includes('url(')) {
        customCursors.push({
          type: 'css-url',
          value: cursor,
          selector: buildSelector(el),
        });
      } else if (cursor === 'none') {
        customCursors.push({
          type: 'js-wrapper',
          value: 'none',
          selector: buildSelector(el),
        });
      }
    } catch { continue; }
  }

  // DOM elements with cursor-related class/id
  const cursorEls = allElements.filter(el => {
    const cls = (el.className ?? '').toString().toLowerCase();
    const id = (el.id ?? '').toLowerCase();
    return cls.includes('cursor') || id.includes('cursor');
  });
  for (const el of cursorEls) {
    customCursors.push({
      type: 'js-wrapper',
      value: buildSelector(el),
      selector: buildSelector(el),
    });
  }

  return { elementClassifications, zAxisLayerMap, blendModeIntentMap, customCursors };
}
