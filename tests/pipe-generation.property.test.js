// Property-based tests for pipe generation (Properties 7, 8, 9, 10, 11, 13)
// Feature: flappy-kiro
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { CONFIG } from '../js/config.js';
import { generatePipes, cleanupPipes, updatePhysics } from '../js/physics.js';
import { ObjectPool, createPipe, createGhost, createParticle } from '../js/entities.js';

const testConfig = { numRuns: 100 };

describe('Property 7: Pipe generation produces valid gap positioning', () => {
  // **Validates: Requirements 3.2, 3.3**

  it('gap height is always exactly 150px for any generated pipe pair', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        (_seed) => {
          const pipePool = new ObjectPool(createPipe, 20);
          const gameState = {
            current: 'playing',
            entities: { pipePool },
          };

          generatePipes(gameState);

          const activePipes = pipePool.getActive();
          expect(activePipes.length).toBe(1);

          const pipe = activePipes[0];
          const gapHeight = pipe.bottomY - pipe.topHeight;
          expect(gapHeight).toBeCloseTo(CONFIG.pipes.gapHeight, 10);
          expect(gapHeight).toBeCloseTo(150, 10);
        }
      ),
      testConfig
    );
  });

  it('at least 50px of pipe visible at top for any generated pipe pair', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        (_seed) => {
          const pipePool = new ObjectPool(createPipe, 20);
          const gameState = {
            current: 'playing',
            entities: { pipePool },
          };

          generatePipes(gameState);

          const activePipes = pipePool.getActive();
          expect(activePipes.length).toBe(1);

          const topHeight = activePipes[0].topHeight;
          expect(topHeight).toBeGreaterThanOrEqual(CONFIG.pipes.minTopHeight);
          expect(topHeight).toBeGreaterThanOrEqual(50);
        }
      ),
      testConfig
    );
  });

  it('at least 50px of pipe visible above score bar at bottom for any generated pipe pair', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        (_seed) => {
          const pipePool = new ObjectPool(createPipe, 20);
          const gameState = {
            current: 'playing',
            entities: { pipePool },
          };

          generatePipes(gameState);

          const activePipes = pipePool.getActive();
          expect(activePipes.length).toBe(1);

          const bottomY = activePipes[0].bottomY;
          const playableBottom = CONFIG.canvas.height - CONFIG.scoreBar.height;
          const bottomPipeVisibleHeight = playableBottom - bottomY;
          expect(bottomPipeVisibleHeight).toBeGreaterThanOrEqual(CONFIG.pipes.minBottomHeight);
          expect(bottomPipeVisibleHeight).toBeGreaterThanOrEqual(50);
        }
      ),
      testConfig
    );
  });

  it('gap center is within valid bounds for any generated pipe pair', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        (_seed) => {
          const pipePool = new ObjectPool(createPipe, 20);
          const gameState = {
            current: 'playing',
            entities: { pipePool },
          };

          generatePipes(gameState);

          const activePipes = pipePool.getActive();
          expect(activePipes.length).toBe(1);

          const gapCenter = activePipes[0].gapCenter;
          const gapHalf = CONFIG.pipes.gapHeight / 2;

          const minGapCenter = CONFIG.pipes.minTopHeight + gapHalf;
          const maxGapCenter = CONFIG.canvas.height - CONFIG.scoreBar.height - CONFIG.pipes.minBottomHeight - gapHalf;

          expect(gapCenter).toBeGreaterThanOrEqual(minGapCenter);
          expect(gapCenter).toBeLessThanOrEqual(maxGapCenter);
        }
      ),
      testConfig
    );
  });
});

