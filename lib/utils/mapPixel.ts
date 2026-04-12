import type mapboxgl from 'mapbox-gl';

/**
 * Sample RGB from the Mapbox WebGL framebuffer at screen point (must match click point).
 * Requires map initialized with `preserveDrawingBuffer: true`.
 */
export function sampleMapPixel(
  map: mapboxgl.Map,
  point: { x: number; y: number }
): { r: number; g: number; b: number } | null {
  try {
    const canvas = map.getCanvas();
    const gl = (
      map as unknown as {
        painter?: { context?: { gl?: WebGLRenderingContext } };
      }
    ).painter?.context?.gl;
    if (!gl) return null;
    const x = Math.floor(point.x);
    const y = Math.floor(canvas.height - point.y - 1);
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return null;
    const pixel = new Uint8Array(4);
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    return { r: pixel[0], g: pixel[1], b: pixel[2] };
  } catch {
    return null;
  }
}
