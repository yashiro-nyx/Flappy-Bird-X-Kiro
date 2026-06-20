// physics.js - Gravity, velocity, scrolling, delta-time normalization
import { CONFIG } from './config.js';

const MAX_DT_MULTIPLIER = 3;

/**
 * Generate a new pipe pair if the last pipe has scrolled far enough from the
 * right edge. Acquires one pipe object from the pool representing the full pair,
 * randomizes the gap center within valid bounds, and sets all pipe properties.
 *
 * @param {object} gameState - The full game state object
 */
export function generatePipes(gameState) {
  if (gameState.current !== 'playing') return;

  const { entities } = gameState;
  if (!entities.pipePool) return;

  const activePipes = entities.pipePool.getActive();

  // Determine if we need a new pipe pair:
  // Generate when the last pipe's x position has scrolled to at most
  // (canvasWidth - spacing) from the left, i.e., its left edge is at
  // canvasWidth - spacing or less.
  let needNewPipe = false;

  if (activePipes.length === 0) {
    // No pipes exist yet — generate the first pair
    needNewPipe = true;
  } else {
    // Find the rightmost pipe (highest x value)
    let maxX = -Infinity;
    for (let i = 0; i < activePipes.length; i++) {
      if (activePipes[i].x > maxX) {
        maxX = activePipes[i].x;
      }
    }
    // Generate new pipe when the rightmost pipe has scrolled 280px from the right edge
    // i.e., its x <= canvasWidth - spacing
    if (maxX <= CONFIG.canvas.width - CONFIG.pipes.spacing) {
      needNewPipe = true;
    }
  }

  if (needNewPipe) {
    const gapHeight = CONFIG.pipes.gapHeight;

    // Valid gap center range: ensure at least minTopHeight visible at top
    // and minBottomHeight visible at bottom (above score bar)
    const minGapCenter = CONFIG.pipes.minTopHeight + gapHeight / 2;
    const maxGapCenter = CONFIG.canvas.height - CONFIG.scoreBar.height - CONFIG.pipes.minBottomHeight - gapHeight / 2;

    // Randomize gap center within valid bounds
    const gapCenter = minGapCenter + Math.random() * (maxGapCenter - minGapCenter);

    const topHeight = gapCenter - gapHeight / 2;
    const bottomY = gapCenter + gapHeight / 2;

    // Acquire a single pipe object per pair — the renderer and collision system
    // both use topHeight and bottomY from one object to draw/test both halves
    const pipe = entities.pipePool.acquire();
    pipe.x = CONFIG.canvas.width;
    pipe.topHeight = topHeight;
    pipe.bottomY = bottomY;
    pipe.width = CONFIG.pipes.width;
    pipe.capWidth = CONFIG.pipes.capWidth;
    pipe.capHeight = CONFIG.pipes.capHeight;
    pipe.gapCenter = gapCenter;
    pipe.scored = false;
  }
}

/**
 * Release pipes back to the pool when they have fully scrolled off-screen
 * (right edge < 0).
 *
 * @param {object} gameState - The full game state object
 */
export function cleanupPipes(gameState) {
  if (!gameState.entities.pipePool) return;

  const activePipes = gameState.entities.pipePool.getActive();
  for (let i = 0; i < activePipes.length; i++) {
    const pipe = activePipes[i];
    if (pipe.x + pipe.width < 0) {
      gameState.entities.pipePool.release(pipe);
    }
  }
}

/**
 * Apply a flap impulse to the ghost, setting its velocity to the configured
 * flap impulse value regardless of current velocity.
 * @param {object} ghost - The ghost entity
 */
export function applyFlap(ghost) {
  ghost.velocity = CONFIG.physics.flapImpulse;
}

/**
 * Main physics update. Applies gravity, scrolls pipes/clouds, updates particles
 * and score popups. All motion is delta-time normalized.
 *
 * @param {object} gameState - The full game state object
 * @param {number} dt - Raw delta time in milliseconds since last frame
 */
