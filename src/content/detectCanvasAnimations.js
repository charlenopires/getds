/**
 * Canvas animation detection — Animation Analysis
 * Detects canvas-based animation libraries and patterns.
 */

/**
 * Detect canvas-based animations from globals and canvas elements.
 * @param {object} globals - Page-world globals object
 * @param {Array<{ id: string, width: number, height: number, contextType: string }>} canvasElements
 * @returns {{ canvasAnimations: Array<{ engine: string, canvasId: string|null, dimensions: { width: number, height: number }|null }> }}
 */
export function detectCanvasAnimations(globals = {}, canvasElements = []) {
  const canvasAnimations = [];

  const engines = [
    { global: 'PIXI', name: 'Pixi.js' },
    { global: 'createjs', name: 'EaselJS' },
    { global: 'Konva', name: 'Konva' },
    { global: 'fabric', name: 'Fabric.js' },
    { global: 'paper', name: 'Paper.js' },
    { global: 'p5', name: 'p5.js' },
  ];

  for (const { global, name } of engines) {
    if (globals[global]) {
      canvasAnimations.push({ engine: name, canvasId: null, dimensions: null });
    }
  }

  for (const canvas of canvasElements) {
    if (canvas.contextType === 'webgl' || canvas.contextType === 'webgl2') {
      canvasAnimations.push({
        engine: 'WebGL',
        canvasId: canvas.id || null,
        dimensions: { width: canvas.width, height: canvas.height },
      });
    } else if (canvas.width > 0 && canvas.height > 0) {
      canvasAnimations.push({
        engine: 'Canvas 2D',
        canvasId: canvas.id || null,
        dimensions: { width: canvas.width, height: canvas.height },
      });
    }
  }

  return { canvasAnimations };
}
