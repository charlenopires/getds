/**
 * Semantic type role inference — Spec: f7625baf — Typography System Extraction
 *
 * Maps type styles to semantic roles:
 *   display, heading-1..6, body-large, body, body-small, caption, overline
 *
 * Strategy:
 *   1. Heading tags (h1-h6) → heading-N directly
 *   2. Overline: small + uppercase + letter-spacing
 *   3. Determine body baseline from the most common paragraph size
 *   4. Display: larger than h1 (or largest non-heading if no h1)
 *   5. body-large: one step above body
 *   6. body-small: one step below body
 *   7. caption: smallest remaining sizes
 *   8. body: everything else at or near baseline
 */

const HEADING_TAG_MAP = {
  h1: 'heading-1',
  h2: 'heading-2',
  h3: 'heading-3',
  h4: 'heading-4',
  h5: 'heading-5',
  h6: 'heading-6',
};

/**
 * Get the px value for a font-size string from the scale.
 * Falls back to parsing directly.
 */
function getPx(fontSize, scale) {
  const step = scale.find(s => s.value === fontSize);
  if (step) return step.px;
  const m = fontSize.match(/^([\d.]+)px$/);
  return m ? Number(m[1]) : null;
}

/**
 * @param {Array<{ tag: string, fontSize: string, fontWeight: string, letterSpacing: string, textTransform: string }>} styles
 * @param {Array<{ value: string, px: number, step: number }>} scale
 * @returns {Array<{ style: object, role: string }>}
 */
export function inferTypeRoles(styles, scale) {
  if (styles.length === 0) return [];

  const assigned = new Map(); // style reference → role

  // --- Pass 1: Heading tags → heading-N ---
  for (const s of styles) {
    const headingRole = HEADING_TAG_MAP[s.tag];
    if (headingRole) assigned.set(s, headingRole);
  }

  // --- Pass 2: Overline — small + uppercase + letter-spacing ---
  for (const s of styles) {
    if (assigned.has(s)) continue;
    const px = getPx(s.fontSize, scale);
    const isSmall     = px !== null && px <= 13;
    const isUppercase = s.textTransform === 'uppercase';
    const hasTracking = s.letterSpacing && s.letterSpacing !== '0px' && s.letterSpacing !== 'normal';
    if (isSmall && isUppercase) {
      assigned.set(s, 'overline');
    } else if (isUppercase && hasTracking && px <= 14) {
      assigned.set(s, 'overline');
    }
  }

  // --- Determine body baseline px ---
  // Prefer explicit <p> tag styles; fall back to smallest unassigned text size.
  const unassigned = styles.filter(s => !assigned.has(s));
  const pStyles = unassigned.filter(s => s.tag === 'p');

  let bodyPx;
  if (pStyles.length > 0) {
    // Use the most common p size (smallest if tie)
    const pxVals = pStyles.map(s => getPx(s.fontSize, scale)).filter(v => v !== null).sort((a, b) => a - b);
    bodyPx = pxVals[0] ?? 16;
  } else {
    // Fall back: use the most frequent size across all unassigned candidates
    const allPx = unassigned.map(s => getPx(s.fontSize, scale)).filter(v => v !== null).sort((a, b) => a - b);
    // Use the value closest to 16px as baseline
    bodyPx = allPx.reduce((best, px) => Math.abs(px - 16) < Math.abs(best - 16) ? px : best, allPx[0] ?? 16);
  }

  // --- Pass 3: Display — larger than any heading, or largest non-heading ---
  const h1Styles = styles.filter(s => s.tag === 'h1');
  const h1Px = h1Styles.length > 0
    ? Math.max(...h1Styles.map(s => getPx(s.fontSize, scale) ?? 0))
    : null;

  for (const s of styles) {
    if (assigned.has(s)) continue;
    const px = getPx(s.fontSize, scale);
    if (px === null) continue;
    if (h1Px !== null && px > h1Px) {
      assigned.set(s, 'display');
    }
  }

  // --- Pass 4: Size-relative roles vs body baseline ---
  for (const s of styles) {
    if (assigned.has(s)) continue;
    const px = getPx(s.fontSize, scale);
    if (px === null) { assigned.set(s, 'body'); continue; }

    if (px <= 12) {
      assigned.set(s, 'caption');
    } else if (px < bodyPx - 1) {
      assigned.set(s, 'body-small');
    } else if (px > bodyPx + 1) {
      assigned.set(s, 'body-large');
    } else {
      assigned.set(s, 'body');
    }
  }

  return styles.map(s => ({ style: s, role: assigned.get(s) ?? 'body' }));
}
