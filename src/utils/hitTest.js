/**
 * hitTest.js
 * Spatial queries against drawing elements for selection and erasing.
 */

// ── Distance helpers ─────────────────────────────────────────────────────────

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Shortest distance from point p to the line segment a→b */
function pointToSegmentDist(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return dist(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return dist(p, { x: a.x + t * dx, y: a.y + t * dy });
}

// ── Element hit testing ──────────────────────────────────────────────────────

/**
 * Returns true if `point` is within `radius` pixels of any part of `element`.
 */
export function isNearElement(element, point, radius) {
  switch (element.type) {
    case 'stroke': {
      const pts = element.points;
      if (pts.length === 1) return dist(point, pts[0]) < radius;
      for (let i = 0; i < pts.length - 1; i++) {
        if (pointToSegmentDist(point, pts[i], pts[i + 1]) < radius) return true;
      }
      return false;
    }

    case 'rect': {
      const { x, y, w, h } = element;
      // Expand bounding box by radius for border hit
      return (
        point.x >= x - radius && point.x <= x + w + radius &&
        point.y >= y - radius && point.y <= y + h + radius &&
        !(
          point.x > x + radius && point.x < x + w - radius &&
          point.y > y + radius && point.y < y + h - radius
        )
      );
    }

    case 'ellipse': {
      const { cx, cy, rx, ry } = element;
      // Check distance from ellipse outline
      const nx = (point.x - cx) / rx;
      const ny = (point.y - cy) / ry;
      const d = Math.hypot(nx, ny);
      return Math.abs(d - 1) < radius / Math.min(rx, ry);
    }

    case 'arrow': {
      const { x1, y1, x2, y2 } = element;
      return pointToSegmentDist(point, { x: x1, y: y1 }, { x: x2, y: y2 }) < radius;
    }

    default:
      return false;
  }
}

/**
 * Returns the topmost element (last in array) within maxRadius of point,
 * or null if none.
 */
export function findNearestElement(elements, point, maxRadius) {
  for (let i = elements.length - 1; i >= 0; i--) {
    if (isNearElement(elements[i], point, maxRadius)) {
      return elements[i];
    }
  }
  return null;
}

// ── Element movement ─────────────────────────────────────────────────────────

/** Translate an element in-place by (dx, dy) */
export function moveElementBy(element, dx, dy) {
  switch (element.type) {
    case 'stroke':
      for (const p of element.points) { p.x += dx; p.y += dy; }
      break;
    case 'rect':
      element.x += dx;
      element.y += dy;
      break;
    case 'ellipse':
      element.cx += dx;
      element.cy += dy;
      break;
    case 'arrow':
      element.x1 += dx; element.y1 += dy;
      element.x2 += dx; element.y2 += dy;
      break;
  }
}
