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

import { deduplicateColors, filterNoiseColors } from './colorDeduplication.js';
import { groupColorsByHue }          from './groupColorsByHue.js';
import { generateFontFamilyTokens }  from './generateFontFamilyTokens.js';
import { generateLineHeightTokens }  from './generateLineHeightTokens.js';
import { extractBorders }            from './extractBorders.js';
import { generateBorderTokens }      from './generateBorderTokens.js';
import { detectCssFramework }        from './detectCssFramework.js';

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

import { detectAnimationLibraries }  from './detectAnimationLibraries.js';
import { extractAnimationTriggers }  from './extractAnimationTriggers.js';
import { extractReducedMotion }      from './extractReducedMotion.js';
import { extractSvgAnimations }      from './extractSvgAnimations.js';

// 3D extraction modules
import { extract3DSceneProperties }  from './extract3DSceneProperties.js';
import { detect3DLibraries }         from './detect3DLibraries.js';
import { detectWebGLCanvases }       from './detectWebGLCanvases.js';
import { detect3DComponents }        from './detect3DComponents.js';
import { detect3DModelRefs }         from './detect3DModelRefs.js';
import { classify3DAnimations }      from './classify3DAnimations.js';

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

// Phase 1A — Layer 3 orphan extractors
import { detectTables }              from './detectTables.js';
import { detectComponentVariants }   from './detectComponentVariants.js';
import { extractComponentAnatomy }   from './extractComponentAnatomy.js';
import { extractInteractionStates }  from './extractInteractionStates.js';

// Phase 1B — Layer 4 orphan extractors
import { detectContentSections }             from './detectContentSections.js';
import { detectFormLayouts }                 from './detectFormLayouts.js';
import { detectCardGrids }                   from './detectCardGrids.js';
import { extractContainerWidths }            from './extractContainerWidths.js';
import { collectUniqueGutters }              from './extractGutters.js';
import { extractContainerQueriesFromSheets } from './detectContainerQueries.js';

// Phase 1C — Layer 1 orphan extractor
import { detectColorSchemes }  from './detectColorSchemes.js';

// Phase 1D — Layer 7 orphan extractors
import { checkContrastViolation } from './checkContrastViolations.js';
import { checkTouchTarget }       from './auditTouchTargets.js';
import { parseRgb, contrastRatio } from './contrastRatio.js';

// Phase 3 — Layout extractors
import { extractInsetPatterns }         from './classifyInsetSpacing.js';
import { extractStackInlinePatterns }   from './classifyStackInline.js';
import { inferColumnGridSystem, detectModularGrid } from './inferColumnGrid.js';
import { extractCssSpacingVariables }   from './extractCssSpacingVariables.js';
import { computeSpacingConsistencyScore } from './computeSpacingConsistency.js';
import { assignSemanticNames }          from './generateSemanticSpacingNames.js';
import { extractPositionPatterns }      from './extractPositionPatterns.js';
import { classifyLayoutType }           from './classifyLayoutType.js';
import { measureLayoutWhitespace }      from './measureWhitespace.js';
import { detectLayoutNestingDepth }     from './detectLayoutNesting.js';
import { extractFlexChildProperties }   from './extractFlexbox.js';

// Phase 3 — Animation extractors
import { extractCssAnimationVariables } from './extractCssAnimationVariables.js';
import { detectViewTransitions }        from './detectViewTransitions.js';
import { detectCanvasAnimations }       from './detectCanvasAnimations.js';

// Phase 2 — New extractors
import { extractGradients }          from './extractGradients.js';
import { extractZIndexLayers }       from './extractZIndexLayers.js';
import { extractFilters }            from './extractFilters.js';
import { extractOpacity }            from './extractOpacity.js';
import { extractOverflowPatterns }   from './extractOverflowPatterns.js';

