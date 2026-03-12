/**
 * App.jsx
 * Root component.  Wires hand tracking → gesture classification → drawing engine.
 *
 * Architecture note:
 *   All hot-path mutable state (elements, currentStroke, cursor, etc.) lives in
 *   useRef objects so the RAF render loop in Canvas.jsx can read them every frame
 *   without triggering React re-renders.  React state is only used for UI controls
 *   (tool, colour, strokeWidth) and display labels (gesture name, ready flag).
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import Canvas         from './components/Canvas';
import Toolbar        from './components/Toolbar';
import CameraPreview  from './components/CameraPreview';
import GestureHUD     from './components/GestureHUD';
import HelpOverlay    from './components/HelpOverlay';

import { useHandTracking }  from './hooks/useHandTracking';
import {
  classifyGesture,
  getIndexTip,
  getPinchPoint,
  getPalmCenter,
  getShapePoint,
  isOpenPalm,
} from './utils/gestures';
import { PositionSmoother }           from './utils/smoothing';
import { isNearElement, findNearestElement, moveElementBy } from './utils/hitTest';

// ── Constants ─────────────────────────────────────────────────────────────────

const ERASE_RADIUS      = 48;   // px — eraser circle size
const GRAB_RADIUS       = 65;   // px — pinch selection radius
const GESTURE_DEBOUNCE  = 3;    // frames — prevents flicker on gesture boundaries

// ── Unique id helper ──────────────────────────────────────────────────────────

let _idCounter = 0;
function uid() { return `el_${Date.now()}_${++_idCounter}`; }

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  // ── Video / canvas refs ───────────────────────────────────────────────────
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);

  // ── UI state (triggers React renders) ────────────────────────────────────
  const [tool,         setTool]         = useState('pen');
  const [color,        setColor]        = useState('#f0ede4');
  const [strokeWidth,  setStrokeWidth]  = useState(4);
  const [gestureLabel, setGestureLabel] = useState('—');
  const [isReady,      setIsReady]      = useState(false);
  const [showHelp,     setShowHelp]     = useState(false);

  // ── Mirror UI state into refs so callbacks stay stable ───────────────────
  const toolRef        = useRef(tool);
  const colorRef       = useRef(color);
  const strokeWidthRef = useRef(strokeWidth);
  useEffect(() => { toolRef.current        = tool;        }, [tool]);
  useEffect(() => { colorRef.current       = color;       }, [color]);
  useEffect(() => { strokeWidthRef.current = strokeWidth; }, [strokeWidth]);

  // ── Drawing state (refs — no re-render needed) ────────────────────────────
  const elements      = useRef([]);   // committed Element[]
  const history       = useRef([]);   // undo stack (each entry is a snapshot)

  const currentStroke = useRef([]);   // points[] for ongoing freehand stroke
  const shapeStart    = useRef(null); // {x,y} start corner of in-progress shape
  const shapeEnd      = useRef(null); // {x,y} end corner of in-progress shape

  const selectedId    = useRef(null); // id of element being dragged
  const prevPinchPos  = useRef(null); // previous frame pinch position (for delta)

  const cursorPos     = useRef(null); // current cursor ring position
  const eraserPos     = useRef(null); // current eraser circle position

  // ── Gesture debounce refs ─────────────────────────────────────────────────
  const gestureRef     = useRef('idle');
  const pendingGesture = useRef('idle');
  const pendingCount   = useRef(0);

  // ── Second-hand pause state ───────────────────────────────────────────────
  // When the user's second hand shows an open palm, all primary hand drawing
  // inputs are frozen so they can freely reposition their drawing hand.
  const isPaused         = useRef(false);
  const pauseDebounce    = useRef(0);   // must see open-palm N frames to pause
  const unpauseDebounce  = useRef(0);   // must see non-palm  N frames to unpause
  const PAUSE_FRAMES     = 4;
  const [paused, setPaused] = useState(false); // for HUD only

  // ── Smoothers (one per gesture type) ─────────────────────────────────────
  const drawSmoother  = useRef(new PositionSmoother(0.45));
  const pinchSmoother = useRef(new PositionSmoother(0.4));
  const eraseSmoother = useRef(new PositionSmoother(0.45));

  // ── Canvas size cache ─────────────────────────────────────────────────────
  const canvasSize = useRef({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const update = () => {
      canvasSize.current = { w: window.innerWidth, h: window.innerHeight };
    };
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ── Coordinate transform: normalised MediaPipe → canvas pixels ───────────
  // MediaPipe gives x in [0,1] left-to-right from the camera's perspective.
  // The camera feed is mirrored (selfie view), so we flip x: canvasX = (1-lm.x)*W.
  const toCanvas = useCallback((lm) => {
    const { w, h } = canvasSize.current;
    return { x: (1 - lm.x) * w, y: lm.y * h };
  }, []);

  // ── Commit helpers ────────────────────────────────────────────────────────

  const saveSnapshot = useCallback(() => {
    // Deep-enough clone for undo (elements with plain data only)
    history.current.push(elements.current.map(el => ({ ...el, points: el.points ? [...el.points.map(p => ({...p}))] : undefined })));
    if (history.current.length > 60) history.current.shift(); // cap history
  }, []);

  const commitStroke = useCallback(() => {
    const pts = currentStroke.current;
    if (pts.length > 2) {
      saveSnapshot();
      elements.current = [
        ...elements.current,
        {
          id: uid(), type: 'stroke',
          points: pts.map(p => ({ ...p })),
          color: colorRef.current,
          strokeWidth: strokeWidthRef.current,
        },
      ];
    }
    currentStroke.current = [];
    drawSmoother.current.reset();
  }, [saveSnapshot]);

  const commitShape = useCallback(() => {
    const s = shapeStart.current;
    const e = shapeEnd.current;
    if (!s || !e) return;

    const w = Math.abs(e.x - s.x);
    const h = Math.abs(e.y - s.y);
    if (w < 8 && h < 8) { shapeStart.current = null; shapeEnd.current = null; return; }

    let el = null;
    switch (toolRef.current) {
      case 'rect':
        el = { id: uid(), type: 'rect', x: Math.min(s.x,e.x), y: Math.min(s.y,e.y), w, h };
        break;
      case 'ellipse':
        el = { id: uid(), type: 'ellipse', cx: (s.x+e.x)/2, cy: (s.y+e.y)/2, rx: w/2, ry: h/2 };
        break;
      case 'arrow':
        el = { id: uid(), type: 'arrow', x1: s.x, y1: s.y, x2: e.x, y2: e.y };
        break;
    }

    if (el) {
      saveSnapshot();
      el.color = colorRef.current;
      el.strokeWidth = strokeWidthRef.current;
      elements.current = [...elements.current, el];
    }

    shapeStart.current = null;
    shapeEnd.current   = null;
  }, [saveSnapshot]);

  // ── Public actions (toolbar buttons / keyboard) ───────────────────────────

  const undo = useCallback(() => {
    if (history.current.length > 0) {
      elements.current = history.current.pop();
    }
  }, []);

  const clearAll = useCallback(() => {
    if (elements.current.length === 0) return;
    saveSnapshot();
    elements.current = [];
  }, [saveSnapshot]);

  const exportPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `handboard_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); undo(); }
      if (e.key === 'Delete') { e.preventDefault(); clearAll(); }
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); exportPNG(); }
      if (e.key === '?') setShowHelp(h => !h);
      if (e.key === '1') setTool('pen');
      if (e.key === '2') setTool('rect');
      if (e.key === '3') setTool('ellipse');
      if (e.key === '4') setTool('arrow');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, clearAll, exportPNG]);

  // ── Hand tracking results handler ─────────────────────────────────────────
  const onHandResults = useCallback((results) => {
    if (!canvasRef.current) return;

    // ── No hand detected ───────────────────────────────────────────────────
    if (!results.multiHandLandmarks?.length) {
      if (gestureRef.current === 'draw')  commitStroke();
      if (gestureRef.current === 'shape') commitShape();
      gestureRef.current   = 'idle';
      pendingCount.current = 0;
      cursorPos.current    = null;
      eraserPos.current    = null;
      selectedId.current   = null;
      prevPinchPos.current = null;
      pinchSmoother.current.reset();
      // Also clear pause state
      isPaused.current       = false;
      pauseDebounce.current  = 0;
      unpauseDebounce.current = 0;
      setPaused(false);
      setGestureLabel('—');
      return;
    }

    // ── Second-hand pause detection ────────────────────────────────────────
    // If a second hand is present and shows an open palm → freeze primary hand.
    // Both debounce counters use hysteresis: a few frames to enter AND exit the
    // paused state, preventing flickering on partial hand visibility.
    if (results.multiHandLandmarks.length >= 2) {
      // The second landmark set is the non-primary hand
      const secondLandmarks = results.multiHandLandmarks[1];
      const secondIsOpenPalm = isOpenPalm(secondLandmarks);

      if (secondIsOpenPalm) {
        unpauseDebounce.current = 0;
        pauseDebounce.current++;
        if (pauseDebounce.current >= PAUSE_FRAMES && !isPaused.current) {
          isPaused.current = true;
          setPaused(true);
          // Cleanly suspend any in-progress gesture without committing
          // (we want to HOLD the stroke, not lose it)
          drawSmoother.current.reset();
        }
      } else {
        pauseDebounce.current = 0;
        unpauseDebounce.current++;
        if (unpauseDebounce.current >= PAUSE_FRAMES && isPaused.current) {
          isPaused.current = false;
          setPaused(false);
          unpauseDebounce.current = 0;
        }
      }
    } else {
      // Only one hand — clear pause
      pauseDebounce.current = 0;
      unpauseDebounce.current++;
      if (unpauseDebounce.current >= PAUSE_FRAMES && isPaused.current) {
        isPaused.current = false;
        setPaused(false);
        unpauseDebounce.current = 0;
      }
    }

    // ── If paused, stop ALL primary hand processing ────────────────────────
    // The current stroke is held in currentStroke.current untouched.
    // The cursor freezes at its last position so there's no ghost movement.
    if (isPaused.current) return;

    const landmarks = results.multiHandLandmarks[0];

    // ── Gesture debounce ───────────────────────────────────────────────────
    const rawGesture = classifyGesture(landmarks);
    if (rawGesture === pendingGesture.current) {
      pendingCount.current++;
    } else {
      pendingGesture.current = rawGesture;
      pendingCount.current   = 1;
    }
    const newGesture = pendingCount.current >= GESTURE_DEBOUNCE
      ? rawGesture
      : gestureRef.current;

    // ── Gesture transition ─────────────────────────────────────────────────
    const prevGesture = gestureRef.current;
    if (newGesture !== prevGesture) {
      // Exit previous gesture
      if (prevGesture === 'draw')  commitStroke();
      if (prevGesture === 'shape') commitShape();
      if (prevGesture === 'pinch') {
        selectedId.current   = null;
        prevPinchPos.current = null;
        pinchSmoother.current.reset();
      }
      eraserPos.current = null;

      // Enter new gesture
      if (newGesture === 'shape') {
        // Set shape start immediately on entry so first frame isn't lost
        shapeStart.current = toCanvas(getShapePoint(landmarks));
      }

      gestureRef.current = newGesture;
      setGestureLabel(newGesture);
    }

    // ── Execute current gesture ────────────────────────────────────────────
    switch (newGesture) {

      case 'draw': {
        const tip = toCanvas(getIndexTip(landmarks));
        const pos = drawSmoother.current.update(tip);
        if (pos) {
          cursorPos.current = pos;
          // Only draw with pen tool; shapes are handled by the shape gesture
          currentStroke.current.push({ x: pos.x, y: pos.y });
        }
        break;
      }

      case 'shape': {
        const tip = toCanvas(getShapePoint(landmarks));
        cursorPos.current = tip;
        if (!shapeStart.current) shapeStart.current = tip;
        shapeEnd.current = tip;
        break;
      }

      case 'erase': {
        const palm = toCanvas(getPalmCenter(landmarks));
        const pos  = eraseSmoother.current.update(palm);
        if (pos) {
          cursorPos.current = pos;
          eraserPos.current = pos;
          // Remove all elements within eraser radius
          elements.current = elements.current.filter(
            el => !isNearElement(el, pos, ERASE_RADIUS)
          );
        }
        break;
      }

      case 'pinch': {
        const raw = toCanvas(getPinchPoint(landmarks));
        const pos = pinchSmoother.current.update(raw);
        if (!pos) break;
        cursorPos.current = pos;

        if (!selectedId.current) {
          // Try to grab the topmost nearby element
          const hit = findNearestElement(elements.current, pos, GRAB_RADIUS);
          if (hit) selectedId.current = hit.id;
          prevPinchPos.current = pos;
        } else {
          // Drag: apply delta to selected element
          if (prevPinchPos.current) {
            const dx = pos.x - prevPinchPos.current.x;
            const dy = pos.y - prevPinchPos.current.y;
            const el = elements.current.find(e => e.id === selectedId.current);
            if (el) moveElementBy(el, dx, dy);
          }
          prevPinchPos.current = pos;
        }
        break;
      }

      default: {
        // idle — just show cursor at index tip
        const tip = toCanvas(getIndexTip(landmarks));
        cursorPos.current = tip;
        eraserPos.current = null;
        break;
      }
    }
  }, [commitStroke, commitShape, toCanvas]);

  // ── Initialise hand tracking ──────────────────────────────────────────────
  useHandTracking(videoRef, onHandResults, setIsReady);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: '#0a150a' }}>

      {/* Hidden video element — camera feed goes here */}
      <video ref={videoRef} style={{ display: 'none' }} playsInline />

      {/* Drawing canvas */}
      <Canvas
        ref={canvasRef}
        elementsRef={elements}
        currentStrokeRef={currentStroke}
        shapeStartRef={shapeStart}
        shapeEndRef={shapeEnd}
        selectedIdRef={selectedId}
        cursorPosRef={cursorPos}
        gestureRef={gestureRef}
        eraserPosRef={eraserPos}
        toolRef={toolRef}
        colorRef={colorRef}
        strokeWidthRef={strokeWidthRef}
        eraseRadius={ERASE_RADIUS}
      />

      {/* Left toolbar */}
      <Toolbar
        tool={tool}           setTool={setTool}
        color={color}         setColor={setColor}
        strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth}
        onUndo={undo}
        onClear={clearAll}
        onExport={exportPNG}
        onToggleHelp={() => setShowHelp(h => !h)}
      />

      {/* Top gesture indicator */}
      <GestureHUD gesture={gestureLabel} paused={paused} />

      {/* Bottom-right camera preview */}
      <CameraPreview videoRef={videoRef} />

      {/* Help / gesture reference overlay */}
      {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}

      {/* ── Loading screen ─────────────────────────────────────────────── */}
      {!isReady && (
        <div
          style={{
            position      : 'absolute',
            inset         : 0,
            background    : 'rgba(8,15,8,0.96)',
            display       : 'flex',
            flexDirection : 'column',
            alignItems    : 'center',
            justifyContent: 'center',
            zIndex        : 100,
            gap           : 16,
          }}
        >
          {/* Logo */}
          <div style={{ fontFamily: "'Caveat',cursive", fontSize: 60, color: '#7ec850', lineHeight: 1, animation: 'pulse 2s ease infinite' }}>
            ✋
          </div>
          <div style={{ fontFamily: "'Caveat',cursive", fontSize: 38, color: '#7ec850', fontWeight: 700, letterSpacing: '-0.5px' }}>
            HandBoard
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: '#555', letterSpacing: '0.06em' }}>
            Loading hand-tracking model…
          </div>

          {/* Progress bar */}
          <div style={{ width: 220, height: 3, background: '#1a2a1a', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
            <div style={{ height: '100%', background: '#7ec850', borderRadius: 2, animation: 'progressBar 4s ease forwards' }} />
          </div>

          {/* Tips */}
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'center' }}>
            {[
              ['☝️', 'Index finger only → draw'],
              ['✌️', 'Peace sign → draw shapes'],
              ['🤏', 'Pinch → grab & move'],
              ['🖐️', 'Open palm → erase'],
            ].map(([emoji, tip]) => (
              <div key={emoji} style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#3a5a3a', display: 'flex', gap: 8 }}>
                <span>{emoji}</span><span>{tip}</span>
              </div>
            ))}
          </div>

          <div style={{ position: 'absolute', bottom: 24, fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#2a3a2a', letterSpacing: '0.05em' }}>
            Grant camera permission when prompted
          </div>
        </div>
      )}
    </div>
  );
}
