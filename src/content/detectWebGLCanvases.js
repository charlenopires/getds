/**
 * WebGL Canvas detection — Layer 5
 *
 * Detects canvas elements with WebGL contexts on the page.
 *
 * @returns {{ webglCanvases: Array<{ id: string|null, width: number, height: number, cssWidth: number, cssHeight: number, contextType: string, parentInfo: string, dataAttributes: object }> }}
 */

function buildParentInfo(el) {
  const parent = el.parentElement;
  if (!parent) return 'body';
  let label = parent.tagName.toLowerCase();
  if (parent.id) return label + '#' + parent.id;
  if (parent.classList.length) {
    const cls = Array.from(parent.classList).filter(c => /^[\w-]+$/.test(c)).slice(0, 2).join('.');
    if (cls) label += '.' + cls;
  }
  return label;
}

function detectContextType(canvas) {
  // Check react-three-fiber marker
  if (canvas.__r3f) return 'webgl2';

  // Try to detect context type via getContext (may fail if already acquired)
  try {
    const ctx2 = canvas.getContext('webgl2');
    if (ctx2) return 'webgl2';
  } catch { /* ignore */ }

  try {
    const ctx1 = canvas.getContext('webgl');
    if (ctx1) return 'webgl';
  } catch { /* ignore */ }

  // Context already held — infer from parent hints
  return 'unknown-gpu';
}

function collectDataAttributes(el) {
  const attrs = {};
  if (!el.attributes) return attrs;
  for (const attr of el.attributes) {
    if (attr.name.startsWith('data-')) {
      attrs[attr.name] = attr.value;
    }
  }
  return attrs;
}

/**
 * @returns {{ webglCanvases: Array<{ id: string|null, width: number, height: number, cssWidth: number, cssHeight: number, contextType: string, parentInfo: string, dataAttributes: object }> }}
 */
export function detectWebGLCanvases() {
  const webglCanvases = [];

  for (const canvas of document.getElementsByTagName('canvas')) {
    const rect = canvas.getBoundingClientRect();
    const contextType = detectContextType(canvas);

    // Only include canvases that are likely WebGL (either context detected or has GPU-related hints)
    const parentClasses = canvas.parentElement?.className ?? '';
    const hasLibraryHint = /three|babylon|spline|webgl|r3f|canvas-3d/i.test(parentClasses)
      || /three|babylon|spline|webgl|r3f/i.test(canvas.className ?? '');
    const dataAttrs = collectDataAttributes(canvas);
    const hasDataHint = Object.keys(dataAttrs).some(k => /engine|scene|renderer|webgl/i.test(k));

    if (contextType === 'unknown-gpu' && !hasLibraryHint && !hasDataHint) continue;

    webglCanvases.push({
      id: canvas.id || null,
      width: canvas.width ?? 0,
      height: canvas.height ?? 0,
      cssWidth: Math.round(rect.width),
      cssHeight: Math.round(rect.height),
      contextType,
      parentInfo: buildParentInfo(canvas),
      dataAttributes: dataAttrs,
    });
  }

  return { webglCanvases };
}
