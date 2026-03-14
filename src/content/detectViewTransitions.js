/**
 * View Transitions API detection — Animation Analysis
 * Detects usage of the View Transitions API in stylesheets.
 */

/**
 * Detect View Transitions API usage from stylesheets.
 * @param {string[]} stylesheetTexts
 * @returns {{ hasViewTransitions: boolean, transitionNames: string[], pseudoElements: string[] }}
 */
export function detectViewTransitions(stylesheetTexts) {
  const transitionNames = new Set();
  const pseudoElements = new Set();
  const viewTransitionNameRe = /view-transition-name\s*:\s*([^;}\s]+)/g;
  const pseudoRe = /::(view-transition(?:-(?:group|image-pair|old|new))?)\(([^)]*)\)/g;

  for (const text of stylesheetTexts) {
    let match;
    let re = new RegExp(viewTransitionNameRe.source, viewTransitionNameRe.flags);
    while ((match = re.exec(text)) !== null) {
      const name = match[1].trim();
      if (name && name !== 'none') transitionNames.add(name);
    }

    re = new RegExp(pseudoRe.source, pseudoRe.flags);
    while ((match = re.exec(text)) !== null) {
      pseudoElements.add(`::${match[1]}(${match[2]})`);
    }
  }

  const hasViewTransitions = transitionNames.size > 0 || pseudoElements.size > 0;

  return {
    hasViewTransitions,
    transitionNames: Array.from(transitionNames),
    pseudoElements: Array.from(pseudoElements),
  };
}
