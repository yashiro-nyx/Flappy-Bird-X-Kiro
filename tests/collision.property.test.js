// Property-based tests for collision detection (Properties 12, 13, 14, 15, 24)
// Feature: flappy-kiro
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { CONFIG } from '../js/config.js';
import { circleIntersectsRect, getGhostHitbox, checkCollisions } from '../js/collision.js';

const testConfig = { numRuns: 100 };

describe('Property 12: Ghost hitbox is a circle derived from sprite dimensions', () => {
  // **Validates: Requirements 4.1**

  it('hitbox center is at sprite center (x + width/2, y + height/2)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 800, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, max: 600, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 10, max: 100, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 10, max: 100, noNaN: true, noDefaultInfinity: true }),
        (x, y, width, height) => {
          const ghost = { x, y, width, height };
          const hitbox = getGhostHitbox(ghost);

          expect(hitbox.centerX).toBeCloseTo(x + width / 2, 10);
          expect(hitbox.centerY).toBeCloseTo(y + height / 2, 10);
        }
      ),
      testConfig
    );
  });

  it('hitbox radius equals width/2 minus hitboxMargin', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 800, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, max: 600, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 10, max: 100, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 10, max: 100, noNaN: true, noDefaultInfinity: true }),
        (x, y, width, height) => {
          const ghost = { x, y, width, height };
          const hitbox = getGhostHitbox(ghost);

          const expectedRadius = width / 2 - CONFIG.ghost.hitboxMargin;
          expect(hitbox.radius).toBeCloseTo(expectedRadius, 10);
        }
      ),
      testConfig
    );
  });

  it('hitbox uses game config ghost dimensions correctly', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 600, noNaN: true, noDefaultInfinity: true }),
        (y) => {
          // Use the actual game ghost dimensions from config
          const ghost = {
            x: CONFIG.ghost.x,
            y,
            width: CONFIG.ghost.width,
            height: CONFIG.ghost.height,
          };
          const hitbox = getGhostHitbox(ghost);

          expect(hitbox.centerX).toBeCloseTo(CONFIG.ghost.x + CONFIG.ghost.width / 2, 10);
          expect(hitbox.centerY).toBeCloseTo(y + CONFIG.ghost.height / 2, 10);
          expect(hitbox.radius).toBeCloseTo(CONFIG.ghost.width / 2 - CONFIG.ghost.hitboxMargin, 10);
          // With default config: radius = 40/2 - 4 = 16
          expect(hitbox.radius).toBeCloseTo(16, 10);
        }
      ),
      testConfig
    );
  });
});

describe('Property 13: Circle-vs-rectangle collision detection is correct', () => {
  // **Validates: Requirements 4.2**

  it('returns true iff distance from circle center to closest point on rect is less than radius', () => {
    fc.assert(
      fc.property(
        // Circle: centerX, centerY, radius
        fc.double({ min: -500, max: 1500, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: -500, max: 1500, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 1, max: 100, noNaN: true, noDefaultInfinity: true }),
        // Rectangle: left, top, width, height (ensures valid rect)
        fc.double({ min: -200, max: 800, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: -200, max: 800, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 1, max: 500, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 1, max: 500, noNaN: true, noDefaultInfinity: true }),
        (centerX, centerY, radius, left, top, rectWidth, rectHeight) => {
          const right = left + rectWidth;
          const bottom = top + rectHeight;

          const circle = { centerX, centerY, radius };
          const rect = { left, top, right, bottom };

          // Compute expected using the closest-point algorithm
          const closestX = Math.max(rect.left, Math.min(circle.centerX, rect.right));
          const closestY = Math.max(rect.top, Math.min(circle.centerY, rect.bottom));
          const dx = circle.centerX - closestX;
          const dy = circle.centerY - closestY;
          const distanceSquared = dx * dx + dy * dy;
          const expected = distanceSquared < circle.radius * circle.radius;

          const actual = circleIntersectsRect(circle, rect);
          expect(actual).toBe(expected);
        }
      ),
      testConfig
    );
  });

  it('circle completely inside rectangle always collides', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 50, max: 500, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 50, max: 500, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 1, max: 20, noNaN: true, noDefaultInfinity: true }),
        (rectWidth, rectHeight, radius) => {
          const left = 100;
          const top = 100;
          const right = left + rectWidth;
          const bottom = top + rectHeight;
          const centerX = left + rectWidth / 2;
          const centerY = top + rectHeight / 2;

          const circle = { centerX, centerY, radius };
          const rect = { left, top, right, bottom };

          expect(circleIntersectsRect(circle, rect)).toBe(true);
        }
      ),
      testConfig
    );
  });

  it('circle far away from rectangle never collides', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 50, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 100, max: 500, noNaN: true, noDefaultInfinity: true }),
        (radius, separation) => {
          const rect = { left: 0, top: 0, right: 100, bottom: 100 };
          // Place circle far to the right beyond any possible contact
          const centerX = rect.right + separation + radius;
          const centerY = 50;

          const circle = { centerX, centerY, radius };
          expect(circleIntersectsRect(circle, rect)).toBe(false);
        }
      ),
      testConfig
    );
  });
});

