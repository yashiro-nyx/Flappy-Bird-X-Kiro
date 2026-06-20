// collision.js - Circle-vs-rectangle collision detection
import { CONFIG } from './config.js';

/**
 * Computes the ghost's circular hitbox from its current position and dimensions.
 * The radius is reduced by a fairness margin so corners feel forgiving.
 *
 * @param {object} ghost - The ghost entity
 * @returns {{ centerX: number, centerY: number, radius: number }}
 */
export function getGhostHitbox(ghost) {
  const centerX = ghost.x + ghost.width / 2;
  const centerY = ghost.y + ghost.height / 2;
  const radius = ghost.width / 2 - CONFIG.ghost.hitboxMargin;
  return { centerX, centerY, radius };
}

/**
 * Tests whether a circle intersects an axis-aligned rectangle using
 * the closest-point algorithm. Compares squared distance to avoid sqrt.
 *
 * @param {{ centerX: number, centerY: number, radius: number }} circle
 * @param {{ left: number, top: number, right: number, bottom: number }} rect
 * @returns {boolean}
 */
export function circleIntersectsRect(circle, rect) {
  const closestX = Math.max(rect.left, Math.min(circle.centerX, rect.right));
  const closestY = Math.max(rect.top, Math.min(circle.centerY, rect.bottom));
  const dx = circle.centerX - closestX;
  const dy = circle.centerY - closestY;
  const distanceSquared = dx * dx + dy * dy;
  return distanceSquared < circle.radius * circle.radius;
}

/**
 * Checks the ghost circle against all active pipe AABBs (including cap extensions)
 * and against the floor (score bar top edge) and ceiling (y=0).
 *
 * Skips all checks if the ghost is currently invincible.
 *
 * @param {object} ghost - The ghost entity
 * @param {object[]} pipes - Array of active pipe objects
 * @returns {boolean} True if a collision was detected
 */
export function checkCollisions(ghost, pipes) {
  // Skip collision checks during invincibility frames
  if (ghost.isInvincible) {
    return false;
  }

  const circle = getGhostHitbox(ghost);

  // Boundary checks
  // Floor: ghost circle bottom touches score bar top edge
  if (circle.centerY + circle.radius > CONFIG.canvas.height - CONFIG.scoreBar.height) {
    return true;
  }
  // Ceiling: ghost circle top goes above canvas
  if (circle.centerY - circle.radius < 0) {
    return true;
  }

  // Cap extension: how far the cap overhangs the pipe body on each side
  const capExtension = (CONFIG.pipes.capWidth - CONFIG.pipes.width) / 2;

  // Check against each active pipe pair
  for (let i = 0; i < pipes.length; i++) {
    const pipe = pipes[i];

    // Top pipe AABB (from canvas top to bottom of cap)
    const topRect = {
      left: pipe.x - capExtension,
      top: 0,
      right: pipe.x + pipe.width + capExtension,
      bottom: pipe.topHeight + CONFIG.pipes.capHeight,
    };

    if (circleIntersectsRect(circle, topRect)) {
      return true;
    }

    // Bottom pipe AABB (from top of cap to score bar top)
    const bottomRect = {
      left: pipe.x - capExtension,
      top: pipe.bottomY - CONFIG.pipes.capHeight,
      right: pipe.x + pipe.width + capExtension,
      bottom: CONFIG.canvas.height - CONFIG.scoreBar.height,
    };

    if (circleIntersectsRect(circle, bottomRect)) {
      return true;
    }
  }

  return false;
}