export function updatePhysics(gameState, dt) {
  // Skip all updates if paused
  if (gameState.current === 'paused') return;

  // Clamp dt to prevent physics explosion after tab backgrounding
  const maxDt = CONFIG.physics.frameTime * MAX_DT_MULTIPLIER;
  const clampedDt = Math.min(dt, maxDt);

  // Delta-time factor: 1.0 means exactly one frame at target FPS
  const dtFactor = clampedDt / CONFIG.physics.frameTime;

  const { entities, speedMultiplier } = gameState;
  const ghost = entities.ghost;

  // --- Ghost gravity and velocity ---
  ghost.velocity += CONFIG.physics.gravity * dtFactor;
  if (ghost.velocity > CONFIG.physics.terminalVelocity) {
    ghost.velocity = CONFIG.physics.terminalVelocity;
  }

  // --- Ghost position integration ---
  ghost.y += ghost.velocity * dtFactor;

  // Ghost x is FIXED — never changes
  // ghost.x = CONFIG.ghost.x; (invariant, not reassigned)

  // --- Recalculate ghost hitbox center after position update ---
  ghost.centerX = ghost.x + ghost.width / 2;
  ghost.centerY = ghost.y + ghost.height / 2;

  // --- Ghost rotation based on velocity interpolation ---
  // Linearly map velocity from [flapImpulse, terminalVelocity] to [maxUp, maxDown]
  const velocityRange = CONFIG.physics.terminalVelocity - CONFIG.physics.flapImpulse;
  const velocityNormalized = (ghost.velocity - CONFIG.physics.flapImpulse) / velocityRange;
  const clampedNorm = Math.max(0, Math.min(1, velocityNormalized));
  ghost.rotation = CONFIG.rotation.maxUp + clampedNorm * (CONFIG.rotation.maxDown - CONFIG.rotation.maxUp);

  // --- Pipe scrolling ---
  const pipeSpeed = CONFIG.pipes.baseSpeed * speedMultiplier * dtFactor;
  if (entities.pipePool) {
    const activePipes = entities.pipePool.getActive();
    for (let i = 0; i < activePipes.length; i++) {
      activePipes[i].x -= pipeSpeed;
    }
  }

  // --- Cloud scrolling and recycling ---
  if (entities.clouds) {
    for (let i = 0; i < entities.clouds.length; i++) {
      const cloud = entities.clouds[i];
      cloud.x -= cloud.speed * dtFactor;

      // Reposition cloud when it fully scrolls off-screen left
      if (cloud.x + cloud.width < 0) {
        // Randomize new dimensions for variety
        cloud.width = CONFIG.clouds.width.min + Math.random() * (CONFIG.clouds.width.max - CONFIG.clouds.width.min);
        cloud.height = CONFIG.clouds.height.min + Math.random() * (CONFIG.clouds.height.max - CONFIG.clouds.height.min);
        cloud.cornerRadius = cloud.height / 2;

        // Reposition to just off the right edge with a random vertical position
        cloud.x = CONFIG.canvas.width;
        cloud.y = Math.random() * (CONFIG.canvas.height - CONFIG.scoreBar.height - cloud.height);

        // Recalculate correlated opacity and speed
        const t = Math.random();
        cloud.opacity = CONFIG.clouds.opacity.min + t * (CONFIG.clouds.opacity.max - CONFIG.clouds.opacity.min);
        const speedFactor = CONFIG.clouds.speedFactor.min + t * (CONFIG.clouds.speedFactor.max - CONFIG.clouds.speedFactor.min);
        cloud.speed = CONFIG.pipes.baseSpeed * speedFactor;
      }
    }
  }

  // --- Particle updates ---
  if (entities.particlePool) {
    const activeParticles = entities.particlePool.getActive();
    for (let i = 0; i < activeParticles.length; i++) {
      const particle = activeParticles[i];
      particle.age += clampedDt;
      // Fade opacity linearly over lifetime
      const lifeProgress = particle.age / particle.lifetime;
      particle.opacity = CONFIG.particles.initialOpacity * (1 - lifeProgress);
      // Drift position
      particle.x += particle.velocityX * dtFactor;
      particle.y += particle.velocityY * dtFactor;
      // Release expired particles back to pool
      if (particle.age >= particle.lifetime) {
        entities.particlePool.release(particle);
      }
    }
  }

  // --- Score popup updates ---
  if (entities.scorePopups) {
    for (let i = entities.scorePopups.length - 1; i >= 0; i--) {
      const popup = entities.scorePopups[i];
      popup.age += clampedDt;
      // Fade opacity linearly over lifetime
      const lifeProgress = popup.age / popup.lifetime;
      popup.opacity = 1 - lifeProgress;
      // Float upward
      popup.y += CONFIG.scorePopup.floatSpeed * dtFactor;
      // Remove expired popups
      if (popup.age >= popup.lifetime) {
        entities.scorePopups.splice(i, 1);
      }
    }
  }
}