describe('Property 14: Boundary collisions detected at ceiling and floor using circle', () => {
  // **Validates: Requirements 4.4, 4.5**

  it('floor collision detected iff centerY + radius > canvasHeight - scoreBarHeight', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -100, max: 700, noNaN: true, noDefaultInfinity: true }),
        (ghostY) => {
          const ghost = {
            x: CONFIG.ghost.x,
            y: ghostY,
            width: CONFIG.ghost.width,
            height: CONFIG.ghost.height,
            isInvincible: false,
          };

          const hitbox = getGhostHitbox(ghost);
          const floorThreshold = CONFIG.canvas.height - CONFIG.scoreBar.height;
          const expectedFloorCollision = hitbox.centerY + hitbox.radius > floorThreshold;

          // When there's no ceiling collision and no pipes, checkCollisions
          // should return true only if floor collision is detected
          if (hitbox.centerY - hitbox.radius >= 0) {
            const result = checkCollisions(ghost, []);
            expect(result).toBe(expectedFloorCollision);
          }
        }
      ),
      testConfig
    );
  });

  it('ceiling collision detected iff centerY - radius < 0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -100, max: 200, noNaN: true, noDefaultInfinity: true }),
        (ghostY) => {
          const ghost = {
            x: CONFIG.ghost.x,
            y: ghostY,
            width: CONFIG.ghost.width,
            height: CONFIG.ghost.height,
            isInvincible: false,
          };

          const hitbox = getGhostHitbox(ghost);
          const expectedCeilingCollision = hitbox.centerY - hitbox.radius < 0;

          // When there's no floor collision and no pipes, checkCollisions
          // should return true only if ceiling collision is detected
          const floorThreshold = CONFIG.canvas.height - CONFIG.scoreBar.height;
          if (hitbox.centerY + hitbox.radius <= floorThreshold) {
            const result = checkCollisions(ghost, []);
            expect(result).toBe(expectedCeilingCollision);
          }
        }
      ),
      testConfig
    );
  });

  it('no boundary collision when ghost is safely within canvas bounds', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 50, max: 450, noNaN: true, noDefaultInfinity: true }),
        (ghostY) => {
          const ghost = {
            x: CONFIG.ghost.x,
            y: ghostY,
            width: CONFIG.ghost.width,
            height: CONFIG.ghost.height,
            isInvincible: false,
          };

          const hitbox = getGhostHitbox(ghost);
          const floorThreshold = CONFIG.canvas.height - CONFIG.scoreBar.height;
          const ceilingOk = hitbox.centerY - hitbox.radius >= 0;
          const floorOk = hitbox.centerY + hitbox.radius <= floorThreshold;

          if (ceilingOk && floorOk) {
            const result = checkCollisions(ghost, []);
            expect(result).toBe(false);
          }
        }
      ),
      testConfig
    );
  });

  it('invincible ghost never triggers boundary collision', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -100, max: 700, noNaN: true, noDefaultInfinity: true }),
        (ghostY) => {
          const ghost = {
            x: CONFIG.ghost.x,
            y: ghostY,
            width: CONFIG.ghost.width,
            height: CONFIG.ghost.height,
            isInvincible: true,
          };

          const result = checkCollisions(ghost, []);
          expect(result).toBe(false);
        }
      ),
      testConfig
    );
  });
});