import { collectFontFaceFromSheets } from './collectFontFaceFromSheets.js';
import { detectFontSources }         from './detectFontSources.js';
import { detectVariableFonts }       from './detectVariableFonts.js';
import { analyzeTypeScaleRatio }     from './analyzeTypeScaleRatio.js';
import { analyzeVerticalRhythm }     from './analyzeVerticalRhythm.js';
import { detectFluidTypography }     from './detectFluidTypography.js';
import { generateFontFaceTokens }    from './generateFontFaceTokens.js';
import { generateVariableFontTokens } from './generateVariableFontTokens.js';

// Gap-closing extractors
import { collectStylesheetTexts }          from './collectStylesheetTexts.js';
import { extractPseudoElements }           from './extractPseudoElements.js';
import { extractUxRefinements }            from './extractUxRefinements.js';
import { extractAtmosphericEffects }       from './extractAtmosphericEffects.js';
import { extractColorApplication }         from './extractColorApplication.js';
import { extractArtDirectionTypography }   from './extractArtDirectionTypography.js';
import { extractAnimationChoreography }    from './extractAnimationChoreography.js';
import { extractSpatialComposition }       from './extractSpatialComposition.js';

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

        // Font-face & font source detection
        await sendStep('Detecting @font-face rules…');
        const { fontFaceRules } = collectFontFaceFromSheets();
        const { fontSources } = detectFontSources(fontFaceRules);
        const { variableFonts } = detectVariableFonts(fontFaceRules);

        // Phase 1C — Color schemes (dark/light mode)
        await sendStep('Detecting color schemes…');
        const stylesheetTexts = collectStylesheetTexts();
        const colorSchemes = detectColorSchemes(stylesheetTexts);

        // Fluid typography detection
        const { fluidTypography } = detectFluidTypography(stylesheetTexts);

        // Phase 2 — New visual foundation extractors
        await sendStep('Extracting gradients & effects…');
        const computedStyles = getAllComputedStyles();
        const { gradients }          = extractGradients(computedStyles);
        const { zIndexLayers }       = extractZIndexLayers(computedStyles);
        const { filters, backdropFilters } = extractFilters(computedStyles);
        const { opacityValues }      = extractOpacity(computedStyles);
        const overflowPatterns       = extractOverflowPatterns(computedStyles);

        // Gap-closing extractors
        await sendStep('Extracting pseudo-elements…');
        const pseudoData = extractPseudoElements();
        // Merge pseudo radii into borderRadii
        for (const pr of pseudoData.pseudoRadii) {
          if (!borderRadii.some(r => r.value === pr.value)) {
            borderRadii.push(pr);
          }
        }

        await sendStep('Extracting atmospheric effects…');
        const { atmosphericEffects } = extractAtmosphericEffects();

        await sendStep('Extracting color application…');
        const { accentColors, colorFunctionMap } = extractColorApplication();

        await sendStep('Extracting art direction typography…');
        const artDirection = extractArtDirectionTypography(stylesheetTexts);

        await sendStep('Extracting UX refinements…');
        const uxRefinements = extractUxRefinements(stylesheetTexts);

        return { colors, fonts, spacing, boxShadows, borderRadii, typeScale, cssVariables, typographyRoles, colorSchemes, gradients, zIndexLayers, filters, backdropFilters, opacityValues, overflowPatterns, fontFaceRules, fontSources, variableFonts, fluidTypography, pseudoElements: pseudoData.pseudoElements, selectionStyles: pseudoData.selectionStyles, placeholderStyles: pseudoData.placeholderStyles, markerStyles: pseudoData.markerStyles, atmosphericEffects, accentColors, colorFunctionMap, artDirection, uxRefinements };
      }

      case 'tokens': {
        // Colors (enhanced with perceptual dedup)
        await sendStep('Extracting colors…');
        const { colors: rawColors }  = extractColors();
        const filtered = filterNoiseColors(rawColors, 3);
        const colors = deduplicateColors(filtered, 15);
        const colorGroups = groupColorsByHue(colors);
        const primitive = generatePrimitiveTokens(colors);

        const { scale: typeScale }   = extractTypeScale();
        const { styles: typeStyles } = extractTypeStyles();
        const { values: rawSpacing } = extractSpacing();
        const { radii }              = extractBorderRadius();

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

        // Font Family (NEW)
        await sendStep('Generating font family tokens…');
        const { fonts } = extractFontFamilies();
        const fontFamily = generateFontFamilyTokens(fonts);

        // Line Height (NEW)
        await sendStep('Generating line height tokens…');
        const lineHeight = generateLineHeightTokens(typeStyles);

        // Borders (NEW)
        await sendStep('Generating border tokens…');
        const { borders: rawBorders } = extractBorders();
        const border = generateBorderTokens(rawBorders);

        // Framework Detection (NEW)
        await sendStep('Detecting CSS framework…');
        const framework = detectCssFramework();

        // Font-face & variable font tokens
        await sendStep('Generating font-face tokens…');
        const { fontFaceRules: ffRules } = collectFontFaceFromSheets();
        const { fontSources: fSources } = detectFontSources(ffRules);
        const fontFace = generateFontFaceTokens(ffRules, fSources);

        const { variableFonts: varFonts } = detectVariableFonts(ffRules);
        const variableFont = generateVariableFontTokens(varFonts);

        // Type scale analysis
        const typeScaleAnalysis = analyzeTypeScaleRatio(typeScale);
        const verticalRhythm = analyzeVerticalRhythm(typeStyles, typeScale);

        return {
          primitive, typography, spacing, radius,
          fontFamily, lineHeight, border, framework,
          fontFace, variableFont,
          _meta: {
            colorGroups,
            rawColorCount: rawColors.length,
            dedupedColorCount: colors.length,
            typeScaleAnalysis,
            verticalRhythm,
          },
        };
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

        // Phase 1A — Orphan extractors
        await sendStep('Detecting tables…');
        const { tables }     = detectTables();

        await sendStep('Extracting interaction states…');
        const interactionStates = extractInteractionStates();

        await sendStep('Detecting component variants…');
        const buttonVariants = buttons.length > 0
          ? detectComponentVariants(buttons.map(b => ({
              tag: b.tag ?? 'button',
              classes: b.classes ?? [],
              styles: {
                'background-color': b.backgroundColor ?? '',
                'color': b.color ?? '',
                'border': b.border ?? '',
                'font-weight': b.fontWeight ?? '',
                'font-size': b.fontSize ?? '',
                'border-radius': b.borderRadius ?? '',
              },
            })))
          : [];

        await sendStep('Extracting component anatomy…');
        const anatomySamples = {};
        try {
          const firstButton = document.querySelector('button, [role="button"], a.btn, a.button');
          if (firstButton) anatomySamples.button = extractComponentAnatomy(firstButton);
        } catch { /* ignore */ }
        try {
          const firstCard = document.querySelector('[class*="card"], article, .card');
          if (firstCard) anatomySamples.card = extractComponentAnatomy(firstCard);
        } catch { /* ignore */ }

        return { buttons, cards, navigation, modals, inputs, semanticColorRoles, tables, interactionStates, buttonVariants, anatomySamples };
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

        // Phase 1B — Orphan extractors
        await sendStep('Detecting content sections…');
        let contentSections = [];
        try { contentSections = detectContentSections(); } catch { /* querySelectorAll guard */ }

        await sendStep('Detecting form layouts…');
        const formLayouts = detectFormLayouts();

        await sendStep('Detecting card grids…');
        let cardGrids = [];
        try { cardGrids = detectCardGrids(); } catch { /* querySelectorAll guard */ }

        await sendStep('Extracting container widths…');
        const containerWidths = extractContainerWidths(computedStyles);

        await sendStep('Extracting gutters…');
        const gutters = collectUniqueGutters(computedStyles);

        await sendStep('Detecting container queries…');
        const containerQueries = extractContainerQueriesFromSheets(document.styleSheets);

        // Phase 3 — Enhanced layout extraction
        await sendStep('Analyzing spatial system…');
        const { insets } = extractInsetPatterns(computedStyles);
        const stackInline = extractStackInlinePatterns(computedStyles);
        const columnSystem = inferColumnGridSystem(grid);
        const positionPatterns = extractPositionPatterns(computedStyles);
        const { flexChildren } = extractFlexChildProperties(computedStyles);

        // Spacing variables from stylesheets
        const layoutStylesheetTexts = collectStylesheetTexts();
        const { spacingVariables } = extractCssSpacingVariables(layoutStylesheetTexts);

        // Spacing scale with semantic names (reuse spacing from visual-foundations)
        await sendStep('Computing spacing consistency…');
        const { values: rawSpacing } = extractSpacing();
        const spacingPxValues = rawSpacing
          .map(s => { const m = String(s.value).match(/^([\d.]+)/); return { ...s, px: m ? parseFloat(m[1]) : null }; })
          .filter(s => s.px !== null && s.px > 0)
          .sort((a, b) => a.px - b.px);
        const { baseUnit } = inferBaseUnit(spacingPxValues);
        const spacingScale = assignSemanticNames(spacingPxValues.map((s, i) => ({
          step: i + 1, value: s.value, px: s.px,
          multiplier: baseUnit && baseUnit > 0 ? Math.round(s.px / baseUnit) : null,
        })));
        const spacingConsistency = computeSpacingConsistencyScore(
          spacingPxValues.map(s => s.px), baseUnit
        );

        // Layout type classification
        await sendStep('Classifying layout type…');
        const landmarks = pageTemplate?.landmarks ?? pageTemplate?.elements ?? [];
        const landmarkTags = landmarks.map(l => (l.role ?? l.tag ?? '').toLowerCase());
        const layoutType = classifyLayoutType({
          landmarks: landmarkTags,
          hasForm: formLayouts.length > 0,
          hasTable: false,
          hasGrid: grid.length > 0,
          hasList: false,
        });

        // Layout nesting
        const allElements = Array.from(document.getElementsByTagName('*'));
        const elementStyles = allElements.slice(0, 500).map(el => ({
          element: el, computedStyle: getComputedStyle(el),
        }));
        const layoutNesting = detectLayoutNestingDepth(elementStyles);

        // Gap-closing: Spatial composition & Z-axis
        await sendStep('Extracting spatial composition…');
        const spatialComposition = extractSpatialComposition();

        return {
          pageTemplate, grid, flexbox, breakpoints,
          contentSections, formLayouts, cardGrids, containerWidths, gutters, containerQueries,
          insets, stackInline, columnSystem, positionPatterns, flexChildren,
          spacingVariables, spacingScale, baseUnit, spacingConsistency,
          layoutType, layoutNesting, spatialComposition,
        };
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
        await sendStep('Detecting animation libraries…');
        const { libraries }        = await detectAnimationLibraries();
        await sendStep('Extracting animation triggers…');
        const { triggers }         = extractAnimationTriggers();
        await sendStep('Checking reduced motion support…');
        const { reducedMotion }    = extractReducedMotion();
        await sendStep('Extracting SVG animations…');
        const { svgAnimations }    = extractSvgAnimations();
        await sendStep('Extracting 3D scene properties…');
        const { css3DScenes }      = extract3DSceneProperties();
        await sendStep('Detecting 3D libraries…');
        const { libraries3D }      = await detect3DLibraries();
        await sendStep('Detecting WebGL canvases…');
        const { webglCanvases }    = detectWebGLCanvases();
        await sendStep('Detecting 3D components…');
        const { components3D }     = detect3DComponents();
        await sendStep('Detecting 3D model references…');
        const { modelFiles }       = detect3DModelRefs();
        await sendStep('Classifying 3D animations…');
        const { animations3D }     = classify3DAnimations({ transforms, keyframes, webAnimations });

        // Phase 3 — Enhanced animation extraction
        await sendStep('Extracting motion variables…');
        const animStylesheetTexts = collectStylesheetTexts();
        const { motionVariables } = extractCssAnimationVariables(animStylesheetTexts);

        await sendStep('Detecting view transitions…');
        const viewTransitions = detectViewTransitions(animStylesheetTexts);

        await sendStep('Detecting canvas animations…');
        // Collect canvas elements info
        const canvasEls = Array.from(document.querySelectorAll('canvas')).map(c => ({
          id: c.id || '', width: c.width || 0, height: c.height || 0,
          contextType: (c.getContext && (c.getContext('webgl2') || c.getContext('webgl'))) ? 'webgl' : '2d',
        }));
        // Reuse library globals for canvas engine detection
        const canvasGlobals = {};
        try {
          const meta = document.querySelector('meta[data-getds-libs]');
          if (meta) Object.assign(canvasGlobals, JSON.parse(meta.getAttribute('data-getds-libs') || '{}'));
        } catch { /* ignore */ }
        const { canvasAnimations } = detectCanvasAnimations(canvasGlobals, canvasEls);

        // Gap-closing: Animation choreography
        await sendStep('Extracting animation choreography…');
        const choreography = extractAnimationChoreography(animStylesheetTexts, animations, transitions);

        return { animations, transitions, keyframes, transforms, webAnimations, scrollAnimations, motionPaths, willChangeHints, libraries, triggers, reducedMotion, svgAnimations, css3DScenes, libraries3D, webglCanvases, components3D, modelFiles, animations3D, motionVariables, viewTransitions, canvasAnimations, choreography };
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

        // Phase 1D — Contrast violations
        await sendStep('Checking contrast ratios…');
        const contrastViolations = [];
        const contrastElements = elements.slice(0, 200);
        for (const el of contrastElements) {
          try {
            const cs = getComputedStyle(el);
            const fgRgb = parseRgb(cs.color);
            const bgRgb = parseRgb(cs.backgroundColor);
            if (!fgRgb || !bgRgb) continue;
            const ratio = contrastRatio(fgRgb, bgRgb);
            const fontSize = parseFloat(cs.fontSize) || 16;
            const fontWeight = parseInt(cs.fontWeight, 10) || 400;
            const isLargeText = fontSize >= 24 || (fontSize >= 18.67 && fontWeight >= 700);
            const result = checkContrastViolation(ratio, isLargeText);
            if (!result.passAA) {
              contrastViolations.push({
                tag: el.tagName.toLowerCase(),
                fg: cs.color,
                bg: cs.backgroundColor,
                ratio: Math.round(ratio * 100) / 100,
                passAA: result.passAA,
                severity: result.severity,
              });
            }
          } catch { continue; }
        }

        // Phase 1D — Touch target audit
        await sendStep('Auditing touch targets…');
        const touchTargetIssues = [];
        const interactiveEls = elements.filter(el => {
          const tag = el.tagName.toLowerCase();
          return ['a', 'button', 'input', 'select', 'textarea'].includes(tag)
            || el.getAttribute('role') === 'button'
            || el.getAttribute('tabindex') !== null;
        });
        for (const el of interactiveEls) {
          try {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            const result = checkTouchTarget(rect.width, rect.height);
            if (!result.passes) {
              touchTargetIssues.push({
                tag: el.tagName.toLowerCase(),
                width: rect.width,
                height: rect.height,
                severity: result.severity,
              });
            }
          } catch { continue; }
        }

        await sendStep('Generating accessibility score…');
        const allIssues = [
          ...altText.map(i => ({ ...i, category: 'alt-text' })),
          ...ariaMisuses.map(i => ({ ...i, category: 'aria' })),
          ...headingIssues.map(i => ({ ...i, category: 'headings', severity: 'warning' })),
          ...focusIssues.map(i => ({ ...i, category: 'focus', severity: 'warning' })),
          ...contrastViolations.map(i => ({ ...i, category: 'contrast', severity: i.severity === 'critical' ? 'error' : 'warning' })),
          ...touchTargetIssues.map(i => ({ ...i, category: 'touch-target', severity: i.severity === 'major' ? 'error' : 'warning' })),
        ];
        const score = generateA11yScore(allIssues);
        return { issues: allIssues, score, headingLevels, contrastViolations, touchTargetIssues };
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
