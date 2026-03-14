/**
 * Content script — 7-layer extraction engine
 * Spec: b169e77d
 *
 * Bundled by Bun into dist/content.js before injection.
 * Do not use this file directly — run: bun run build
 */

import { extractColors }            from './extractColors.js';
import { extractFontFamilies }      from './extractFontFamilies.js';
import { extractSpacing }           from './extractSpacing.js';
import { extractBoxShadows }        from './extractBoxShadows.js';
import { extractBorderRadius }      from './extractBorderRadius.js';
import { extractTypeScale }         from './extractTypeScale.js';
import { extractCssColorVariables } from './extractCssVariables.js';

import { generatePrimitiveTokens }  from './generatePrimitiveTokens.js';
import { generateSpacingTokens }    from './generateSpacingTokens.js';
import { generateTypographyTokens } from './generateTypographyTokens.js';
import { generateRadiusScale }      from './generateRadiusScale.js';
import { extractTypeStyles }        from './extractTypeStyles.js';
import { inferTypeRoles }           from './inferTypeRoles.js';
import { inferBaseUnit }            from './inferSpacingBase.js';

import { detectButtons }    from './detectButtons.js';
import { detectCards }      from './detectCards.js';
import { detectNavigation } from './detectNavigation.js';
import { detectModals }     from './detectModals.js';
import { detectFormInputs } from './detectFormInputs.js';

import { detectPageTemplate }       from './detectPageTemplate.js';
import { extractGridDescriptors }   from './extractCssGrid.js';
import { extractFlexDescriptors }   from './extractFlexbox.js';
import { extractBreakpointsFromSheets } from './extractBreakpoints.js';

import { extractCssAnimations }    from './extractCssAnimations.js';
import { extractTransitions }      from './extractTransitions.js';
import { extractKeyframes }        from './extractKeyframes.js';
import { extractTransforms }       from './extractTransforms.js';
import { extractWebAnimations }    from './extractWebAnimations.js';
import { extractScrollAnimations } from './extractScrollAnimations.js';
import { extractMotionPaths }      from './extractMotionPaths.js';
import { extractWillChange }       from './extractWillChange.js';

import { extractSvgDescriptor, classifySvgContext } from './extractInlineSvgs.js';
import { detectIconFonts }      from './detectIconFonts.js';
import { detectSvgImgRefs, detectSvgUseRefs, detectSvgBackgroundRefs } from './detectSvgReferences.js';
import { generateIconInventory } from './generateIconInventory.js';

import { auditAltText }          from './auditAltText.js';
import { collectAriaUsage, detectAriaMisuses } from './auditAriaUsage.js';
import { validateHeadingHierarchy } from './auditHeadingHierarchy.js';
import { hasFocusIndicator }     from './auditFocusStyles.js';
import { generateA11yScore }     from './generateA11yScore.js';

import { extractTypographyRoles }      from './extractTypographyRoles.js';
import { extractSemanticColorRoles }   from './extractSemanticColorRoles.js';

const LAYERS = [
  'visual-foundations',
  'tokens',
  'components',
  'layout-patterns',
  'animations',
  'iconography',
  'accessibility',
];

function getAllComputedStyles() {
  return Array.from(document.getElementsByTagName('*')).map(el => getComputedStyle(el));
}

function extractCssVariablesFromSheets() {
  // Build resolvedMap from :root computed styles
  const resolvedMap = {};
  try {
    const rootStyle = getComputedStyle(document.documentElement);
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (!rule.cssText) continue;
          const declRe = /(--[\w-]+)\s*:/g;
          let m;
          while ((m = declRe.exec(rule.cssText)) !== null) {
            const name = m[1];
            if (!resolvedMap[name]) {
              const resolved = rootStyle.getPropertyValue(name).trim();
              if (resolved) resolvedMap[name] = resolved;
            }
          }
        }
      } catch { continue; }
    }
  } catch { /* ignore */ }

  const vars = {};
  try {
    for (const sheet of document.styleSheets) {
      let cssText = '';
      try {
        for (const rule of sheet.cssRules) cssText += rule.cssText;
      } catch { continue; }
      Object.assign(vars, extractCssColorVariables(cssText, resolvedMap));
    }
  } catch { /* ignore */ }
  return vars;
}

