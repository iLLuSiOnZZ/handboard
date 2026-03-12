/**
 * smoothing.js
 * Exponential moving average to reduce hand-tracking jitter.
 * alpha closer to 1 = more responsive (more jitter)
 * alpha closer to 0 = smoother (more lag)
 */

export class PositionSmoother {
  constructor(alpha = 0.45) {
    this.alpha = alpha;
    this.prev = null;
  }

  update(point) {
    if (!point) return this.prev;
    if (!this.prev) {
      this.prev = { x: point.x, y: point.y };
      return { ...this.prev };
    }
    this.prev = {
      x: this.alpha * point.x + (1 - this.alpha) * this.prev.x,
      y: this.alpha * point.y + (1 - this.alpha) * this.prev.y,
    };
    return { ...this.prev };
  }

  reset() {
    this.prev = null;
  }

  get current() {
    return this.prev ? { ...this.prev } : null;
  }
}
