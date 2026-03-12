/**
 * Canvas.jsx
 * The drawing surface.  Uses a requestAnimationFrame loop to read
 * from refs every frame — no React re-renders in the hot path.
 */

import { forwardRef, useEffect } from 'react';
import {
  drawElement,
  drawStrokePreview,
  drawShapePreview,
  drawCursor,
  drawEraserIndicator,
  drawGrid,
} from '../utils/drawElement';

const Canvas = forwardRef(function Canvas(
  {
    elementsRef,
    currentStrokeRef,
    shapeStartRef,
    shapeEndRef,
    selectedIdRef,
    cursorPosRef,
    gestureRef,
    eraserPosRef,
    toolRef,
    colorRef,
    strokeWidthRef,
    eraseRadius,
  },
  canvasRef
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let rafId;

    // ── Resize handling ─────────────────────────────────────────────────────
    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // ── Main render loop ────────────────────────────────────────────────────
    function render() {
      const W = canvas.width;
      const H = canvas.height;

      // Background
      ctx.fillStyle = '#0f1c0f';
      ctx.fillRect(0, 0, W, H);

      // Subtle dot grid
      drawGrid(ctx, W, H);

      // Committed elements
      const elements  = elementsRef.current;
      const selId     = selectedIdRef.current;
      for (const el of elements) {
        drawElement(ctx, el, el.id === selId);
      }

      // In-progress freehand stroke
      const stroke = currentStrokeRef.current;
      if (stroke && stroke.length > 1) {
        drawStrokePreview(ctx, stroke, colorRef.current, strokeWidthRef.current);
      }

      // In-progress shape preview (dashed outline)
      const ss = shapeStartRef.current;
      const se = shapeEndRef.current;
      if (ss && se) {
        drawShapePreview(ctx, toolRef.current, ss, se, colorRef.current, strokeWidthRef.current);
      }

      // Eraser circle
      const ep = eraserPosRef.current;
      if (ep) drawEraserIndicator(ctx, ep, eraseRadius);

      // Cursor ring
      const cp = cursorPosRef.current;
      if (cp) drawCursor(ctx, cp, gestureRef.current);

      rafId = requestAnimationFrame(render);
    }

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []); // mount once — all state accessed via refs

  return (
    <canvas
      ref={canvasRef}
      style={{
        position : 'absolute',
        inset    : 0,
        display  : 'block',
        cursor   : 'none',
      }}
    />
  );
});

export default Canvas;
