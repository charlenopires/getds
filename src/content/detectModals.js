/**
 * Modal/dialog component detection — Spec: 86aa4a39 — UI Component Detection
 *
 * Detects modals and dialogs by:
 * 1. ARIA role=dialog or role=alertdialog
 * 2. aria-modal="true"
 * 3. Native <dialog> element
 * 4. Overlay heuristic: position fixed/absolute + high z-index (≥100)
 */

const DIALOG_ROLES = new Set(['dialog', 'alertdialog']);
const OVERLAY_Z_THRESHOLD = 100;

function isVisible(computed) {
  if (computed.display === 'none') return false;
  if (computed.visibility === 'hidden') return false;
  if (computed.opacity === '0') return false;
  return true;
}

function classArray(el) {
  return el.className ? String(el.className).trim().split(/\s+/).filter(Boolean) : [];
}

function resolveZIndex(computed) {
  const raw = computed.zIndex ?? computed.getPropertyValue('z-index') ?? 'auto';
  const n = parseInt(raw, 10);
  return isNaN(n) ? 0 : n;
}

function resolvePosition(computed) {
  return computed.position ?? computed.getPropertyValue('position') ?? 'static';
}

/**
 * @returns {{ modals: Array<{ tag: string, role: string|null, ariaModal: boolean, classes: string[], detectionMethod: string }> }}
 */
export function detectModals() {
  const results = [];

  for (const el of document.getElementsByTagName('*')) {
    const computed = getComputedStyle(el);
    if (!isVisible(computed)) continue;

    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute('role');
    const ariaModal = el.getAttribute('aria-modal') === 'true';
    const classes = classArray(el);

    // 1. Native <dialog> tag
    if (tag === 'dialog') {
      results.push({ tag, role: role ?? null, ariaModal, classes, detectionMethod: 'dialog-tag' });
      continue;
    }

    // 2. ARIA dialog role
    if (role && DIALOG_ROLES.has(role)) {
      results.push({ tag, role, ariaModal, classes, detectionMethod: 'aria-role' });
      continue;
    }

    // 3. aria-modal="true" without a dialog role
    if (ariaModal) {
      results.push({ tag, role: role ?? null, ariaModal, classes, detectionMethod: 'aria-modal' });
      continue;
    }

    // 4. Overlay heuristic: fixed or absolute + high z-index
    const position = resolvePosition(computed);
    const zIndex = resolveZIndex(computed);

    if (position === 'fixed' && zIndex >= OVERLAY_Z_THRESHOLD) {
      results.push({ tag, role: role ?? null, ariaModal, classes, detectionMethod: 'overlay-fixed' });
      continue;
    }

    if (position === 'absolute' && zIndex >= OVERLAY_Z_THRESHOLD) {
      results.push({ tag, role: role ?? null, ariaModal, classes, detectionMethod: 'overlay-absolute' });
    }
  }

  return { modals: results };
}
