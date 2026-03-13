/**
 * Component inventory generation — Spec: 86aa4a39 — UI Component Detection
 *
 * Aggregates results from all component detectors into a summary inventory
 * table consumed by the Markdown report generator.
  * 
 * @example
 * // Usage of generateComponentInventory
*/

import { detectComponentVariants } from './detectComponentVariants.js';

/**
 * Build an inventory entry for a flat list of component instances
 * (buttons, formInputs, navComponents, modals, tables).
 */
function buildEntry(componentName, instances) {
  const cssClasses = [...new Set(instances.flatMap(i => i.classes ?? []))];
  const variantCount = detectComponentVariants(instances).length || 1;

  return {
    componentName,
    instanceCount: instances.length,
    variantCount,
    cssClasses,
  };
}

/**
 * Cards have a pre-computed instanceCount per group — aggregate differently.
 */
function buildCardEntry(cardGroups) {
  const totalInstances = cardGroups.reduce((sum, g) => sum + (g.instanceCount ?? 1), 0);
  const cssClasses = [...new Set(cardGroups.flatMap(g => g.classes ?? []))];

  return {
    componentName: 'card',
    instanceCount: totalInstances,
    variantCount: cardGroups.length,
    cssClasses,
  };
}

/**
 * @param {{
 *   buttons?: Array,
 *   formInputs?: Array,
 *   navComponents?: Array,
 *   cards?: Array,
 *   modals?: Array,
 *   tables?: Array,
 * }} detectionResults
 * @returns {Array<{ componentName: string, instanceCount: number, variantCount: number, cssClasses: string[] }>}
 */
export function generateComponentInventory(detectionResults = {}) {
  const {
    buttons      = [],
    formInputs   = [],
    navComponents = [],
    cards        = [],
    modals       = [],
    tables       = [],
  } = detectionResults;

  const inventory = [];

  if (buttons.length > 0)       inventory.push(buildEntry('button', buttons));
  if (formInputs.length > 0)    inventory.push(buildEntry('input', formInputs));
  if (navComponents.length > 0) {
    // Group nav components by navType
    const byType = new Map();
    for (const nav of navComponents) {
      const name = nav.navType ?? nav.tag ?? 'nav';
      if (!byType.has(name)) byType.set(name, []);
      byType.get(name).push(nav);
    }
    for (const [name, items] of byType) {
      inventory.push(buildEntry(name, items));
    }
  }
  if (cards.length > 0)         inventory.push(buildCardEntry(cards));
  if (modals.length > 0)        inventory.push(buildEntry('modal', modals));
  if (tables.length > 0)        inventory.push(buildEntry('table', tables));

  return inventory;
}
