// Property-based tests for scoring (Properties 11, 12)
// Feature: flappy-kiro
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { CONFIG } from '../js/config.js';
import { updateScoring } from '../js/scoring.js';
import { ObjectPool, createPipe } from '../js/entities.js';

const testConfig = { numRuns: 100 };

/**
 * Helper to create a minimal game state for scoring tests.
 */
function createScoringGameState(overrides = {}) {
  const pipePool = new ObjectPool(createPipe, 10);
  return {
    current: 'playing',
    score: 0,
    highScore: 0,
    speedMultiplier: 1.0,
    entities: {
      ghost: {
        x: CONFIG.ghost.x,
        y: CONFIG.ghost.startY,
        width: CONFIG.ghost.width,
        height: CONFIG.ghost.height,
      },
      pipePool,
      scorePopups: [],
    },
    scorePulse: {
      active: false,
      timer: 0,
      scale: 1.0,
    },
    ...overrides,
  };
}

/**
 * Helper to add an active pipe pair at a given x position.
 */
function addPipePairAt(pipePool, x, scored = false) {
  const topPipe = pipePool.acquire();
  topPipe.x = x;
  topPipe.width = CONFIG.pipes.width;
  topPipe.topHeight = 100;
  topPipe.bottomY = 250;
  topPipe.gapCenter = 175;
  topPipe.scored = scored;

  const bottomPipe = pipePool.acquire();
  bottomPipe.x = x;
  bottomPipe.width = CONFIG.pipes.width;
  bottomPipe.topHeight = 100;
  bottomPipe.bottomY = 250;
  bottomPipe.gapCenter = 175;
  bottomPipe.scored = scored;

  return [topPipe, bottomPipe];
}

describe('Property 11: Score increments exactly once per pipe', () => {
  // **Validates: Requirements 5.1**

  it('score increments by exactly 1 when a pipe right edge crosses ghost x', () => {
    fc.assert(
      fc.property(
        // Generate pipe x positions where right edge is past ghost x
        // pipeRightEdge = x + width < ghost.x means x < ghost.x - width
        fc.integer({ min: 0, max: CONFIG.ghost.x - CONFIG.pipes.width - 1 }),
        (pipeX) => {
          const gameState = createScoringGameState();
          addPipePairAt(gameState.entities.pipePool, pipeX, false);

          const scoreBefore = gameState.score;
          updateScoring(gameState);

          // Score should increment by exactly 1
          expect(gameState.score).toBe(scoreBefore + 1);
        }
      ),
      testConfig
    );
  });

  it('score does NOT increment when pipe right edge has not crossed ghost x', () => {
    fc.assert(
      fc.property(
        // Pipe x positions where right edge is still beyond ghost x
        // pipeRightEdge = x + width >= ghost.x means x >= ghost.x - width
        fc.integer({ min: CONFIG.ghost.x - CONFIG.pipes.width, max: CONFIG.canvas.width }),
        (pipeX) => {
          const gameState = createScoringGameState();
          addPipePairAt(gameState.entities.pipePool, pipeX, false);

          updateScoring(gameState);

          // Score should remain 0
          expect(gameState.score).toBe(0);
        }
      ),
      testConfig
    );
  });

  it('calling updateScoring again on an already-scored pipe does NOT increment score', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: CONFIG.ghost.x - CONFIG.pipes.width - 1 }),
        fc.integer({ min: 1, max: 10 }),
        (pipeX, extraCalls) => {
          const gameState = createScoringGameState();
          addPipePairAt(gameState.entities.pipePool, pipeX, false);

          // First call scores the pipe
          updateScoring(gameState);
          expect(gameState.score).toBe(1);

          // Subsequent calls should not increment again (idempotent via scored flag)
          for (let i = 0; i < extraCalls; i++) {
            updateScoring(gameState);
          }

          expect(gameState.score).toBe(1);
        }
      ),
      testConfig
    );
  });

  it('each pipe pair increments score exactly once regardless of how many pipes pass', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (numPipePairs) => {
          const gameState = createScoringGameState();

          // Add multiple pipe pairs, all past ghost x (all should score)
          for (let i = 0; i < numPipePairs; i++) {
            const x = CONFIG.ghost.x - CONFIG.pipes.width - 1 - (i * CONFIG.pipes.spacing);
            // Ensure x stays non-negative
            if (x >= 0) {
              addPipePairAt(gameState.entities.pipePool, x, false);
            }
          }

          const activePipes = gameState.entities.pipePool.getActive();
          const expectedScore = activePipes.length / 2; // Each pair = 1 score

          updateScoring(gameState);

          expect(gameState.score).toBe(expectedScore);
        }
      ),
      testConfig
    );
  });
});

describe('Property 12: High score is max of current and stored', () => {
  // **Validates: Requirements 5.4**

  it('high score updates to current score when current exceeds stored', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (storedHighScore, additionalScore) => {
          // Set up game state with a stored high score
          const gameState = createScoringGameState({
            highScore: storedHighScore,
            score: storedHighScore + additionalScore,
          });

          // Add a pipe that will be scored to trigger high score check
          addPipePairAt(
            gameState.entities.pipePool,
            CONFIG.ghost.x - CONFIG.pipes.width - 1,
            false
          );

          updateScoring(gameState);

          // After scoring, score = storedHighScore + additionalScore + 1
          const newScore = storedHighScore + additionalScore + 1;
          expect(gameState.score).toBe(newScore);

          // High score should be max(newScore, storedHighScore)
          expect(gameState.highScore).toBe(Math.max(newScore, storedHighScore));
        }
      ),
      testConfig
    );
  });

  it('high score remains unchanged when current score does not exceed it', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 1000 }),
        (highScore) => {
          // Score starts at 0, high score is already set high
          const gameState = createScoringGameState({
            highScore,
            score: 0,
          });

          // Add a pipe to trigger scoring (score becomes 1)
          addPipePairAt(
            gameState.entities.pipePool,
            CONFIG.ghost.x - CONFIG.pipes.width - 1,
            false
          );

          updateScoring(gameState);

          // Score is now 1, which is less than highScore (>=2)
          expect(gameState.score).toBe(1);
          expect(gameState.highScore).toBe(highScore);
        }
      ),
      testConfig
    );
  });

  it('high score equals max(currentScore, storedHighScore) for any pair of values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 0, max: 500 }),
        (currentScore, storedHighScore) => {
          // Simulate the high score logic directly as per the scoring function
          const gameState = createScoringGameState({
            highScore: storedHighScore,
            score: currentScore,
          });

          // Add a pipe to trigger scoring (score becomes currentScore + 1)
          addPipePairAt(
            gameState.entities.pipePool,
            CONFIG.ghost.x - CONFIG.pipes.width - 1,
            false
          );

          updateScoring(gameState);

          const finalScore = currentScore + 1;
          const expectedHighScore = Math.max(finalScore, storedHighScore);
          expect(gameState.highScore).toBe(expectedHighScore);
        }
      ),
      testConfig
    );
  });
});
