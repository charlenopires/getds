/**
 * Semantic design token generation
 * Converts semantic color roles and typography roles into W3C DTCG tokens
 * with meaningful, human-readable names following industry naming conventions.
 */

/**
 * Generate semantic color tokens from semantic roles.
 *
 * @param {object} semanticRoles - Output from extractSemanticColorRoles
 * @returns {Record<string, { $value: string, $type: string, $description?: string }>}
 */
export function generateSemanticColorTokens(semanticRoles = {}) {
  const tokens = {};

  const roleMap = {
    'color-background-page':    { value: semanticRoles.pageBackground,    desc: 'Page/body background color' },
    'color-background-surface': { value: semanticRoles.surfaceBackground,  desc: 'Card/panel surface background' },
    'color-brand-primary':      { value: semanticRoles.brandPrimary,       desc: 'Primary brand accent color' },
    'color-text-default':       { value: semanticRoles.textDefault,        desc: 'Default text color' },
    'color-text-muted':         { value: semanticRoles.textMuted,          desc: 'Secondary/muted text color' },
    'color-border-default':     { value: semanticRoles.borderDefault,      desc: 'Default border/divider color' },
    'color-interactive-primary':{ value: semanticRoles.interactivePrimary, desc: 'Primary interactive element color (buttons, links)' },
  };

  for (const [name, { value, desc }] of Object.entries(roleMap)) {
    if (value) {
      tokens[name] = { $value: value, $type: 'color', $description: desc };
    }
  }

  return tokens;
}

/**
 * Generate semantic typography tokens from typography roles.
 *
 * @param {Record<string, object>} typographyRoles - Output from extractTypographyRoles
 * @returns {Record<string, { $value: string, $type: string, $description?: string }>}
 */
export function generateSemanticTypographyTokens(typographyRoles = {}) {
  const tokens = {};

  const ROLE_TO_TOKEN = {
    h1: 'heading-1',
    h2: 'heading-2',
    h3: 'heading-3',
    h4: 'heading-4',
    h5: 'heading-5',
    h6: 'heading-6',
    body: 'body-default',
    small: 'body-small',
    code: 'code-default',
  };

  const PROP_TO_TYPE = {
    fontSize: 'dimension',
    fontWeight: 'number',
    lineHeight: 'number',
    letterSpacing: 'dimension',
    color: 'color',
    fontFamily: 'fontFamily',
  };

  for (const [role, style] of Object.entries(typographyRoles)) {
    const tokenBase = ROLE_TO_TOKEN[role] ?? role;
    for (const [prop, type] of Object.entries(PROP_TO_TYPE)) {
      const value = style[prop];
      if (!value || value === 'normal' || value === '0px') continue;
      const tokenName = `font-${tokenBase}-${prop.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      tokens[tokenName] = { $value: value, $type: type };
    }
  }

  return tokens;
}

/**
 * Generate all semantic tokens combined.
 *
 * @param {object} semanticRoles
 * @param {object} typographyRoles
 * @returns {{ semantic: Record<string, object>, typography: Record<string, object> }}
 */
export function generateSemanticTokens(semanticRoles, typographyRoles) {
  return {
    semantic: generateSemanticColorTokens(semanticRoles),
    typography: generateSemanticTypographyTokens(typographyRoles),
  };
}
