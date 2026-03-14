/**
 * CSS animation variable extraction — Animation Analysis
 * Extracts CSS custom properties related to motion/animation from stylesheets.
 */

const MOTION_PATTERNS = [
  { re: /--.*duration/i, category: 'duration' },
  { re: /--.*delay/i, category: 'delay' },
  { re: /--.*easing/i, category: 'easing' },
  { re: /--ease-/i, category: 'easing' },
  { re: /--duration-/i, category: 'duration' },
  { re: /--transition-/i, category: 'duration' },
];

/**
 * Determine the motion category of a CSS variable name.
 * @param {string} name
 * @returns {'duration'|'delay'|'easing'|null}
 */
function matchMotionCategory(name) {
  for (const { re, category } of MOTION_PATTERNS) {
    if (re.test(name)) return category;
  }
  return null;
}

/**
 * Extract CSS custom properties for motion from stylesheet texts.
 * @param {string[]} stylesheetTexts
 * @returns {{ motionVariables: Array<{ name: string, value: string, category: 'duration'|'delay'|'easing' }> }}
 */
export function extractCssAnimationVariables(stylesheetTexts) {
  const seen = new Map();
  const varDeclRe = /(--[\w-]+)\s*:\s*([^;}]+)/g;

  for (const text of stylesheetTexts) {
    let match;
    const re = new RegExp(varDeclRe.source, varDeclRe.flags);
    while ((match = re.exec(text)) !== null) {
      const name = match[1];
      const value = match[2].trim();
      const category = matchMotionCategory(name);
      if (!category) continue;
      if (seen.has(name)) continue;

      seen.set(name, { name, value, category });
    }
  }

  return { motionVariables: Array.from(seen.values()) };
}
