import { describe, test, expect } from 'bun:test';
import { detectCanvasAnimations } from './detectCanvasAnimations.js';

describe('detectCanvasAnimations', () => {
  test('detects Pixi.js from globals', () => {
    const result = detectCanvasAnimations({ PIXI: true }, []);
    expect(result.canvasAnimations).toHaveLength(1);
    expect(result.canvasAnimations[0].engine).toBe('Pixi.js');
  });

  test('detects Konva from globals', () => {
    const result = detectCanvasAnimations({ Konva: true }, []);
    expect(result.canvasAnimations).toHaveLength(1);
    expect(result.canvasAnimations[0].engine).toBe('Konva');
  });

  test('detects WebGL canvas elements', () => {
    const result = detectCanvasAnimations({}, [
      { id: 'gl-canvas', width: 800, height: 600, contextType: 'webgl' },
    ]);
    expect(result.canvasAnimations).toHaveLength(1);
    expect(result.canvasAnimations[0].engine).toBe('WebGL');
    expect(result.canvasAnimations[0].dimensions).toEqual({ width: 800, height: 600 });
  });

  test('detects Canvas 2D elements', () => {
    const result = detectCanvasAnimations({}, [
      { id: 'my-canvas', width: 400, height: 300, contextType: '2d' },
    ]);
    expect(result.canvasAnimations).toHaveLength(1);
    expect(result.canvasAnimations[0].engine).toBe('Canvas 2D');
  });

  test('skips zero-size canvases', () => {
    const result = detectCanvasAnimations({}, [
      { id: '', width: 0, height: 0, contextType: '2d' },
    ]);
    expect(result.canvasAnimations).toHaveLength(0);
  });

  test('returns empty for no globals and no canvases', () => {
    const result = detectCanvasAnimations({}, []);
    expect(result.canvasAnimations).toEqual([]);
  });

  test('handles default parameters', () => {
    const result = detectCanvasAnimations();
    expect(result.canvasAnimations).toEqual([]);
  });

  test('detects multiple engines', () => {
    const result = detectCanvasAnimations({ PIXI: true, Konva: true }, []);
    expect(result.canvasAnimations).toHaveLength(2);
  });
});
