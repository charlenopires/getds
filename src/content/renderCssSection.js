/**
 * CSS snippet rendering — Spec: b0d5a227 — Markdown Report Generation
 *
 * Renders CSS snippets (keyframes, animation shorthands, media queries)
 * as fenced CSS code blocks within Markdown sections.
 */

/**
 * Render a labelled H3 heading followed by a fenced CSS code block.
 *
 * @param {string} label
 * @param {string} cssText
 * @returns {string}
 */
export function renderCssBlock(label, cssText) {
  return `### ${label}\n\n\`\`\`css\n${cssText}\n\`\`\``;
}

/**
 * Serialise a single stop's style declarations as indented CSS lines.
 *
 * @param {Record<string, string>} styles
 * @returns {string}
 */
function stopStyles(styles) {
  return Object.entries(styles)
    .map(([prop, val]) => `    ${prop}: ${val};`)
    .join('\n');
}

/**
 * Convert an array of keyframe objects to CSS `@keyframes` rule text.
 *
 * @param {Array<{ name: string, stops: Array<{ key: string, styles: Record<string, string> }> }>} keyframes
 * @returns {string}
 */
export function keyframesToCss(keyframes) {
  if (!keyframes || keyframes.length === 0) return '';

  return keyframes
    .map(({ name, stops = [] }) => {
      const stopLines = stops
        .map(({ key, styles }) => {
          const body = styles && Object.keys(styles).length > 0
            ? `\n${stopStyles(styles)}\n  `
            : '';
          return `  ${key} {${body}}`;
        })
        .join('\n');
      return `@keyframes ${name} {\n${stopLines}\n}`;
    })
    .join('\n\n');
}

/**
 * Convert an array of CSS animation descriptors to `animation:` shorthand declarations.
 *
 * @param {Array<{ name: string, duration: string, timingFunction: string, delay: string, iterationCount: string, direction: string, fillMode: string }>} animations
 * @returns {string}
 */
export function animationsToCss(animations) {
  if (!animations || animations.length === 0) return '';

  return animations
    .map(({ name, duration, timingFunction, delay, iterationCount, direction, fillMode }) => {
      const shorthand = [duration, timingFunction, delay, iterationCount, direction, fillMode]
        .filter(Boolean)
        .join(' ');
      return `/* ${name} */\nanimation: ${name} ${shorthand};`;
    })
    .join('\n\n');
}

/**
 * Render the animations layer data as a Markdown section with fenced CSS code blocks
 * for keyframes and animation shorthands.
 *
 * @param {object} data - Animations layer payload
 * @param {Array}  [data.keyframes]
 * @param {Array}  [data.cssAnimations]
 * @returns {string}
 */
export function renderAnimationsSection(data = {}) {
  const { keyframes = [], cssAnimations = [] } = data;
  const blocks = [];

  if (keyframes.length > 0) {
    blocks.push(renderCssBlock('Keyframes', keyframesToCss(keyframes)));
  }

  if (cssAnimations.length > 0) {
    blocks.push(renderCssBlock('Animation Shorthands', animationsToCss(cssAnimations)));
  }

  if (blocks.length === 0) {
    return renderCssBlock('Animations', '/* No animations detected */');
  }

  return blocks.join('\n\n');
}
