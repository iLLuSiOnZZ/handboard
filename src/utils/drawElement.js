/**
 * drawElement.js
 * All Canvas 2D rendering with a chalk-on-blackboard aesthetic.
 */

// ── Chalk style ──────────────────────────────────────────────────────────────

function applyChalkStyle(ctx, color, width, alpha = 0.92) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = width * 0.7;
  ctx.globalAlpha = alpha;
}

// ── Smooth curve through points ──────────────────────────────────────────────

function drawSmoothCurve(ctx, points) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i++) {
    const mx = (points[i].x + points[i + 1].x) / 2;
    const my = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, mx, my);
  }

  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

// ── Public: render a committed element ──────────────────────────────────────

export function drawElement(ctx, element, isSelected = false) {
  ctx.save();

  if (isSelected) {
    // Selection glow
    ctx.shadowColor = '#4af';
    ctx.shadowBlur = 22;
  }

  switch (element.type) {
    case 'stroke': {
      applyChalkStyle(ctx, element.color, element.strokeWidth);
      drawSmoothCurve(ctx, element.points);
      break;
    }

    case 'rect': {
      applyChalkStyle(ctx, element.color, element.strokeWidth);
      ctx.beginPath();
      ctx.rect(element.x, element.y, element.w, element.h);
      ctx.stroke();
      break;
    }

    case 'ellipse': {
      applyChalkStyle(ctx, element.color, element.strokeWidth);
      ctx.beginPath();
      ctx.ellipse(
        element.cx, element.cy,
        Math.max(2, Math.abs(element.rx)),
        Math.max(2, Math.abs(element.ry)),
        0, 0, Math.PI * 2
      );
      ctx.stroke();
      break;
    }

    case 'arrow': {
      applyChalkStyle(ctx, element.color, element.strokeWidth);
      _drawArrowShape(ctx, element.x1, element.y1, element.x2, element.y2, element.strokeWidth);
      break;
    }
  }

  ctx.restore();
}

// ── Arrow helper ─────────────────────────────────────────────────────────────

function _drawArrowShape(ctx, x1, y1, x2, y2, width) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = Math.max(18, width * 5);

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLen * Math.cos(angle - Math.PI / 6),
    y2 - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLen * Math.cos(angle + Math.PI / 6),
    y2 - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

// ── In-progress previews ─────────────────────────────────────────────────────

export function drawStrokePreview(ctx, points, color, width) {
  if (!points || points.length < 2) return;
  ctx.save();
  applyChalkStyle(ctx, color, width);
  drawSmoothCurve(ctx, points);
  ctx.restore();
}

export function drawShapePreview(ctx, tool, start, end, color, width) {
  if (!start || !end) return;
  ctx.save();
  applyChalkStyle(ctx, color, width, 0.7);
  ctx.setLineDash([8, 5]);

  switch (tool) {
    case 'rect': {
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const w = Math.abs(end.x - start.x);
      const h = Math.abs(end.y - start.y);
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.stroke();
      break;
    }

    case 'ellipse': {
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;
      const rx = Math.abs(end.x - start.x) / 2;
      const ry = Math.abs(end.y - start.y) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(2, rx), Math.max(2, ry), 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'arrow': {
      ctx.setLineDash([]);
      _drawArrowShape(ctx, start.x, start.y, end.x, end.y, width);
      break;
    }
  }

  ctx.restore();
}

// ── Cursor ───────────────────────────────────────────────────────────────────

const CURSOR_CFG = {
  draw:  { color: '#f0ede4', radius: 10 },
  shape: { color: '#74c0fc', radius: 12 },
  pinch: { color: '#ffd43b', radius: 14 },
  erase: { color: '#ff6b6b', radius: 14 },
  idle:  { color: 'rgba(200,200,200,0.4)', radius: 8 },
};

export function drawCursor(ctx, pos, gesture) {
  const cfg = CURSOR_CFG[gesture] || CURSOR_CFG.idle;

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.shadowColor = cfg.color;
  ctx.shadowBlur = 14;

  // Ring
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, cfg.radius, 0, Math.PI * 2);
  ctx.strokeStyle = cfg.color;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Centre dot
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
  ctx.fillStyle = cfg.color;
  ctx.fill();

  ctx.restore();
}

// ── Eraser radius indicator ───────────────────────────────────────────────────

export function drawEraserIndicator(ctx, pos, radius) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 80, 80, 0.55)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.stroke();
  ctx.restore();
}

// ── Background grid ───────────────────────────────────────────────────────────

export function drawGrid(ctx, W, H) {
  const SIZE = 44;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.028)';
  ctx.lineWidth = 1;

  for (let x = 0; x < W; x += SIZE) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += SIZE) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Dot at each intersection for a subtle dot-grid feel
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let x = 0; x < W; x += SIZE) {
    for (let y = 0; y < H; y += SIZE) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
