/**
 * Card component detection — Spec: 86aa4a39 — UI Component Detection
 *
 * Detects card patterns by finding sibling container elements that share
 * the same structure: contain at least an image/figure child, a text block,
 * and optionally a CTA (button/a). 2+ siblings with this structure = card group.
  * 
 * @example
 * // Usage of detectCards
*/

const CARD_CONTAINER_TAGS = new Set(['div', 'li', 'article', 'section']);
const IMAGE_TAGS = new Set(['img', 'figure', 'picture', 'svg']);
const TEXT_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span']);
const ACTION_TAGS = new Set(['button', 'a']);

/**

 * Executes the isVisible functionality.

 * 

 * @param {any} computed - The computed parameter.

 * @returns {any} Result of isVisible.

 * 

 * @example

 * isVisible(computed);

 */

function isVisible(computed) {
  if (computed.display === 'none') return false;
  if (computed.visibility === 'hidden') return false;
  if (computed.opacity === '0') return false;
  return true;
}

/**

 * Executes the classArray functionality.

 * 

 * @param {any} el - The el parameter.

 * @returns {any} Result of classArray.

 * 

 * @example

 * classArray(el);

 */

function classArray(el) {
  return el.className ? String(el.className).trim().split(/\s+/).filter(Boolean) : [];
}

/**
 * Analyse the direct children of a container to determine if it looks card-like.
 */
function analyseCardStructure(el) {
  let hasImage = false;
  let hasText = false;
  let hasAction = false;

  for (const child of el.children) {
    const tag = child.tagName.toLowerCase();
    if (IMAGE_TAGS.has(tag)) hasImage = true;
    if (TEXT_TAGS.has(tag)) hasText = true;
    if (ACTION_TAGS.has(tag)) hasAction = true;

    // Recurse one level for nested wrappers
    for (const grandchild of child.children) {
      const gtag = grandchild.tagName.toLowerCase();
      if (IMAGE_TAGS.has(gtag)) hasImage = true;
      if (TEXT_TAGS.has(gtag)) hasText = true;
      if (ACTION_TAGS.has(gtag)) hasAction = true;
    }
  }

  return { hasImage, hasText, hasAction };
}

/**

 * Executes the isCardLike functionality.

 * 

 * @param {any} { hasImage - The { hasImage parameter.

 * @param {any} hasText } - The hasText } parameter.

 * @returns {any} Result of isCardLike.

 * 

 * @example

 * isCardLike({ hasImage, hasText });

 */

function isCardLike({ hasImage, hasText }) {
  return hasImage && hasText;
}

/**
 * @returns {{ cards: Array<{ tag: string, parentTag: string, instanceCount: number, hasImage: boolean, hasAction: boolean, classes: string[] }> }}
 */
export function detectCards() {
  const results = [];
  const visited = new WeakSet();

  for (const parent of document.getElementsByTagName('*')) {
    const computed = getComputedStyle(parent);
    if (!isVisible(computed)) continue;

    const children = Array.from(parent.children).filter(child => {
      const tag = child.tagName.toLowerCase();
      if (!CARD_CONTAINER_TAGS.has(tag)) return false;
      const cs = getComputedStyle(child);
      return isVisible(cs);
    });

    if (children.length < 2) continue;

    // Analyse each child for card-like structure
    const cardChildren = children.filter(child => {
      const structure = analyseCardStructure(child);
      return isCardLike(structure);
    });

    if (cardChildren.length < 2) continue;

    // Avoid reporting the same group of children twice
    if (visited.has(cardChildren[0])) continue;
    for (const child of cardChildren) visited.add(child);

    // Use the first card child's structure as representative
    const representative = analyseCardStructure(cardChildren[0]);

    const repEl = cardChildren[0];
    const repComputed = getComputedStyle(repEl);

    results.push({
      tag: repEl.tagName.toLowerCase(),
      parentTag: parent.tagName.toLowerCase(),
      instanceCount: cardChildren.length,
      hasImage: representative.hasImage,
      hasAction: representative.hasAction,
      classes: classArray(repEl),
      backgroundColor: repComputed.backgroundColor ?? null,
      border: repComputed.border ?? null,
      borderRadius: repComputed.borderRadius ?? null,
      boxShadow: repComputed.boxShadow ?? null,
      padding: repComputed.padding ?? null,
    });
  }

  return { cards: results };
}
