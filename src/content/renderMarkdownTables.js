/**
 * Markdown table rendering — Spec: b0d5a227 — Markdown Report Generation
 *
 * Generates GFM pipe tables for color, type scale, spacing, component,
 * icon, and accessibility inventories extracted from the 7-layer payload.
 */

/**
 * Escape pipe characters in a cell value so they don't break the table.
 *
 * @param {string|number} value
 * @returns {string}
 */
function cell(value) {
  return String(value ?? '').replace(/\|/g, '\\|');
}

/**
 * Build a GitHub-Flavoured Markdown pipe table.
 *
 * @param {string[]} headers
 * @param {Array<Array<string|number>>} rows
 * @returns {string}
 */
export function buildTable(headers, rows) {
  const headerRow  = `| ${headers.map(cell).join(' | ')} |`;
  const separator  = `| ${headers.map(() => '------').join(' | ')} |`;
  const dataRows   = rows.map(row => `| ${row.map(cell).join(' | ')} |`);
  return [headerRow, separator, ...dataRows].join('\n');
}

// ── Inventory table renderers ─────────────────────────────────────────────────

/**
 * Color inventory table.
 *
 * @param {Array<{ raw: string, hex: string, count: number }>} colors
 * @returns {string}
 */
export function renderColorTable(colors) {
  const rows = colors.map(({ hex, raw, count }) => [hex || raw, hex, count]);
  return buildTable(['Color', 'Hex', 'Count'], rows);
}

/**
 * Type scale inventory table.
 *
 * @param {Array<{ step: number, value: string, px: number, remValue: number|null }>} scale
 * @returns {string}
 */
export function renderTypeScaleTable(scale) {
  const rows = scale.map(({ step, value, px }) => [step, value, px]);
  return buildTable(['Step', 'Size', 'px'], rows);
}

/**
 * Spacing scale inventory table.
 *
 * @param {Array<{ step: number, value: string, px: number, multiplier: number|null }>} scale
 * @returns {string}
 */
export function renderSpacingTable(scale) {
  const rows = scale.map(({ step, value, px, multiplier }) => [
    step,
    value,
    px,
    multiplier ?? '—',
  ]);
  return buildTable(['Step', 'Value', 'px', 'Multiplier'], rows);
}

/**
 * Component inventory table.
 *
 * @param {Array<{ componentName: string, instanceCount: number, variantCount: number, cssClasses: string[] }>} components
 * @returns {string}
 */
export function renderComponentTable(components) {
  const rows = components.map(({ componentName, instanceCount, variantCount, cssClasses }) => [
    componentName,
    instanceCount,
    variantCount,
    cssClasses.length > 0 ? cssClasses.join(', ') : '—',
  ]);
  return buildTable(['Component', 'Instances', 'Variants', 'CSS Classes'], rows);
}

/**
 * Icon inventory table.
 *
 * @param {Array<{ primary: string, stack: string, isIconFont?: boolean }>} icons
 * @returns {string}
 */
export function renderIconTable(icons) {
  const rows = icons.map(({ primary, stack }) => [primary, stack]);
  return buildTable(['Icon Font', 'Stack'], rows);
}

/**
 * Accessibility findings table.
 *
 * @param {Array<{ type: string, severity: string, element: string, message: string, suggestion?: string }>} issues
 * @returns {string}
 */
export function renderAccessibilityTable(issues) {
  const rows = issues.map(({ severity, type, element, message, suggestion }) => [
    severity,
    type,
    element,
    message,
    suggestion ?? '—',
  ]);
  return buildTable(['Severity', 'Type', 'Element', 'Issue', 'Suggestion'], rows);
}
