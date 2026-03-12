/**
 * gestures.js
 * Classifies hand gestures from MediaPipe Hands landmarks (21 points).
 *
 * Gesture → Action mapping:
 *   draw   - index finger only extended  → freehand pen
 *   shape  - peace sign (index + middle) → draw shape (rect/ellipse/arrow)
 *   pinch  - thumb + index tips close    → select & drag elements
 *   erase  - all fingers closed (fist)   → erase nearby elements
 *   idle   - anything else               → cursor only
 */

// Landmark index constants from MediaPipe
export const LM = {
  WRIST:       0,
  THUMB_CMC:   1, THUMB_MCP:  2,  THUMB_IP:   3,  THUMB_TIP:  4,
  INDEX_MCP:   5, INDEX_PIP:  6,  INDEX_DIP:  7,  INDEX_TIP:  8,
  MIDDLE_MCP:  9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP:   13, RING_PIP:   14, RING_DIP:   15, RING_TIP:   16,
  PINKY_MCP:  17, PINKY_PIP:  18, PINKY_DIP:  19, PINKY_TIP:  20,
};

/** Euclidean distance between two normalized landmarks */
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * A finger is "extended" when its tip is above (lower y value) its PIP knuckle.
 * Works well for index, middle, ring, pinky. Thumb uses a separate check.
 */
function isFingerUp(lms, tipIdx, pipIdx) {
  return lms[tipIdx].y < lms[pipIdx].y - 0.02; // small threshold avoids false positives
}

/** Classify a single hand's 21 landmarks into a gesture name */
export function classifyGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return 'idle';

  const indexUp  = isFingerUp(landmarks, LM.INDEX_TIP,  LM.INDEX_PIP);
  const middleUp = isFingerUp(landmarks, LM.MIDDLE_TIP, LM.MIDDLE_PIP);
  const ringUp   = isFingerUp(landmarks, LM.RING_TIP,   LM.RING_PIP);
  const pinkyUp  = isFingerUp(landmarks, LM.PINKY_TIP,  LM.PINKY_PIP);

  // Pinch: thumb tip very close to index tip
  const pinchDist = dist(landmarks[LM.THUMB_TIP], landmarks[LM.INDEX_TIP]);
  const isPinching = pinchDist < 0.07;

  // ✊ Fist — all four fingers down → IDLE (resting position)
  if (!indexUp && !middleUp && !ringUp && !pinkyUp) {
    return 'idle';
  }

  // 🤏 Pinch — thumb & index close, middle not up → SELECT / DRAG
  if (isPinching && !middleUp) {
    return 'pinch';
  }

  // ☝️ Index only → DRAW
  if (indexUp && !middleUp && !ringUp && !pinkyUp) {
    return 'draw';
  }

  // ✌️ Peace sign (index + middle only) → SHAPE
  if (indexUp && middleUp && !ringUp && !pinkyUp) {
    return 'shape';
  }

  // 🖐️ Open palm — all four fingers up → ERASE
  if (indexUp && middleUp && ringUp && pinkyUp) {
    return 'erase';
  }

  return 'idle';
}

// ── Cursor position helpers ──────────────────────────────────────────────────

/** Index fingertip (normalized) */
export function getIndexTip(landmarks) {
  return landmarks[LM.INDEX_TIP];
}

/** Midpoint between thumb and index tips — the pinch control point */
export function getPinchPoint(landmarks) {
  const t = landmarks[LM.THUMB_TIP];
  const i = landmarks[LM.INDEX_TIP];
  return { x: (t.x + i.x) / 2, y: (t.y + i.y) / 2 };
}

/** Midpoint between index and middle tips — used for shape drawing */
export function getShapePoint(landmarks) {
  const i = landmarks[LM.INDEX_TIP];
  const m = landmarks[LM.MIDDLE_TIP];
  return { x: (i.x + m.x) / 2, y: (i.y + m.y) / 2 };
}

/** Centre of open palm — average of all five fingertips (used for erase) */
export function getPalmCenter(landmarks) {
  const tips = [LM.THUMB_TIP, LM.INDEX_TIP, LM.MIDDLE_TIP, LM.RING_TIP, LM.PINKY_TIP];
  const sum = tips.reduce(
    (acc, idx) => ({ x: acc.x + landmarks[idx].x, y: acc.y + landmarks[idx].y }),
    { x: 0, y: 0 }
  );
  return { x: sum.x / tips.length, y: sum.y / tips.length };
}

/** Average of MCP joints — represents the palm / fist centre */
export function getFistCenter(landmarks) {
  const mcps = [LM.INDEX_MCP, LM.MIDDLE_MCP, LM.RING_MCP, LM.PINKY_MCP];
  const sum = mcps.reduce(
    (acc, idx) => ({ x: acc.x + landmarks[idx].x, y: acc.y + landmarks[idx].y }),
    { x: 0, y: 0 }
  );
  return { x: sum.x / mcps.length, y: sum.y / mcps.length };
}

/**
 * Returns true when the hand is an open palm — all four fingers extended.
 * Used exclusively to detect the second hand "pause/hold" gesture.
 * Intentionally uses a slightly relaxed threshold so it works even when the
 * non-dominant hand isn't perfectly flat.
 */
export function isOpenPalm(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;
  const indexUp  = isFingerUp(landmarks, LM.INDEX_TIP,  LM.INDEX_PIP);
  const middleUp = isFingerUp(landmarks, LM.MIDDLE_TIP, LM.MIDDLE_PIP);
  const ringUp   = isFingerUp(landmarks, LM.RING_TIP,   LM.RING_PIP);
  const pinkyUp  = isFingerUp(landmarks, LM.PINKY_TIP,  LM.PINKY_PIP);
  // Require at least 3 of 4 fingers up so partial visibility still triggers
  const upCount = [indexUp, middleUp, ringUp, pinkyUp].filter(Boolean).length;
  return upCount >= 3;
}