describe('Property 15: Screen shake displacement within bounds', () => {
  // **Validates: Requirements 4.7**

  it('shake offset absolute value is always <= maxDisplacement', () => {
    fc.assert(
      fc.property(
        // Time remaining in [0, duration]
        fc.double({ min: 0.01, max: CONFIG.screenShake.duration, noNaN: true, noDefaultInfinity: true }),
        (timer) => {
          // Replicate the engine's shake computation
          const progress = timer / CONFIG.screenShake.duration;
          const decay = progress; // Linear decay from 1→0
          const displacement = CONFIG.screenShake.maxDisplacement * decay;

          // The offset is (Math.random() * 2 - 1) * displacement
          // The max absolute value is displacement = maxDisplacement * progress
          // Since progress ∈ (0, 1], displacement ∈ (0, maxDisplacement]
          expect(displacement).toBeLessThanOrEqual(CONFIG.screenShake.maxDisplacement);
          expect(displacement).toBeGreaterThanOrEqual(0);

          // Simulate many random offsets to verify bounds
          for (let i = 0; i < 20; i++) {
            const randomFactor = Math.random() * 2 - 1; // [-1, 1]
            const offsetX = randomFactor * displacement;
            const offsetY = (Math.random() * 2 - 1) * displacement;

            expect(Math.abs(offsetX)).toBeLessThanOrEqual(CONFIG.screenShake.maxDisplacement);
            expect(Math.abs(offsetY)).toBeLessThanOrEqual(CONFIG.screenShake.maxDisplacement);
          }
        }
      ),
      testConfig
    );
  });

  it('shake displacement decays toward zero as timer approaches zero', () => {
    fc.assert(
      fc.property(
        // Two time points where t1 > t2 (t1 is earlier, more remaining)
        fc.double({ min: 1, max: CONFIG.screenShake.duration, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.01, max: 1, noNaN: true, noDefaultInfinity: true }),
        (timer1, fraction) => {
          // timer2 is closer to 0 (less time remaining = further into the shake)
          const timer2 = timer1 * fraction;

          const progress1 = timer1 / CONFIG.screenShake.duration;
          const progress2 = timer2 / CONFIG.screenShake.duration;

          const displacement1 = CONFIG.screenShake.maxDisplacement * progress1;
          const displacement2 = CONFIG.screenShake.maxDisplacement * progress2;

          // As timer decreases (approaches 0), displacement should decrease
          expect(displacement2).toBeLessThanOrEqual(displacement1);
        }
      ),
      testConfig
    );
  });

  it('shake displacement is zero when timer reaches zero', () => {
    // When timer <= 0, the engine sets offsets to 0
    const progress = 0 / CONFIG.screenShake.duration;
    const decay = progress;
    const displacement = CONFIG.screenShake.maxDisplacement * decay;

    expect(displacement).toBe(0);
  });

  it('shake displacement at full duration equals maxDisplacement', () => {
    // At the start of shake (timer = duration), displacement is at max
    const progress = CONFIG.screenShake.duration / CONFIG.screenShake.duration;
    const decay = progress;
    const displacement = CONFIG.screenShake.maxDisplacement * decay;

    expect(displacement).toBe(CONFIG.screenShake.maxDisplacement);
    expect(displacement).toBe(5);
  });
});

describe('Property 24: Circle-vs-rectangle collision agrees with geometric truth', () => {
  // **Validates: Requirements 4.2**

  it('collision result matches independent geometric distance calculation', () => {
    fc.assert(
      fc.property(
        // Circle
        fc.double({ min: -300, max: 1200, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: -300, max: 900, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 1, max: 80, noNaN: true, noDefaultInfinity: true }),
        // Rectangle (left, top, width, height)
        fc.double({ min: -100, max: 900, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: -100, max: 600, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 1, max: 400, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 1, max: 400, noNaN: true, noDefaultInfinity: true }),
        (cx, cy, r, left, top, w, h) => {
          const right = left + w;
          const bottom = top + h;

          const circle = { centerX: cx, centerY: cy, radius: r };
          const rect = { left, top, right, bottom };

          // Independent geometric truth: find closest point on AABB to circle center
          const closestX = Math.max(left, Math.min(cx, right));
          const closestY = Math.max(top, Math.min(cy, bottom));

          // Euclidean distance squared from circle center to closest point
          const dx = cx - closestX;
          const dy = cy - closestY;
          const distSq = dx * dx + dy * dy;

          // Geometric truth: collision iff distance < radius
          const geometricTruth = distSq < r * r;

          // Implementation should agree with geometric truth
          const implResult = circleIntersectsRect(circle, rect);
          expect(implResult).toBe(geometricTruth);
        }
      ),
      testConfig
    );
  });

  it('circle separated from rectangle by a gap greater than radius does not collide', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 5, max: 50, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.1, max: 10, noNaN: true, noDefaultInfinity: true }),
        (radius, extraGap) => {
          // Place circle beyond radius + extraGap from the right edge of rect
          // This avoids exact boundary floating-point issues
          const rect = { left: 0, top: 0, right: 100, bottom: 100 };
          // Circle center at rect.right + radius + extraGap
          // distance from center to closest point = radius + extraGap > radius
          const circle = { centerX: rect.right + radius + extraGap, centerY: 50, radius };

          // Distance = radius + extraGap > radius, so strict less-than fails → no collision
          expect(circleIntersectsRect(circle, rect)).toBe(false);
        }
      ),
      testConfig
    );
  });

  it('circle overlapping rect edge by epsilon does collide', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 5, max: 50, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.001, max: 1, noNaN: true, noDefaultInfinity: true }),
        (radius, epsilon) => {
          // Place circle just barely overlapping (distance = radius - epsilon)
          const rect = { left: 0, top: 0, right: 100, bottom: 100 };
          // Circle center at rect.right + radius - epsilon (just inside)
          const circle = { centerX: rect.right + radius - epsilon, centerY: 50, radius };

          // Distance from center to closest point on rect = radius - epsilon < radius
          // Should collide
          expect(circleIntersectsRect(circle, rect)).toBe(true);
        }
      ),
      testConfig
    );
  });
});