async function sendStep(text) {
  try {
    await chrome.runtime.sendMessage({ type: 'STEP_UPDATE', text });
  } catch { /* ignore if popup is closed */ }
}

async function extractLayer(layer) {
  try {
    switch (layer) {

      case 'visual-foundations': {
        await sendStep('Extracting color palette…');
        const { colors }              = extractColors();
        await sendStep('Extracting typography…');
        const { fonts }               = extractFontFamilies();
        await sendStep('Extracting spacing…');
        const { values: spacing }     = extractSpacing();
        await sendStep('Extracting shadows & radii…');
        const { shadows: boxShadows } = extractBoxShadows();
        const { radii: borderRadii }  = extractBorderRadius();
        await sendStep('Extracting type scale…');
        const { scale: typeScale }    = extractTypeScale();
        await sendStep('Reading CSS variables…');
        const cssVariables            = extractCssVariablesFromSheets();
        await sendStep('Extracting typography roles…');
        const { typographyRoles } = extractTypographyRoles();
        return { colors, fonts, spacing, boxShadows, borderRadii, typeScale, cssVariables, typographyRoles };
      }

      case 'tokens': {
        await sendStep('Generating color tokens…');
        const { colors }             = extractColors();
        const { scale: typeScale }   = extractTypeScale();
        const { styles: typeStyles } = extractTypeStyles();
        const { values: rawSpacing } = extractSpacing();
        const { radii }              = extractBorderRadius();

        const primitive = generatePrimitiveTokens(colors);

        await sendStep('Generating typography tokens…');
        const roleEntries = inferTypeRoles(typeStyles, typeScale);
        const typography  = generateTypographyTokens(roleEntries);

        await sendStep('Generating spacing tokens…');
        const spacingPxValues = rawSpacing
          .map(s => {
            const m = String(s.value).match(/^([\d.]+)/);
            return { ...s, px: m ? parseFloat(m[1]) : null };
          })
          .filter(s => s.px !== null && s.px > 0)
          .sort((a, b) => a.px - b.px);

        const { baseUnit } = inferBaseUnit(spacingPxValues);
        const spacingScale = spacingPxValues.map((s, i) => ({
          step: i + 1,
          value: s.value,
          px: s.px,
          multiplier: baseUnit && baseUnit > 0 ? Math.round(s.px / baseUnit) : null,
        }));
        const spacing = generateSpacingTokens(spacingScale);

        await sendStep('Generating radius tokens…');
        const { scale: radiusScale } = generateRadiusScale(radii);
        const radius = {};
        for (const r of radiusScale) {
          radius[`radius-${r.name}`] = { $value: r.value, $type: 'dimension', $description: `${r.px}px` };
        }

        return { primitive, typography, spacing, radius };
      }

      case 'components': {
        await sendStep('Detecting buttons…');
        const { buttons }    = detectButtons();
        await sendStep('Detecting cards…');
        const { cards }      = detectCards();
        await sendStep('Detecting navigation…');
        const { navComponents: navigation } = detectNavigation();
        await sendStep('Detecting modals…');
        const { modals }     = detectModals();
        await sendStep('Detecting form inputs…');
        const { inputs }     = detectFormInputs();
        await sendStep('Classifying semantic color roles…');
        const { colors }     = extractColors();
        const semanticColorRoles = extractSemanticColorRoles(colors, buttons);
        return { buttons, cards, navigation, modals, inputs, semanticColorRoles };
      }

      case 'layout-patterns': {
        await sendStep('Detecting page template…');
        const pageTemplate   = detectPageTemplate();
        await sendStep('Extracting CSS grid…');
        const computedStyles = getAllComputedStyles();
        const grid           = extractGridDescriptors(computedStyles);
        await sendStep('Extracting flexbox…');
        const flexbox        = extractFlexDescriptors(computedStyles);
        await sendStep('Extracting breakpoints…');
        const breakpoints    = extractBreakpointsFromSheets(document.styleSheets);
        return { pageTemplate, grid, flexbox, breakpoints };
      }

      case 'animations': {
        await sendStep('Extracting CSS animations…');
        const { animations }       = extractCssAnimations();
        await sendStep('Extracting transitions…');
        const { transitions }      = extractTransitions();
        await sendStep('Extracting keyframes…');
        const { keyframes }        = extractKeyframes();
        await sendStep('Extracting transforms…');
        const { transforms }       = extractTransforms();
        await sendStep('Extracting web animations…');
        const { webAnimations }    = extractWebAnimations();
        await sendStep('Extracting scroll animations…');
        const { scrollAnimations } = extractScrollAnimations();
        await sendStep('Extracting motion paths…');
        const { motionPaths }      = extractMotionPaths();
        await sendStep('Extracting will-change hints…');
        const { willChangeHints }  = extractWillChange();
        return { animations, transitions, keyframes, transforms, webAnimations, scrollAnimations, motionPaths, willChangeHints };
      }

      case 'iconography': {
        await sendStep('Scanning inline SVGs…');
        const inlineSvgs = Array.from(document.querySelectorAll('svg')).map(svg => ({
          descriptor: extractSvgDescriptor(svg),
          context: classifySvgContext(svg),
        }));
        await sendStep('Detecting icon fonts…');
        const { fonts } = extractFontFamilies();
        const iconFonts = detectIconFonts(fonts);
        await sendStep('Detecting SVG references…');
        const svgImgRefs  = detectSvgImgRefs(Array.from(document.querySelectorAll('img')));
        const svgUseRefs  = detectSvgUseRefs(Array.from(document.querySelectorAll('use')));
        const svgBgRefs   = detectSvgBackgroundRefs(getAllComputedStyles());
        await sendStep('Building icon inventory…');
        const inventory   = generateIconInventory([...svgImgRefs, ...svgUseRefs]);
        return { inlineSvgs, iconFonts, svgImgRefs, svgUseRefs, svgBgRefs, inventory };
      }

      case 'accessibility': {
        await sendStep('Auditing alt text…');
        const images   = Array.from(document.querySelectorAll('img'));
        const elements = Array.from(document.querySelectorAll('*'));
        const altText  = auditAltText(images);
        await sendStep('Checking ARIA usage…');
        const ariaUsage   = collectAriaUsage(elements);
        const ariaMisuses = detectAriaMisuses(ariaUsage);
        await sendStep('Validating heading hierarchy…');
        const headingLevels = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'))
          .map(h => parseInt(h.tagName[1], 10));
        const headingIssues = validateHeadingHierarchy(headingLevels);
        await sendStep('Checking focus indicators…');
        const focusIssues = elements
          .filter(el => {
            const cs = getComputedStyle(el);
            const tag = el.tagName.toLowerCase();
            const focusable = ['a', 'button', 'input', 'select', 'textarea'].includes(tag)
              || el.getAttribute('tabindex') !== null;
            return focusable && !hasFocusIndicator(cs);
          })
          .map(el => ({ tag: el.tagName.toLowerCase(), issue: 'missing-focus-indicator' }));

        await sendStep('Generating accessibility score…');
        const allIssues = [
          ...altText.map(i => ({ ...i, category: 'alt-text' })),
          ...ariaMisuses.map(i => ({ ...i, category: 'aria' })),
          ...headingIssues.map(i => ({ ...i, category: 'headings', severity: 'warning' })),
          ...focusIssues.map(i => ({ ...i, category: 'focus', severity: 'warning' })),
        ];
        const score = generateA11yScore(allIssues);
        return { issues: allIssues, score, headingLevels };
      }

      default:
        return { extractedAt: Date.now() };
    }
  } catch (err) {
    console.error(`[getds:content] extractLayer(${layer}) error:`, err.message, err.stack);
    return { error: err.message };
  }
}

export async function runExtraction() {
  console.log('[getds:content] runExtraction started');
  for (const layer of LAYERS) {
    const data = await extractLayer(layer);
    console.log('[getds:content] sending LAYER_DATA:', layer, data);
    await chrome.runtime.sendMessage({ type: 'LAYER_DATA', layer, data });
  }
  console.log('[getds:content] runExtraction complete');
}

// Auto-run when injected by background (not during tests)
// Guard against double-injection
if (typeof chrome !== 'undefined' && !globalThis.__TEST__) {
  if (!globalThis.__GETDS_RUNNING__) {
    globalThis.__GETDS_RUNNING__ = true;
    runExtraction().finally(() => { globalThis.__GETDS_RUNNING__ = false; });
  } else {
    console.warn('[getds:content] already running, skipping duplicate injection');
  }
}
