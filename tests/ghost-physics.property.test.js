// Property-based tests for ghost physics (Properties 2, 3, 4, 5, 6)
// Feature: flappy-kiro
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { CONFIG } from '../js/config.js';
import { updatePhysics, applyFlap } from '../js/physics.js';

const testConfig = { numRuns: 100 };

function createTestGhost(overrides = {}) {
  return {
    x: CONFIG.ghost.x,
    y: CONFIG.ghost.startY,
    velocity: 0,
    width: CONFIG.ghost.width,
    height: CONFIG.ghost.height,
    centerX: CONFIG.ghost.x + CONFIG.ghost.width / 2,
    centerY: CONFIG.ghost.startY + CONFIG.ghost.height / 2,
    rotation: 0,
    ...overrides,
  };
}

function createTestGameState(ghostOverrides = {}) {
  return {
    current: 'playing',
    speedMultiplier: 1.0,
    entities: {
      ghost: createTestGhost(ghostOverrides),
      pipePool: null,
      clouds: null,
      particlePool: null,
      scorePopups: [],
    },
  };
}

describe('Property 2: Ghost physics — gravity and terminal velocity', () => {
  // **Validates: Requirements 2.1, 2.2**

  it('gravity increases velocity, capped at terminal velocity', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -20, max: 20, noNaN: true, noDefaultInfinity: true }),
        (currentVelocity) => {
          const gameState = createTestGameState({ velocity: currentVelocity });
          const ghost = gameState.entities.ghost;

          // Apply one physics frame (dt = frameTime means dtFactor = 1)
          updatePhysics(gameState, CONFIG.physics.frameTime);

          // Expected: velocity += gravity, capped at terminalVelocity
          const expectedVelocity = Math.min(
            currentVelocity + CONFIG.physics.gravity,
            CONFIG.physics.terminalVelocity
          );

          expect(ghost.velocity).toBeCloseTo(expectedVelocity, 10);
        }
      ),
      testConfig
    );
  });

  it('velocity never exceeds terminal velocity after physics update', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -50, max: 50, noNaN: true, noDefaultInfinity: true }),
        (currentVelocity) => {
          const gameState = createTestGameState({ velocity: currentVelocity });
          const ghost = gameState.entities.ghost;

          updatePhysics(gameState, CONFIG.physics.frameTime);

          expect(ghost.velocity).toBeLessThanOrEqual(CONFIG.physics.terminalVelocity);
        }
      ),
      testConfig
    );
  });
});

describe('Property 3: Flap always resets velocity to impulse', () => {
  // **Validates: Requirements 2.3**

  it('applying flap sets velocity to exactly flapImpulse regardless of prior velocity', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -50, max: 50, noNaN: true, noDefaultInfinity: true }),
        (currentVelocity) => {
          const ghost = createTestGhost({ velocity: currentVelocity });

          applyFlap(ghost);

          expect(ghost.velocity).toBe(CONFIG.physics.flapImpulse);
          expect(ghost.velocity).toBe(-10);
        }
      ),
      testConfig
    );
  });
});

describe('Property 4: Delta-time position integration', () => {
  // **Validates: Requirements 2.4, 2.5**

  it('position change equals (velocity + gravity) * dtFactor, capped at terminal velocity', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -15, max: 11, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 1, max: CONFIG.physics.frameTime * 3, noNaN: true, noDefaultInfinity: true }),
        (initialVelocity, dt) => {
          const startY = CONFIG.ghost.startY;
          const gameState = createTestGameState({ velocity: initialVelocity, y: startY });
          const ghost = gameState.entities.ghost;

          const dtFactor = Math.min(dt, CONFIG.physics.frameTime * 3) / CONFIG.physics.frameTime;

          // Gravity is applied first: newVelocity = min(initialVelocity + gravity * dtFactor, terminalVelocity)
          const newVelocity = Math.min(
            initialVelocity + CONFIG.physics.gravity * dtFactor,
            CONFIG.physics.terminalVelocity
          );

          // Position integrates using the new velocity: y += newVelocity * dtFactor
          const expectedY = startY + newVelocity * dtFactor;

          updatePhysics(gameState, dt);

          expect(ghost.y).toBeCloseTo(expectedY, 10);
        }
      ),
      testConfig
    );
  });

  it('when dt equals frameTime, position change equals velocity after gravity', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -10, max: 10, noNaN: true, noDefaultInfinity: true }),
        (initialVelocity) => {
          const startY = CONFIG.ghost.startY;
          const gameState = createTestGameState({ velocity: initialVelocity, y: startY });
          const ghost = gameState.entities.ghost;

          // dt = frameTime means dtFactor = 1
          updatePhysics(gameState, CONFIG.physics.frameTime);

          const newVelocity = Math.min(
            initialVelocity + CONFIG.physics.gravity,
            CONFIG.physics.terminalVelocity
          );
          const expectedY = startY + newVelocity;

          expect(ghost.y).toBeCloseTo(expectedY, 10);
        }
      ),
      testConfig
    );
  });
});