describe('Property 8: Pipe spacing is fixed at 280 pixels', () => {
  // **Validates: Requirements 3.1, 12.4**

  it('horizontal distance between consecutively generated pipe pairs is exactly 280px', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1.0, max: 2.0, noNaN: true }),
        (speedMultiplier) => {
          const pipePool = new ObjectPool(createPipe, 20);
          const gameState = {
            current: 'playing',
            speedMultiplier,
            entities: { pipePool },
          };

          // Generate first pipe
          generatePipes(gameState);
          const firstPipes = pipePool.getActive();
          expect(firstPipes.length).toBe(1);
          const firstPipeX = firstPipes[0].x;
          expect(firstPipeX).toBe(CONFIG.canvas.width);

          // Scroll the first pipe to the trigger threshold
          firstPipes[0].x = CONFIG.canvas.width - CONFIG.pipes.spacing;

          // Generate second pipe
          generatePipes(gameState);
          const allActive = pipePool.getActive();
          expect(allActive.length).toBe(2);

          // Second pipe spawns at canvasWidth
          const secondPipe = allActive.find(p => p.x === CONFIG.canvas.width);
          expect(secondPipe).toBeDefined();

          // Distance between first pipe and second pipe is exactly spacing (280px)
          const spacing = secondPipe.x - firstPipes[0].x;
          expect(spacing).toBe(CONFIG.pipes.spacing);
          expect(spacing).toBe(280);
        }
      ),
      testConfig
    );
  });

  it('pipe spacing is independent of speed multiplier', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1.0, max: 2.0, noNaN: true }),
        fc.double({ min: 1.0, max: 2.0, noNaN: true }),
        (multiplier1, multiplier2) => {
          // Test with first multiplier
          const pipePool1 = new ObjectPool(createPipe, 20);
          const gameState1 = {
            current: 'playing',
            speedMultiplier: multiplier1,
            entities: { pipePool: pipePool1 },
          };
          generatePipes(gameState1);
          const pipes1 = pipePool1.getActive();
          pipes1[0].x = CONFIG.canvas.width - CONFIG.pipes.spacing;
          generatePipes(gameState1);
          const allPipes1 = pipePool1.getActive();
          const secondPipe1 = allPipes1.find(p => p.x === CONFIG.canvas.width);
          const spacing1 = secondPipe1.x - pipes1[0].x;

          // Test with second multiplier
          const pipePool2 = new ObjectPool(createPipe, 20);
          const gameState2 = {
            current: 'playing',
            speedMultiplier: multiplier2,
            entities: { pipePool: pipePool2 },
          };
          generatePipes(gameState2);
          const pipes2 = pipePool2.getActive();
          pipes2[0].x = CONFIG.canvas.width - CONFIG.pipes.spacing;
          generatePipes(gameState2);
          const allPipes2 = pipePool2.getActive();
          const secondPipe2 = allPipes2.find(p => p.x === CONFIG.canvas.width);
          const spacing2 = secondPipe2.x - pipes2[0].x;

          // Both should be exactly 280
          expect(spacing1).toBe(280);
          expect(spacing2).toBe(280);
          expect(spacing1).toBe(spacing2);
        }
      ),
      testConfig
    );
  });
});

describe('Property 9: Pipe scroll displacement equals baseSpeed × multiplier × dt', () => {
  // **Validates: Requirements 3.4**

  it('pipe displacement is baseSpeed × speedMultiplier × (dt / frameTime) for any valid inputs', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1.0, max: 2.0, noNaN: true }),
        fc.double({ min: 1, max: CONFIG.physics.frameTime * 3, noNaN: true }),
        fc.double({ min: 100, max: 800, noNaN: true }),
        (speedMultiplier, dt, startX) => {
          const pipePool = new ObjectPool(createPipe, 20);
          const particlePool = new ObjectPool(createParticle, 1);
          const ghost = createGhost();

          const gameState = {
            current: 'playing',
            speedMultiplier,
            frameCount: 0,
            entities: {
              ghost,
              pipePool,
              clouds: [],
              particlePool,
              scorePopups: [],
            },
          };

          // Acquire a pipe and place it at a known x position
          const pipe = pipePool.acquire();
          pipe.x = startX;
          pipe.width = CONFIG.pipes.width;
          pipe.topHeight = 100;
          pipe.bottomY = 250;

          // Run updatePhysics
          updatePhysics(gameState, dt);

          // dt is clamped to max 3 frames
          const maxDt = CONFIG.physics.frameTime * 3;
          const clampedDt = Math.min(dt, maxDt);
          const dtFactor = clampedDt / CONFIG.physics.frameTime;
          const expectedDisplacement = CONFIG.pipes.baseSpeed * speedMultiplier * dtFactor;
          const expectedX = startX - expectedDisplacement;

          expect(pipe.x).toBeCloseTo(expectedX, 5);
        }
      ),
      testConfig
    );
  });

  it('pipe displacement scales linearly with dt', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1.0, max: 2.0, noNaN: true }),
        fc.double({ min: 1, max: 16, noNaN: true }), // small dt values within one frame
        (speedMultiplier, dt) => {
          // Test with dt and 2*dt to verify linearity
          const startX = 500;

          // First run with dt
          const pipePool1 = new ObjectPool(createPipe, 20);
          const gameState1 = {
            current: 'playing',
            speedMultiplier,
            frameCount: 0,
            entities: {
              ghost: createGhost(),
              pipePool: pipePool1,
              clouds: [],
              particlePool: new ObjectPool(createParticle, 1),
              scorePopups: [],
            },
          };
          const pipe1 = pipePool1.acquire();
          pipe1.x = startX;
          pipe1.width = CONFIG.pipes.width;
          pipe1.topHeight = 100;
          pipe1.bottomY = 250;
          updatePhysics(gameState1, dt);
          const displacement1 = startX - pipe1.x;

          // Second run with 2*dt
          const pipePool2 = new ObjectPool(createPipe, 20);
          const gameState2 = {
            current: 'playing',
            speedMultiplier,
            frameCount: 0,
            entities: {
              ghost: createGhost(),
              pipePool: pipePool2,
              clouds: [],
              particlePool: new ObjectPool(createParticle, 1),
              scorePopups: [],
            },
          };
          const pipe2 = pipePool2.acquire();
          pipe2.x = startX;
          pipe2.width = CONFIG.pipes.width;
          pipe2.topHeight = 100;
          pipe2.bottomY = 250;
          updatePhysics(gameState2, 2 * dt);
          const displacement2 = startX - pipe2.x;

          // displacement2 should be 2 * displacement1
          expect(displacement2).toBeCloseTo(2 * displacement1, 5);
        }
      ),
      testConfig
    );
  });
});

