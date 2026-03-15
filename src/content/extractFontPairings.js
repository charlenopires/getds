/**
 * Font pairing strategy — cross-references typography roles with font list
 * to identify headline, body, accent, and code font assignments.
 *
 * Operates on already-extracted data, no additional DOM traversals.
 */

/**
 * Extract font pairing strategy from typography roles and font list.
 *
 * @param {Record<string, { fontFamily?: string }>} typographyRoles — h1-h6/body/code → style map
 * @param {Array<{ primary?: string, stack?: string }>} fonts — extracted font families
 * @returns {{ fontPairings: { headlineFont: string|null, bodyFont: string|null, accentFont: string|null, codeFont: string|null, pairingType: string, roleMap: Record<string, string> } }}
 */
export function extractFontPairings(typographyRoles = {}, fonts = []) {
  const roleMap = {};
  const fontToRoles = {};

  const ROLES = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'small', 'code'];

  for (const role of ROLES) {
    const entry = typographyRoles[role];
    if (!entry?.fontFamily) continue;

    // Extract primary font name (first in stack, strip quotes)
    const primary = entry.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
    if (!primary) continue;

    roleMap[role] = primary;

    if (!fontToRoles[primary]) fontToRoles[primary] = [];
    fontToRoles[primary].push(role);
  }

  // Determine headline, body, accent, code fonts
  let headlineFont = null;
  let bodyFont = null;
  let accentFont = null;
  let codeFont = null;

  // Code font: font used by 'code' role
  if (roleMap.code) {
    codeFont = roleMap.code;
  }

  // Body font: font used by 'body' role
  if (roleMap.body) {
    bodyFont = roleMap.body;
  }

  // Headline font: font used by h1 (fallback to h2, h3)
  for (const h of ['h1', 'h2', 'h3']) {
    if (roleMap[h]) {
      headlineFont = roleMap[h];
      break;
    }
  }

  // Accent font: a font used by some headings but different from both headline and body
  const uniqueFonts = new Set(Object.values(roleMap));
  uniqueFonts.delete(codeFont);

  for (const font of uniqueFonts) {
    if (font !== headlineFont && font !== bodyFont) {
      // Check it's used for headings
      const roles = fontToRoles[font] ?? [];
      const isHeadingFont = roles.some(r => /^h[1-6]$/.test(r));
      if (isHeadingFont) {
        accentFont = font;
        break;
      }
    }
  }

  // Classify pairing type
  const distinctFonts = new Set(Object.values(roleMap));
  distinctFonts.delete(codeFont); // code font doesn't count for pairing classification
  const count = distinctFonts.size;

  let pairingType = 'single';
  if (count === 2) pairingType = 'dual';
  else if (count === 3) pairingType = 'triple';
  else if (count > 3) pairingType = 'multi';

  return {
    fontPairings: {
      headlineFont,
      bodyFont,
      accentFont,
      codeFont,
      pairingType,
      roleMap,
    },
  };
}