describe('Property 5: Ghost horizontal position invariant', () => {
  // **Validates: Requirements 2.6**

  it('ghost x coordinate remains unchanged after physics updates', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -20, max: 20, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 1, max: 100, noNaN: true, noDefaultInfinity: true }),
        (velocity, dt) => {
          const gameState = createTestGameState({ velocity });
          const ghost = gameState.entities.ghost;
          const originalX = ghost.x;

          updatePhysics(gameState, dt);

          expect(ghost.x).toBe(originalX);
          expect(ghost.x).toBe(CONFIG.ghost.x);
        }
      ),
      testConfig
    );
  });

  it('ghost x remains unchanged after flap followed by physics update', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -20, max: 20, noNaN: true, noDefaultInfinity: true }),
        (velocity) => {
          const gameState = createTestGameState({ velocity });
          const ghost = gameState.entities.ghost;
          const originalX = ghost.x;

          applyFlap(ghost);
          updatePhysics(gameState, CONFIG.physics.frameTime);

          expect(ghost.x).toBe(originalX);
          expect(ghost.x).toBe(CONFIG.ghost.x);
        }
      ),
      testConfig
    );
  });
});

describe('Property 6: Ghost rotation clamped and interpolated', () => {
  // **Validates: Requirements 2.7**

  it('rotation linearly interpolates between maxUp and maxDown based on velocity', () => {
    fc.assert(
      fc.property(
        fc.double({
          min: CONFIG.physics.flapImpulse,
          max: CONFIG.physics.terminalVelocity,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        (velocity) => {
          const gameState = createTestGameState({ velocity });
          const ghost = gameState.entities.ghost;

          // We need to set velocity such that after gravity, it stays in range.
          // Instead, directly compute what rotation should be after physics update.
          updatePhysics(gameState, CONFIG.physics.frameTime);

          // After physics, velocity may have changed due to gravity.
          // Rotation is computed from the post-gravity velocity.
          const postVelocity = ghost.velocity;
          const velocityRange = CONFIG.physics.terminalVelocity - CONFIG.physics.flapImpulse;
          const velocityNormalized = (postVelocity - CONFIG.physics.flapImpulse) / velocityRange;
          const clampedNorm = Math.max(0, Math.min(1, velocityNormalized));
          const expectedRotation = CONFIG.rotation.maxUp + clampedNorm * (CONFIG.rotation.maxDown - CONFIG.rotation.maxUp);

          expect(ghost.rotation).toBeCloseTo(expectedRotation, 10);
        }
      ),
      testConfig
    );
  });

  it('rotation is clamped to maxUp for velocities at or below flapImpulse', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -50, max: CONFIG.physics.flapImpulse, noNaN: true, noDefaultInfinity: true }),
        (velocity) => {
          // Set velocity very low so that even after gravity it stays below flapImpulse
          const veryLowVelocity = velocity - CONFIG.physics.gravity; // ensure after gravity, still <= flapImpulse
          const gameState = createTestGameState({ velocity: veryLowVelocity });
          const ghost = gameState.entities.ghost;

          updatePhysics(gameState, CONFIG.physics.frameTime);

          // If post-gravity velocity <= flapImpulse, rotation should be maxUp
          if (ghost.velocity <= CONFIG.physics.flapImpulse) {
            expect(ghost.rotation).toBeCloseTo(CONFIG.rotation.maxUp, 10);
          }
        }
      ),
      testConfig
    );
  });

  it('rotation is clamped to maxDown for velocities at terminal velocity', () => {
    fc.assert(
      fc.property(
        fc.double({
          min: CONFIG.physics.terminalVelocity - CONFIG.physics.gravity,
          max: 50,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        (velocity) => {
          const gameState = createTestGameState({ velocity });
          const ghost = gameState.entities.ghost;

          updatePhysics(gameState, CONFIG.physics.frameTime);

          // If post-gravity velocity >= terminalVelocity, rotation should be maxDown
          if (ghost.velocity >= CONFIG.physics.terminalVelocity) {
            expect(ghost.rotation).toBeCloseTo(CONFIG.rotation.maxDown, 10);
          }
        }
      ),
      testConfig
    );
  });

  it('rotation is always within [maxUp, maxDown] bounds', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -50, max: 50, noNaN: true, noDefaultInfinity: true }),
        (velocity) => {
          const gameState = createTestGameState({ velocity });
          const ghost = gameState.entities.ghost;

          updatePhysics(gameState, CONFIG.physics.frameTime);

          expect(ghost.rotation).toBeGreaterThanOrEqual(CONFIG.rotation.maxUp);
          expect(ghost.rotation).toBeLessThanOrEqual(CONFIG.rotation.maxDown);
        }
      ),
      testConfig
    );
  });
});