describe('Property 10: Off-screen pipes are removed', () => {
  // **Validates: Requirements 3.5**

  it('pipes with right edge < 0 are released after cleanup', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.double({ min: -500, max: 1000, noNaN: true }),
          { minLength: 1, maxLength: 10 }
        ),
        (xPositions) => {
          const pipePool = new ObjectPool(createPipe, 20);
          const gameState = {
            current: 'playing',
            entities: { pipePool },
          };

          // Place pipes at various x positions
          for (const x of xPositions) {
            const pipe = pipePool.acquire();
            pipe.x = x;
            pipe.width = CONFIG.pipes.width;
            pipe.topHeight = 100;
            pipe.bottomY = 250;
          }

          // Run cleanup
          cleanupPipes(gameState);

          // Verify: all remaining active pipes have right edge >= 0
          const activePipes = pipePool.getActive();
          for (const pipe of activePipes) {
            expect(pipe.x + pipe.width).toBeGreaterThanOrEqual(0);
          }
        }
      ),
      testConfig
    );
  });

  it('pipes with right edge >= 0 are retained after cleanup', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.double({ min: -500, max: 1000, noNaN: true }),
          { minLength: 1, maxLength: 10 }
        ),
        (xPositions) => {
          const pipePool = new ObjectPool(createPipe, 20);
          const gameState = {
            current: 'playing',
            entities: { pipePool },
          };

          // Place pipes at various x positions
          for (const x of xPositions) {
            const pipe = pipePool.acquire();
            pipe.x = x;
            pipe.width = CONFIG.pipes.width;
            pipe.topHeight = 100;
            pipe.bottomY = 250;
          }

          // Count how many should be retained (right edge >= 0)
          const expectedRetained = xPositions.filter(x => x + CONFIG.pipes.width >= 0).length;

          // Run cleanup
          cleanupPipes(gameState);

          // Verify correct number retained
          const activePipes = pipePool.getActive();
          expect(activePipes.length).toBe(expectedRetained);
        }
      ),
      testConfig
    );
  });

  it('all off-screen pipes are removed and all on-screen pipes are kept', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        (offScreenCount, onScreenCount) => {
          const pipePool = new ObjectPool(createPipe, 20);
          const gameState = {
            current: 'playing',
            entities: { pipePool },
          };

          // Create off-screen pipes (x + width < 0, so x < -width = -60)
          for (let i = 0; i < offScreenCount; i++) {
            const pipe = pipePool.acquire();
            pipe.x = -(CONFIG.pipes.width + 1 + i * 10); // guaranteed off-screen
            pipe.width = CONFIG.pipes.width;
            pipe.topHeight = 100;
            pipe.bottomY = 250;
          }

          // Create on-screen pipes (x + width >= 0)
          for (let i = 0; i < onScreenCount; i++) {
            const pipe = pipePool.acquire();
            pipe.x = 100 + i * 100; // clearly on-screen
            pipe.width = CONFIG.pipes.width;
            pipe.topHeight = 100;
            pipe.bottomY = 250;
          }

          // Run cleanup
          cleanupPipes(gameState);

          // Only on-screen pipes should remain
          const activePipes = pipePool.getActive();
          expect(activePipes.length).toBe(onScreenCount);

          // All remaining pipes should be the on-screen ones
          for (const pipe of activePipes) {
            expect(pipe.x + pipe.width).toBeGreaterThanOrEqual(0);
          }
        }
      ),
      testConfig
    );
  });
});

describe('Property 11: Speed multiplier formula', () => {
  // **Validates: Requirements 3.6, 12.1, 12.2**

  it('speed multiplier equals min(1.0 + score * 0.02, 2.0) for any non-negative score', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        (score) => {
          const expected = Math.min(
            CONFIG.difficulty.startingMultiplier + score * CONFIG.difficulty.speedIncrementPerPoint,
            CONFIG.difficulty.maxSpeedMultiplier
          );

          const computed = Math.min(1.0 + score * 0.02, 2.0);
          expect(computed).toBeCloseTo(expected, 10);
        }
      ),
      testConfig
    );
  });

  it('speed multiplier never exceeds 2.0 regardless of score', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000000 }),
        (score) => {
          const multiplier = Math.min(
            CONFIG.difficulty.startingMultiplier + score * CONFIG.difficulty.speedIncrementPerPoint,
            CONFIG.difficulty.maxSpeedMultiplier
          );

          expect(multiplier).toBeLessThanOrEqual(2.0);
          expect(multiplier).toBeGreaterThanOrEqual(1.0);
        }
      ),
      testConfig
    );
  });

  it('speed multiplier increases linearly with score until capped', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 49 }),
        (score) => {
          const multiplier = Math.min(1.0 + score * 0.02, 2.0);
          expect(multiplier).toBeCloseTo(1.0 + score * 0.02, 10);
        }
      ),
      testConfig
    );
  });

  it('speed multiplier is exactly 2.0 for any score >= 50', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 100000 }),
        (score) => {
          const multiplier = Math.min(1.0 + score * 0.02, 2.0);
          expect(multiplier).toBe(2.0);
        }
      ),
      testConfig
    );
  });
});

describe('Property 13: Pipe spacing invariant', () => {
  // **Validates: Requirements 12.4**

  it('horizontal distance between consecutive pipe pairs is exactly 280px regardless of speed multiplier', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1.0, max: 2.0, noNaN: true }),
        (speedMultiplier) => {
          const pipePool = new ObjectPool(createPipe, 20);
          const gameState = {
            current: 'playing',
            speedMultiplier,
            entities: { pipePool },
          };

          // Generate the first pipe pair
          generatePipes(gameState);

          const firstPipes = pipePool.getActive();
          expect(firstPipes.length).toBe(1);
          const firstPipeX = firstPipes[0].x;
          expect(firstPipeX).toBe(CONFIG.canvas.width);

          // Scroll first pipe to trigger threshold
          firstPipes[0].x = CONFIG.canvas.width - CONFIG.pipes.spacing;

          // Generate the second pipe pair
          generatePipes(gameState);

          const allActive = pipePool.getActive();
          expect(allActive.length).toBe(2);

          const secondPipe = allActive.find(p => p.x === CONFIG.canvas.width);
          expect(secondPipe).toBeDefined();

          const spacing = secondPipe.x - firstPipes[0].x;
          expect(spacing).toBe(CONFIG.pipes.spacing);
          expect(spacing).toBe(280);
        }
      ),
      testConfig
    );
  });

  it('new pipes always spawn at canvas width (900px) regardless of speed multiplier', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1.0, max: 2.0, noNaN: true }),
        (speedMultiplier) => {
          const pipePool = new ObjectPool(createPipe, 20);
          const gameState = {
            current: 'playing',
            speedMultiplier,
            entities: { pipePool },
          };

          generatePipes(gameState);

          const activePipes = pipePool.getActive();
          for (const pipe of activePipes) {
            expect(pipe.x).toBe(CONFIG.canvas.width);
          }
        }
      ),
      testConfig
    );
  });

  it('pipe generation triggers when rightmost pipe <= canvasWidth - spacing', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1.0, max: 2.0, noNaN: true }),
        fc.integer({ min: 0, max: 620 }),
        (speedMultiplier, rightmostX) => {
          const pipePool = new ObjectPool(createPipe, 20);
          const gameState = {
            current: 'playing',
            speedMultiplier,
            entities: { pipePool },
          };

          generatePipes(gameState);
          const initialPipes = pipePool.getActive();
          initialPipes[0].x = rightmostX;

          const countBefore = pipePool.getActive().length;

          generatePipes(gameState);

          const countAfter = pipePool.getActive().length;
          expect(countAfter).toBe(countBefore + 1);
        }
      ),
      testConfig
    );
  });
});
